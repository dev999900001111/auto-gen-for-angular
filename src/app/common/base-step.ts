import * as  fs from 'fs';
import fsq from './fsq';
import { TiktokenModel } from 'tiktoken';
import { OpenAIApiWrapper } from "./openai-api-wrapper";
import { StructuredPrompt, Utils } from "./utils";

export const aiApi = new OpenAIApiWrapper();

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
 * 基本クラス
 */
export abstract class BaseStep extends BaseStepInterface<string> {

    /** default parameters */
    model = 'gpt-3.5-turbo';
    systemMessage = 'You are an experienced and talented software engineer.';
    assistantMessage = '';

    /** create prompt */
    chapters: StructuredPrompt[] = []; // {title: string, content: string, children: chapters[]}

    /** io */
    get promptPath() { return `./prompts/${this.label}.prompt.md`; }
    get resultPath() { return `./prompts/${this.label}.result.md`; }

    get prompt() { return fs.readFileSync(this.promptPath, 'utf-8'); }
    get result() { return fs.readFileSync(this.resultPath, 'utf-8'); }

    initPrompt(): string {
        const prompt = this.chapters.map(chapter => Utils.toMarkdown(chapter)).join('\n');
        fs.writeFileSync(this.promptPath, prompt);
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
                    (isInit ? fsq.appendFile : fsq.writeFile)(`${this.resultPath}.tmp`, data, (err: any) => { if (err) console.error(err); });
                    isInit = true;
                }).bind(this);

                aiApi.call(this.label, prompt, this.model as TiktokenModel, this.systemMessage, this.assistantMessage, streamHandler).then((content: string) => {
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