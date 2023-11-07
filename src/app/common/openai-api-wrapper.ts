import fss from './fss';
import { TiktokenModel, encoding_for_model } from 'tiktoken';
import { HttpsProxyAgent } from 'https-proxy-agent';
import OpenAI from 'openai';
import { Utils } from "./utils";
import { ChatCompletionChunk, ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions';
import { Stream } from 'openai/streaming';
import { RequestOptions } from 'openai/core';

const HISTORY_DIRE = `./history`;
const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
    // baseOptions: { timeout: 1200000, Configuration: { timeout: 1200000 } },
});


/**
 * OpenAIのAPIを呼び出すラッパークラス
 */
export class OpenAIApiWrapper {

    options: RequestOptions;
    tokenCountList: TokenCount[] = [];

    constructor() {
        // proxy設定判定用オブジェクト
        const proxyObj: { [key: string]: any } = {
            httpProxy: process.env['http_proxy'] as string || undefined,
            httpsProxy: process.env['https_proxy'] as string || undefined,
        };
        Object.keys(proxyObj).filter(key => !proxyObj[key]).forEach(key => delete proxyObj[key]);
        this.options = Object.keys(proxyObj).filter(key => proxyObj[key]).length > 0 ? {
            httpAgent: new HttpsProxyAgent(proxyObj.httpsProxy || proxyObj.httpProxy || ''),
        } : {};
        this.options.stream = true;
        // this.options.timeout = 1200000;

        // this.options = {};
        // console.log(this.options);

        try { fss.mkdirSync(`${HISTORY_DIRE}`, { recursive: true }); } catch (e) { }
        // ヘッダー出力
        console.log(`timestamp               step  R time[ms]  prompt comple model    cost   label`);
    }
    /**
     * OpenAIのAPIを呼び出す関数
     * @param label ラベル
     * @param prompt プロンプト 
     * @param model モデル
     * @param systemMessage システムメッセージ
     * @returns OpenAIのAPIのレスポンス
     */
    call(
        label: string,
        prompt: string,
        model: GPTModels = 'gpt-3.5-turbo',
        temperature: number = 0,
        systemMessage: string = 'You are an experienced and talented software engineer.',
        assistantMessage: string = '',
        responseFormat: 'text' | 'json_object' = 'text',
        streamHandler: (text: string) => void = () => { }
    ): Promise<string> {
        const promise: Promise<string> = new Promise(async (resolve, reject) => {
            const args: ChatCompletionCreateParamsBase = {
                // model: ([0, 1, 4, 5].indexOf(stepNo) !== -1) ? "gpt-4" : "gpt-3.5-turbo",
                model,
                temperature,
                messages: [],
                response_format: { type: responseFormat },
                stream: true,
            };
            // フォーマットがjson指定なのにjsonという文字列が入ってない場合は追加する。
            if (responseFormat === 'json_object' && !prompt.includes('json')) {
                prompt += '\n\n# Output format\njson';
            } else { }

            if (systemMessage) { // systemMessageがある場合は、システムメッセージを追加
                args.messages.push({ role: 'system', content: systemMessage });
            } else {
            }
            if (prompt) { // promptがある場合は、promptを追加
                args.messages.push({ role: 'user', content: prompt });
            } else {
            }
            if (assistantMessage) { // assistantMessageがある場合は、assistantMessageを追加
                args.messages.push({ role: 'assistant', content: assistantMessage });
            } else { }

            let completion: Stream<ChatCompletionChunk> | null = null;
            let retry = 0;

            // ログ出力用オブジェクト
            const text = args.messages.map(message => `role:\n${message.role}\ncontent:\n${message.content}`).join('\n');
            const tokenCount = new TokenCount(model, 0, 0);
            // gpt-4-1106-preview に未対応のため、gpt-4に置き換え。プロンプトのトークンを数えるだけなのでモデルはどれにしてもしても同じだと思われるが。。。
            tokenCount.prompt_tokens = encoding_for_model((tokenCount.modelTikToken as any) === 'gpt-4-1106-preview' ? 'gpt-4' : tokenCount.modelTikToken).encode(text).length;
            this.tokenCountList.push(tokenCount);

            let bef = Date.now();
            const logString = (stepName: string, error: any = ''): string => {
                const take = numForm(Date.now() - bef, 9);
                const prompt_tokens = numForm(tokenCount.prompt_tokens, 6);
                const completion_tokens = numForm(tokenCount.completion_tokens, 6);

                const costStr = (tokenCount.completion_tokens > 0 ? ('$' + (Math.ceil(tokenCount.cost * 100) / 100).toFixed(2)) : '').padStart(6, ' ');
                const logString = `${Utils.formatDate()} ${stepName.padEnd(5, ' ')} ${retry} ${take} ${prompt_tokens} ${completion_tokens} ${tokenCount.modelShort} ${costStr} ${label} ${error}`;
                fss.appendFile(`history.log`, `${logString}\n`, {}, () => { });
                return logString;
            };

            console.log(logString('start'));
            // 30秒間隔でリトライ
            while (!completion) {
                try {
                    console.log(logString('call'));
                    completion = await openai.chat.completions.create(args, this.options) as Stream<ChatCompletionChunk>;

                    let tokenBuilder: string = '';

                    // ファイルに書き出す
                    const timestamp = Utils.formatDate(new Date(), 'yyyyMMddHHmmssSSS');

                    for await (const chunk of completion) {
                        // 中身を取り出す
                        let content = chunk.choices[0]?.delta?.content;
                        // 中身がない場合はスキップ
                        if (!content) { continue; }
                        // ファイルに書き出す
                        fss.appendFile(`${HISTORY_DIRE}/${timestamp}-${Utils.safeFileName(label)}.txt`, content || '', {}, () => { });
                        // console.log(`${tokenCount.completion_tokens}: ${data.toString()}`);
                        // トークン数をカウント
                        tokenCount.completion_tokens++;
                        tokenBuilder += content;
                        streamHandler(content);
                    }
                    tokenCount.cost = tokenCount.calcCost();
                    console.log(logString('fine'));
                    resolve(tokenBuilder);
                    fss.writeFile(`${HISTORY_DIRE}/${timestamp}-${Utils.safeFileName(label)}.json`, JSON.stringify({ args, completion }, Utils.genJsonSafer()), {}, (err) => { });
                } catch (error) {
                    // 30秒間隔でリトライ
                    console.log(logString('error', error));
                    retry++;
                    completion = null;
                    await wait(30000);
                }
                if (retry > 10) {
                    console.log(logString('error', 'retry over'));
                    reject('retry over');
                }
            }
        });
        return promise;
    }

    public total(): { [key: string]: TokenCount } {
        return this.tokenCountList.reduce((prev: { [key: string]: TokenCount }, current: TokenCount) => {
            const tokenCount = prev[current.modelShort] || new TokenCount(current.model, 0, 0);
            tokenCount.add(current);
            prev.all.add(current);
            prev[current.modelShort] = tokenCount;
            return prev;
        }, { 'gpt-4': new TokenCount('gpt-4', 0, 0) });
    }
}

export type GPTModels = 'gpt-4' | 'gpt-4-0314' | 'gpt-4-0613' | 'gpt-4-32k' | 'gpt-4-32k-0314' | 'gpt-4-32k-0613' | 'gpt-4-1106-preview' | 'gpt-3.5-turbo' | 'gpt-3.5-turbo-0301' | 'gpt-3.5-turbo-0613' | 'gpt-3.5-turbo-16k' | 'gpt-3.5-turbo-16k-0613';


/**
 * トークン数とコストを計算するクラス
 */
export class TokenCount {

    // モデル名とコストの対応表
    static COST_TABLE: { [key: string]: { prompt: number, completion: number } } = {
        'all     ': { prompt: 0.0000, completion: 0.0000, },
        'chat    ': { prompt: 0.0015, completion: 0.0020, },
        'chat-16k': { prompt: 0.0010, completion: 0.0020, },
        'gpt4    ': { prompt: 0.0300, completion: 0.0600, },
        'gpt4-32k': { prompt: 0.0600, completion: 0.1200, },
        // 'gpt4-vis': { prompt: 0.0600, completion: 0.1200, },
        'gpt4-128': { prompt: 0.0100, completion: 0.0300, },
    };

    static SHORT_NAME = {
        // 'text-davinci-003': 'unused',
        // 'text-davinci-002': 'unused',
        // 'text-davinci-001': 'unused',
        // 'text-curie-001': 'unused',
        // 'text-babbage-001': 'unused',
        // 'text-ada-001': 'unused',
        // 'davinci': 'unused',
        // 'curie': 'unused',
        // 'babbage': 'unused',
        // 'ada': 'unused',
        // 'code-davinci-002': 'unused',
        // 'code-davinci-001': 'unused',
        // 'code-cushman-002': 'unused',
        // 'code-cushman-001': 'unused',
        // 'davinci-codex': 'unused',
        // 'cushman-codex': 'unused',
        // 'text-davinci-edit-001': 'unused',
        // 'code-davinci-edit-001': 'unused',
        // 'text-embedding-ada-002': 'unused',
        // 'text-similarity-davinci-001': 'unused',
        // 'text-similarity-curie-001': 'unused',
        // 'text-similarity-babbage-001': 'unused',
        // 'text-similarity-ada-001': 'unused',
        // 'text-search-davinci-doc-001': 'unused',
        // 'text-search-curie-doc-001': 'unused',
        // 'text-search-babbage-doc-001': 'unused',
        // 'text-search-ada-doc-001': 'unused',
        // 'code-search-babbage-code-001': 'unused',
        // 'code-search-ada-code-001': 'unused',
        // 'gpt2': 'unused',
        'gpt-4': 'gpt4    ',
        'gpt-4-0314': 'gpt4    ',
        'gpt-4-0613': 'gpt4    ',
        'gpt-4-32k': 'gpt4-32k',
        'gpt-4-32k-0314': 'gpt4-32k',
        'gpt-4-32k-0613': 'gpt4-32k',
        'gpt-4-1106-preview': 'gpt4-128',
        'gpt-3.5-turbo': 'gpt3    ',
        'gpt-3.5-turbo-0301': 'gpt3    ',
        'gpt-3.5-turbo-0613': 'gpt3    ',
        'gpt-3.5-turbo-16k': 'gpt3-16k',
        'gpt-3.5-turbo-16k-0613': 'gpt3-16k',
    };

    // コスト
    public cost: number = 0;

    // モデル名の短縮形
    public modelShort: string;

    // モデル名トークンカウント用
    public modelTikToken: TiktokenModel;

    /**
     * @param model: 'gpt-3.5-turbo'|'gpt-4' モデル名
     * @param prompt_tokens: number  プロンプトのトークン数
     * @param completion_tokens: number コンプリーションのトークン数
     * @returns TokenCount インスタンス
     */
    constructor(
        public model: GPTModels,
        public prompt_tokens: number = 0,
        public completion_tokens: number = 0,
    ) {
        this.modelShort = 'all     ';
        this.modelTikToken = 'gpt-3.5-turbo';
        this.modelShort = TokenCount.SHORT_NAME[model] || model;
        this.modelTikToken = model as TiktokenModel;
    }

    calcCost(): number {
        this.cost = (
            TokenCount.COST_TABLE[this.modelShort].prompt * this.prompt_tokens +
            TokenCount.COST_TABLE[this.modelShort].completion * this.completion_tokens
        ) / 1000;
        return this.cost;
    }

    /**
     * トークン数とコストを加算する
     * @param obj 
     * @returns 
     */
    add(obj: TokenCount): TokenCount {
        this.cost += obj.cost;
        this.prompt_tokens += obj.prompt_tokens;
        this.completion_tokens += obj.completion_tokens;
        return this;
    }

    /** 
     * @returns string ログ出力用の文字列
     */
    toString(): string {
        return `${this.modelShort.padEnd(8)} ${this.prompt_tokens.toLocaleString().padStart(6, ' ')} ${this.completion_tokens.toLocaleString().padStart(6, ' ')} ${('$' + (Math.ceil(this.cost * 100) / 100).toFixed(2)).padStart(6, ' ')}`;
    }
}

function numForm(dec: number, len: number) { return (dec || '').toLocaleString().padStart(len, ' '); };
async function wait(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }

