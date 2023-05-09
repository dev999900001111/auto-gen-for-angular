import { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as fs from 'fs';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { Configuration, CreateChatCompletionRequest, CreateChatCompletionResponse, OpenAIApi } from "openai";
import { Utils } from "./utils";

const HISTORY_DIRE = `./history`;
const configuration = new Configuration({
    apiKey: process.env['OPENAI_API_KEY'],
});
const openai = new OpenAIApi(configuration);

export class OpenAIApiWrapper {

    options:AxiosRequestConfig;
    constructor(){
        // proxy設定判定用オブジェクト
        const proxyObj = {
            httpProxy: process.env['http_proxy'] as string || undefined,
            httpsProxy: process.env['https_proxy'] as string || undefined,
        };
        console.log(proxyObj);
        this.options = Object.keys(proxyObj).length > 0 ? {
            proxy: false,
            httpAgent: new HttpsProxyAgent(proxyObj.httpProxy || proxyObj.httpsProxy || ''),
            httpsAgent: new HttpsProxyAgent(proxyObj.httpsProxy || proxyObj.httpProxy || ''),
        } : {};
        // console.log(options);
    }
    /**
     * OpenAIのAPIを呼び出す関数
     * @param label ラベル
     * @param prompt プロンプト 
     * @param model モデル
     * @param systemMessage システムメッセージ
     * @returns OpenAIのAPIのレスポンス
     */
    call(label: string, prompt: string, model: string = 'gpt-3.5-turbo', systemMessage: string = 'You are an experienced and talented software engineer.',): Promise<AxiosResponse<CreateChatCompletionResponse>> {
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

            let completion: AxiosResponse<CreateChatCompletionResponse, any> | null = null;
            let retry = 0;
            let bef = Date.now();
            console.log(`${new Date()} start ${label} retry: ${retry}`);
            // 30秒間隔でリトライ
            while (!completion) {
                try {
                    completion = await openai.createChatCompletion(args, this.options as any) as AxiosResponse<CreateChatCompletionResponse, any>;
                    console.log(`${new Date()} fine  ${label} retry: ${retry} takes ${Date.now() - bef}[ms]`);
                } catch (error) {
                    // 30秒間隔でリトライ
                    console.log(`${new Date()} error ${label} retry: ${retry} takes ${Date.now() - bef}[ms] ${error}`);
                    retry++;
                    completion = null;
                    await wait(30000);
                }
                if (retry > 10) {
                    reject(`${new Date()} error ${label} retry: ${retry} takes ${Date.now() - bef}[ms] retryout `);
                }
            }
            // ファイルに書き出す
            const timestamp = Utils.formatDateWithMilliseconds(new Date());
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

