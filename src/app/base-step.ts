import * as  fs from 'fs';
import { OpenAIApiWrapper } from "./openai-api-wrapper";
import { StructuredPrompt, Utils } from "./utils";

const aiApi = new OpenAIApiWrapper();

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
        const prompt = fs.readFileSync(this.promptPath, 'utf-8');
        return aiApi.call(this.label, prompt, this.model, this.systemMessage, this.assistantMessage).then((completion) => {
            if (completion.data && completion.data.choices && completion.data.choices[0] && completion.data.choices[0].message && completion.data.choices[0].message.content) {
                // 戻り値の存在チェック
            } else {
                // 無かったら空で返す。
                return '';
            }
            const result = completion.data.choices[0].message.content;
            fs.writeFileSync(this.resultPath, result);
            return this.postProcess(result);
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