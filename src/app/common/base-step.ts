import * as  fs from 'fs';
import { TiktokenModel } from 'tiktoken';
import { OpenAIApiWrapper } from "./openai-api-wrapper";
import { StructuredPrompt, Utils } from "./utils";

export const aiApi = new OpenAIApiWrapper();

/**
 * 基本クラス
 */
export abstract class BaseStep {

    /** default parameters */
    model = 'gpt-3.5-turbo';
    systemMessage = 'You are an experienced and talented software engineer.';
    assistantMessage = '';

    /** label */
    _label: string = '';
    get label() { return this._label || this.constructor.name; }
    set label(label) { this._label = label; }

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
                    (isInit ? fs.appendFile : fs.writeFile)(this.resultPath, data, () => { });
                    isInit = true;
                }).bind(this);

                aiApi.call(this.label, prompt, this.model as TiktokenModel, this.systemMessage, this.assistantMessage, streamHandler).then((content: string) => {
                    resolve(this.postProcess(content));
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

export class MultiRunner {
    private promiseList: Promise<string>[] = [];
    constructor(
        private stepList: BaseStep[]
    ) {
        this.stepList = stepList;
    }
    initPrompt(): void {
        this.stepList.forEach(step => step.initPrompt());
    }
    async run(): Promise<string[]> {
        this.stepList.forEach(step => this.promiseList.push(step.run()));
        return Promise.all(this.promiseList);
    }
}