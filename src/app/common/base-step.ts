import * as  fs from 'fs';
import fss from './fss';
import { GPTModels, OpenAIApiWrapper } from "./openai-api-wrapper";
import { Utils } from './utils';
import { finalize, tap } from 'rxjs';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// aiApi as singleton (for queing requests)
export const aiApi = new OpenAIApiWrapper();

export interface StructuredPrompt {
    title?: string;
    content?: string;
    contentJp?: string;
    contentEn?: string;
    children?: StructuredPrompt[];
}

/**
 * [{title: 'hoge', content: 'fuga', children: [{title: 'hoge', content: 'fuga'}]}]のようなオブジェクトをMarkdownに変換する
 * @param {{ title: string, content: string, children: any[] }} chapter
 * @param {number} layer
 * @returns {string}
 */
function toMarkdown(chapter: StructuredPrompt, layer: number = 1) {
    let sb = '';
    if (chapter.title) {
        sb += `\n${'#'.repeat(layer)} ${chapter.title}\n\n`;
    } else { }
    let content;
    content = chapter.contentJp || chapter.contentEn;
    content = chapter.content;
    if (content) {
        sb += `${content}\n\n`;
    } else { }
    if (chapter.children) {
        chapter.children.forEach(child => {
            // console.log(child);
            sb += toMarkdown(child, layer + 1);
        });
    } else { }
    return sb;
}

export abstract class BaseStepInterface<T> {
    /** label */
    _label: string = '';

    get label() { return this._label || this.constructor.name; }
    set label(label) { this._label = label; }

    abstract initPrompt(): T;
    abstract preProcess(prompt: T): T;
    abstract run(): Promise<T>;
    abstract postProcess(result: T): T;
}

export enum StepOutputFormat {
    JSON = 'json',
    MARKDOWN = 'markdown',
    HTML = 'html',
    TEXT = 'text',
};

/**
 * ステップの基本クラス
 * プロンプトと結果をファイル出力する。
 */
export abstract class BaseStep extends BaseStepInterface<string> {

    /** default parameters */
    // model: GPTModels = 'gpt-3.5-turbo';
    // model: GPTModels = 'gpt-4';
    model: GPTModels = 'gpt-4-1106-preview';
    systemMessage = 'You are an experienced and talented software engineer.';
    assistantMessage = '';
    temperature = 0.0;
    format: StepOutputFormat = StepOutputFormat.MARKDOWN;

    /** create prompt */
    chapters: StructuredPrompt[] = []; // {title: string, content: string, children: chapters[]}

    /** io */
    get promptPath() { return `./prompts/${Utils.safeFileName(this.label)}.prompt.md`; }
    get resultPath() { return `./prompts/${Utils.safeFileName(this.label)}.result.md`; }
    get formedPath() { return `./prompts/${Utils.safeFileName(this.label)}.result.${{ markdown: 'md', text: 'txt' }[this.format as any as string] || this.format.toString()}`; }

    get prompt() { return fs.readFileSync(this.promptPath, 'utf-8'); }
    get result() { return fs.readFileSync(this.resultPath, 'utf-8'); }
    get formed() { return fs.readFileSync(this.formedPath, 'utf-8'); }

    initPrompt(): string {
        const prompt = this.chapters.map(chapter => toMarkdown(chapter)).join('\n');
        fss.writeFileSync(this.promptPath, prompt);
        return this.preProcess(prompt);
    }

    preProcess(prompt: string): string {
        return prompt;
    }

    /**
     * 
     * @returns 
     */
    async run(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            fs.readFile(this.promptPath, 'utf-8', (err, prompt: string) => {
                // messages
                const messages: ChatCompletionMessageParam[] = [];
                if (this.systemMessage) {
                    messages.push({ role: 'system', content: this.systemMessage });
                } else { }
                messages.push({ role: 'user', content: prompt });
                if (this.assistantMessage) {
                    messages.push({ role: 'assistant', content: this.assistantMessage });
                } else { }

                let content = '';
                let isInit = false;
                aiApi.chatCompletionObservableStream({
                    messages: messages,
                    model: this.model,
                    temperature: this.temperature,
                    response_format: { type: this.format === StepOutputFormat.JSON ? 'json_object' : 'text' },
                }, {
                    label: this.label
                }).pipe( // オペレータじゃなくSubscribeでも良かった。
                    // ストリームを結合する
                    tap(data => {
                        content += data;
                        (isInit ? fss.appendFile : fss.writeFile)(`${this.resultPath}.tmp`, data, (err: any) => { if (err) console.error(err); });
                        isInit = true;
                    }),
                    // ストリームの終了時に実行する処理
                    finalize(() => {
                        fss.waitQ(`${this.resultPath}.tmp`).then(() => {
                            fs.rename(`${this.resultPath}.tmp`, this.resultPath, () => {
                                // format
                                if (StepOutputFormat.JSON === this.format) {
                                    try {
                                        content = JSON.stringify(Utils.jsonParse(content, true), null, 2);
                                        fss.writeFile(this.formedPath, content, (err: any) => {
                                            if (err) reject(err);
                                            resolve(this.postProcess(content));
                                        });
                                    } catch (e: any) {
                                        // json整形に失敗する場合は整形用にもう一発。

                                        let correctPrompt = `Please correct the following JSON that is incorrect as JSON and output the correct one.\nPay particular attention to the number of parentheses and commas.\n`;
                                        correctPrompt += `\`\`\`json\n${content}\n\`\`\``;

                                        isInit = false;
                                        content = '';
                                        aiApi.chatCompletionObservableStream({
                                            messages: [
                                                { role: 'system', content: `All output is done in JSON.` },
                                                { role: 'user', content: correctPrompt },
                                            ],
                                            model: `gpt-3.5-turbo`,
                                            temperature: 0,
                                        }, {
                                            label: `${this.label}JsonCorrect`,
                                        }).pipe(
                                            tap(data => {
                                                content += data;
                                                (isInit ? fss.appendFile : fss.writeFile)(`${this.resultPath}.tmp`, data, (err: any) => { if (err) console.error(err); });
                                                isInit = true;
                                            }),
                                            finalize(() => {
                                                fss.waitQ(`${this.resultPath}.tmp`).then(() => {
                                                    try {
                                                        content = JSON.stringify(Utils.jsonParse(content), null, 2);
                                                        fss.writeFile(this.formedPath, content, (err: any) => {
                                                            if (err) reject(err);
                                                            fs.unlink(`${this.resultPath}.tmp`, () => { });
                                                            resolve(this.postProcess(content));
                                                        });
                                                    } catch (e: any) {
                                                        reject(e);
                                                    }
                                                });
                                            }),
                                        ).subscribe({ error: (err: any) => { reject(err); } });
                                    }
                                } else {
                                    resolve(this.postProcess(content));
                                }
                            });
                        });
                    }),
                ).subscribe({ error: (err: any) => { reject(err); } });
            });
        });
    }

    postProcess(result: string): string {
        return result;
    }
}

export class MultiStep extends BaseStepInterface<string[]> {

    constructor(
        public childStepList: BaseStep[] = []
    ) {
        super();
    }

    initPrompt(): string[] {
        return this.childStepList.map(step => step.initPrompt());
    }

    preProcess(prompt: string[]): string[] {
        return prompt;
    }

    async run(): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            Promise.all(this.childStepList.map(step => step.run())).then((resultList: string[]) => {
                resolve(this.postProcess(resultList));
            }).catch((err: any) => {
                reject(err);
            });
        });
    }

    postProcess(result: string[]): string[] {
        return result;
    }
}