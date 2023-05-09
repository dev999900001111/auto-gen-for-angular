/**
 * Utilsクラスは、共通のユーティリティメソッドを提供するためのクラスです。
 */
export class Utils {

    /**
     * キャメルケースをケバブケースに変換する関数
     * @param str - ケース変換する文字列
     * @returns ケバブケースに変換された文字列
     */
    static toKebabCase(str: string) {
        return str.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`).replace(/^-/g, '');
    }

    /**
     * ケバブケースをキャメルケースに変換する関数
     * @param str - ケース変換する文字列
     * @returns キャメルケースに変換された文字列
     */
    static toCamelCase(str: string) {
        return str.replace(/[- /]([a-z])/g, (_, match) => match.toUpperCase());
    }

    /**
     * 文字列の最初の文字を大文字に変換する関数
     * @param str - 大文字に変換する文字列
     * @returns 大文字に変換された文字列
     */
    static capitalize(str: string) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * 文字列の最初の文字を小文字に変換する関数
     * @param str - 小文字に変換する文字列
     * @returns 小文字に変換された文字列
     */
    static decapitalize(str: string) {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }

    /**
     * TypeScriptコードを整形する関数
     * @param code - 整形するTypeScriptコード
     * @returns 整形されたTypeScriptコード
     */
    static tsForm(code: string) {
        const lines = code.replace(/\r/g, '').split("\n");
        const result = lines.map((line, index) => {
            if (index === lines.length - 1 || line.endsWith(";")) {
                return line.trim() + '\n'; // 行末が;で終わる行または最後の行はそのまま返す
            } else {
                return line.trim(); // 行頭と行末のスペースを削除する
            }
        }).join("");
        return result;
    }

    /**
     * スペースを正規化する関数
     * 
     * @param str 正規化する文字列
     * @returns 正規化された文字列
     */
    static spaceNormalize(str: string): string {
        const lines = str.split("\n"); // 改行コードで分割
        const result = lines.map(line => {
            const matches = line.match(/^(\s*)(\S+(?:\s+\S+)*)\s*$/); // 行頭のスペースと行末のスペースを取り出す
            if (!matches || matches.length < 3) { return line; }
            const indent = matches[1]; // 行頭のスペース
            const words = matches[2].replace(/\s+/g, " "); // スペースの連続を1つのスペースに置換
            return indent + words;
        }).join("\n"); // 改行コードで結合
        return result;
    }

    /**
     * 日付をフォーマットする関数
     * 
     * @param date フォーマットする日付
     * @returns フォーマットされた文字列
     */
    static formatDateWithMilliseconds(date: Date): string {
        const year = date.getFullYear(); // 西暦を取得
        const month = ("0" + (date.getMonth() + 1)).slice(-2); // 月を取得（0埋め）
        const day = ("0" + date.getDate()).slice(-2); // 日を取得（0埋め）
        const hours = ("0" + date.getHours()).slice(-2); // 時を取得（0埋め）
        const minutes = ("0" + date.getMinutes()).slice(-2); // 分を取得（0埋め）
        const seconds = ("0" + date.getSeconds()).slice(-2); // 秒を取得（0埋め）
        const milliseconds = ("00" + date.getMilliseconds()).slice(-3); // ミリ秒を取得（0埋め）

        const formattedDate = year + month + day + hours + minutes + seconds + milliseconds; // yyyymmddhhmmssSSS形式の文字列を生成
        return formattedDate;
    }

    /**
     * 配列を指定されたサイズごとに分割する関数
     * 
     * @param arr 分割する配列
     * @param chunkSize 一つの配列のサイズ
     * @returns 分割された配列
     */
    static toChunkArray(arr: any[], chunkSize: number): any[][] {
        return arr.reduce((acc, _, i) => {
            if (i % chunkSize === 0) acc.push(arr.slice(i, i + chunkSize));
            return acc;
        }, []);
    }

    /**
     * Markdownのコードブロックを```を外したものにする。
     * @param {string} text - Markdown形式のテキスト
     * @returns {string} コメント形式に変換されたテキスト
     */
    static convertCodeBlocks(text: string): string {
        let split = text.split(/```.*\n|```$/, -1);
        return split.map((code, index) => {
            if (code.length === 0) {
                return code;
            } else {
                if (index % 2 === 1) {
                    return code;
                } else {
                    return code.split('\n').map(line => `// ${line}`).join('\n');
                }
            }
        }).join('');
    }

    /**
     * JSONを安全にstringifyする関数を生成する
     */
    static genJsonSafer(): any {
        const cache = new Set();
        return (key: string, value: any) => {
            if (typeof value === "object" && value !== null) {
                if (cache.has(value)) {
                    return null;
                } else {
                    // 
                }
                cache.add(value);
            } else {
                // 
            }
            return value;
        }
    }

    /**
     * インデントを削除する
     * @param {string} str 
     * @returns {string}
     */
    static trimLines(str: string): string {
        const list = str.split('\n');
        const line = list.find((line, index) => line.trim().length > 0);
        if (line) { } else { return str; }
        const indent = line.length - line.trimLeft().length;
        const regex = new RegExp(`^ {${indent}}`, 'g');
        return list.map(line => line.replace(regex, '')).join('\n').trim();
    }

    /**
     * 指定された文字列を指定された回数繰り返す
     * @param {string} str - 繰り返す文字列
     * @param {number} n - 繰り返す回数
     * @returns {string} 繰り返された文字列
     * @example rept('ab', 2) // => 'abab'
     */
    static rept(str: string, n: number): string {
        return Array(n + 1).join(str);
    }

    /**
     * JSONが1行ずつに分割されていても読めるようにする
     * @param {*} str 
     * @returns 
     */
    static jsonParse<T>(str0: string): T {
        const str = str0.replace(/{"":"[^"]*"[,]{0,1}}/g,'null').replace(/,}/g,'}');
        try {
            return JSON.parse(str);
        } catch (e0) {
            try {
                const mid = str.replace(/^ *{|} *$/gm, '').split('\n').filter(line => line.trim().length > 0).join(',');
                return JSON.parse(`{${mid}}`);
            } catch (e1) {
                try{
                    const mid = JSON.parse(`[${str}]`);
                    let sum = {};
                    mid.forEach((obj:any)=>{
                        // console.log(sum);
                        sum = {...sum,...obj};
                    });
                    return sum as any;
                } catch (e2){
                    console.log(e0);
                    console.log(`[${str}]`);
                    // e0の方をエラー出力する。
                    throw e0;
                }
            }
        }
    }

    /**
     * [{title: 'hoge', content: 'fuga', children: [{title: 'hoge', content: 'fuga'}]}]のようなオブジェクトをMarkdownに変換する
     * @param {{ title: string, content: string, children: any[] }} chapter
     * @param {number} layer
     * @returns {string}
     */
    static toMarkdown(chapter: StructuredPrompt, layer: number = 1) {
        let sb = '';
        if (chapter.title) {
            sb += `${Utils.rept('#', layer)} ${chapter.title}\n`;
        } else { }
        if (chapter.content) {
            sb += `${chapter.content}\n`;
        } else { }
        if (chapter.children) {
            chapter.children.forEach(child => {
                console.log(child);
                sb += Utils.toMarkdown(child, layer + 1);
            });
        } else { }
        return sb;
    }
}


export interface StructuredPrompt {
    title?: string;
    content?: string;
    children?: StructuredPrompt[];
}
