import { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as fs from 'fs';
import { TiktokenModel, encoding_for_model } from 'tiktoken';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { Configuration, CreateChatCompletionRequest, CreateChatCompletionResponse, OpenAIApi } from "openai";
import { Utils } from "./utils";

const HISTORY_DIRE = `./history`;
const configuration = new Configuration({
    apiKey: process.env['OPENAI_API_KEY'],
});
const openai = new OpenAIApi(configuration);

export class OpenAIApiWrapper {

    options: AxiosRequestConfig;
    totalCost: number = 0;
    constructor() {
        // proxy設定判定用オブジェクト
        const proxyObj: { [key: string]: any } = {
            httpProxy: process.env['http_proxy'] as string || undefined,
            httpsProxy: process.env['https_proxy'] as string || undefined,
        };
        Object.keys(proxyObj).filter(key => !proxyObj[key]).forEach(key => delete proxyObj[key]);
        this.options = Object.keys(proxyObj).filter(key => proxyObj[key]).length > 0 ? {
            proxy: false,
            httpAgent: new HttpsProxyAgent(proxyObj.httpProxy || proxyObj.httpsProxy || ''),
            httpsAgent: new HttpsProxyAgent(proxyObj.httpsProxy || proxyObj.httpProxy || ''),
        } : {};
        // this.options = {};
        // console.log(this.options);
        console.log(`timestamp               step  R time[ms]  prompt comple model    cost   label`);
        //$12.34
    }
    /**
     * OpenAIのAPIを呼び出す関数
     * @param label ラベル
     * @param prompt プロンプト 
     * @param model モデル
     * @param systemMessage システムメッセージ
     * @returns OpenAIのAPIのレスポンス
     */
    call(label: string, prompt: string, model: TiktokenModel = 'gpt-3.5-turbo', systemMessage: string = 'You are an experienced and talented software engineer.', assistantMessage: string = ''): Promise<AxiosResponse<CreateChatCompletionResponse>> {
        try { fs.mkdirSync(HISTORY_DIRE, { recursive: true }); } catch (e) { }
        const promise: Promise<AxiosResponse<CreateChatCompletionResponse, any>> = new Promise(async (resolve, reject) => {
            const args: CreateChatCompletionRequest = {
                // model: ([0, 1, 4, 5].indexOf(stepNo) !== -1) ? "gpt-4" : "gpt-3.5-turbo",
                model,
                temperature: 0.0,
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: prompt },
                ]
            };

            if (assistantMessage) {
                args.messages.push({ role: 'assistant', content: assistantMessage });
            } else { }

            let completion: AxiosResponse<CreateChatCompletionResponse, any> | null = null;
            let retry = 0;

            // ログ出力用オブジェクト
            const text = args.messages.map(message => `role:\n${message.role}\ncontent:\n${message.content}`).join('\n');
            const obj = { retry: 0, prompt_tokens: encoding_for_model(model).encode(text).length, completion_tokens: 0, step: 'start', model, bef: Date.now(), };
            const numForm = (dec: number, len: number) => (dec || '').toLocaleString().padStart(len, ' ');
            const costTable: { [key: string]: { prompt: number, completion: number } } = {
                'gpt3.5  ': { prompt: 0.002, completion: 0.002, },
                'gpt4    ': { prompt: 0.030, completion: 0.060, },
                'gpt4-32k': { prompt: 0.060, completion: 0.120, },
            };
            const logString = (stepName: string, error: any = ''): string => {
                const take = numForm(Date.now() - obj.bef, 9);
                const prompt_tokens = numForm(obj.prompt_tokens, 6);
                const completion_tokens = numForm(obj.completion_tokens, 6);

                // モデル名振り分け
                let model = 'gpt3.5  ';
                if (obj.model.includes('gpt-4')) {
                    model = obj.model.includes('32k') ? 'gpt4-32k' : 'gpt4    ';
                } else { }

                // コスト計算
                const cost = (costTable[model].prompt * obj.prompt_tokens + costTable[model].completion * obj.completion_tokens) / 1000;
                this.totalCost += cost;
                const costStr = (obj.completion_tokens > 0 ? ('$' + (Math.ceil(cost * 100) / 100).toFixed(2)) : '').padStart(6, ' ');

                return `${Utils.formatDate()} ${stepName.padEnd(5, ' ')} ${retry} ${take} ${prompt_tokens} ${completion_tokens} ${model} ${costStr} ${label} ${error}`;
            };

            console.log(logString('start'));
            // 30秒間隔でリトライ
            while (!completion) {
                try {
                    completion = await openai.createChatCompletion(args, this.options as any) as AxiosResponse<CreateChatCompletionResponse, any>;
                    // console.log(completion.data.usage);
                    obj.prompt_tokens = completion.data.usage?.prompt_tokens || 0;
                    obj.completion_tokens = completion.data.usage?.completion_tokens || 0;
                    console.log(logString('fine'));
                } catch (error) {
                    // 30秒間隔でリトライ
                    console.log(logString('error', error));
                    retry++;
                    completion = null;
                    await wait(30000);
                }
                if (retry > 10) {
                    console.log(logString('error', 'retry over'));
                }
            }
            // ファイルに書き出す
            const timestamp = Utils.formatDate(new Date(), 'yyyyMMddHHmmssSSS');
            fs.writeFileSync(`${HISTORY_DIRE}/${timestamp}-${label}.json`, JSON.stringify({ args, completion }, Utils.genJsonSafer()));
            resolve(completion);
        });
        return promise;
    }
}
// function loadPrompts() {
//     // この関数は、特定のディレクト配下にあるファイルを全て読み込み、連想配列として返却する機能です。
//     const files = [
//         ...fs.readdirSync("./docs/").filter(filename => filename.startsWith('data-') && filename.endsWith(".md")).map(filename => `./docs/${filename}`)
//     ];
//     const promptMap = {};
//     files.forEach(filename => {
//         const text = fs.readFileSync(filename, "utf-8");
//         promptMap[filename] = text;
//     });
//     return promptMap;
// }
// const prompts = loadPrompts();
// console.log(prompts);

async function wait(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }

