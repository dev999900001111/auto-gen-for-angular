import * as  fs from 'fs';
import fss from './fss';
import { TiktokenModel } from 'tiktoken';
import { OpenAIApiWrapper } from "./openai-api-wrapper";

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

/**
 * ステップの基本クラス
 * プロンプトと結果をファイル出力する。
 */
export abstract class BaseStep extends BaseStepInterface<string> {

    /** default parameters */
    model = 'gpt-3.5-turbo';
    systemMessage = 'You are an experienced and talented software engineer.';
    assistantMessage = '';
    temperature = 0.0;

    /** create prompt */
    chapters: StructuredPrompt[] = []; // {title: string, content: string, children: chapters[]}

    /** io */
    get promptPath() { return `./prompts/${this.label}.prompt.md`; }
    get resultPath() { return `./prompts/${this.label}.result.md`; }

    get prompt() { return fs.readFileSync(this.promptPath, 'utf-8'); }
    get result() { return fs.readFileSync(this.resultPath, 'utf-8'); }

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
                let isInit = false;
                const streamHandler = ((data: string) => {
                    (isInit ? fss.appendFile : fss.writeFile)(`${this.resultPath}.tmp`, data, (err: any) => { if (err) console.error(err); });
                    isInit = true;
                }).bind(this);

                aiApi.call(this.label, prompt, this.model as TiktokenModel, this.temperature, this.systemMessage, this.assistantMessage, streamHandler).then((content: string) => {
                    fs.rename(`${this.resultPath}.tmp`, this.resultPath, () => resolve(this.postProcess(content)));
                }).catch((err: any) => {
                    reject(err);
                });
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