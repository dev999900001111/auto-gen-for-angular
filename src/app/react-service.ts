import fs from 'fs';
import { Utils } from './utils';

export class ReactCodeGenerator {

    static genService(srcJonsText: string) {
        const obj = Utils.jsonParse(srcJonsText) as any;
        // fs.writeFileSync(`./gen/src/app/services/`, text);
        // console.log(obj);

        const httpPath = 'api/v1/items';
        function getApi(apiServiceName: string, serviceMethodString: string, importString: string) {
            return `
${importString}

export class ${apiServiceName} {

    private apiBase = '';
${serviceMethodString}
}
export const ${Utils.decapitalize(apiServiceName)} = new ${apiServiceName}();
            `;
        }

        function getApiArgs(apiArgs: string, apiResType: string, apiMethodName: string, httpPath: string, httpMethod: string, apiBody: string): string {
            return `
    async ${apiMethodName}(${apiArgs}): ${apiResType} {
        try {
            const response = await fetch(\`\${this.apiBase}/${apiMethodName}/${httpPath}\`, {
                method: '${httpMethod}',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token'),
                    'Content-Type': 'application/json',
                },
                ${apiBody}
            });
            const data: ${apiResType.replace(/^Promise<(.*)>$/g, '$1')} = await response.json();
            return data;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
        `;
        }

        fs.mkdirSync(`./gen/src/app/services`, { recursive: true });
        Object.keys(obj).forEach(key => {
            let importString = `import { ${obj[key].models.join(', ')} } from '../models';`;
            const methList = obj[key].methods.map((method: { name: string, params: any[], return: string }) => {
                let httpMethod = 'POST';
                if (method.name.startsWith('get')) {
                    httpMethod = 'GET';
                } else if (method.name.startsWith('search')) {
                    httpMethod = 'GET';
                } else if (method.name.startsWith('delete')) {
                    httpMethod = 'DELETE';
                } else if (!method.params || method.params.length === 0) {
                    httpMethod = 'GET';
                }
                let httpPath = `api/${httpMethod}-${key}-${method.name}.json`;
                method.params = method.params || [];
                let argNames = '';
                if (httpMethod === 'POST') {
                    argNames = `body: JSON.stringify({ ${method.params.map(param => param.name).join(', ')} }),`;
                } else {

                }

                const argString = method.params.map(param => `${param.name}: ${param.type}`).join(', ');

                const text = getApiArgs(argString, method.return, method.name, httpPath, httpMethod, argNames);
                // console.log(obj[key]);
                // console.log(method);
                // console.log(text);
                return text;
            }).join('\n');

            const text = getApi(key, methList, importString);
            fs.writeFileSync(`./gen/src/app/services/${key}.ts`, text);
            // console.log(text);
        });
    }
}


/**
 * services配下のサービスクラスを全てインポートするためのindex.tsを生成します。
 * @param {*} dire 
 * @returns 
 */
export function genIndex(dire = `./gen/src/app/services`) {
    const indexText = fs.readdirSync(dire)
        // .ts かつ .spec.ts ではないファイルを抽出
        .filter(filename => filename.endsWith(".ts") && !filename.endsWith(".spec.ts") && filename !== "index.ts")
        // ファイルを読み込み
        .map(filename => `export * from './${filename.replace(/.\/gen/g, './').replace(/.ts$/g, '')}';`)
        // 改行コードで結合
        .join('\n');
    // index.ts として書き出し
    fs.writeFileSync(`${dire}/index.ts`, indexText, 'utf-8');
    return indexText;
}

