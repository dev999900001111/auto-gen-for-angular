import * as  fs from 'fs';
import * as  path from 'path';

import { Utils } from '../../common/utils.js';
interface TemplateFiller {
    templatePath: string;
    outputPath?: string;
    data: { [key: string]: any };
}
interface ImportStatement {
    importStatement: string;
    className: string;
}
export class GenModuleFiles {
    srcDire = './gen/src'; // 検索するディレクトリのパス
    constructor() { }

    /**
     * 指定されたディレクトリ内を再帰的に検索し、Angularコンポーネントを全て見つけ出して
     * モジュールにインポートするためのインポート文とクラス名にして返却します。
     * @param srcDire 検索対象のディレクトリパス
     * @param importStatementList モジュールのインポート文を格納する配列。デフォルトは空配列。
     * @returns モジュールのインポート文を格納する配列
     */
    searchDirectory(srcDire: string, importStatementList: ImportStatement[] = []) {
        // ディレクトリ内のファイル一覧を取得する
        const files = fs.readdirSync(srcDire);

        // ディレクトリ内のファイルを順に処理する
        files.forEach(file => {
            const filePath = path.join(srcDire, file);

            // ファイルがディレクトリの場合、再帰的に検索する
            if (fs.statSync(filePath).isDirectory()) {
                // ディレクトリ内を再帰的に検索する
                this.searchDirectory(filePath, importStatementList);
            } else if (file === 'app.component.ts') {
                // app.component.tsは自作する前提なのでAngularモジュールにインポートしない
            } else if (filePath.endsWith('.component.ts')) {
                // ファイルがAngularコンポーネントの場合、モジュールにインポート文を追加する
                const componentName = path.basename(filePath, '.component.ts');
                // クラス名を生成する
                const className = `${Utils.toPascalCase(componentName)}Component`;
                // インポート文を生成する
                const importStatement = `import { ${className} } from './${path.relative('./src/app', filePath).replace(/\\/g, '/').replace(/.ts$/g, '').replace(/..\/..\/gen\/src\/app\//g, '')}';`;
                importStatementList.push({ importStatement, className });
            }
        });
        return importStatementList;
    }

    /**
     * Handlebarsテンプレートを使用してテンプレートを生成するための関数です。
     * @param {TemplateFiller} templateFiller - テンプレートに埋め込むデータとテンプレートファイルパスを含むオブジェクト。
     * @returns {string} - 生成されたテンプレートの文字列。
     */
    fillTemplate(templateFiller: TemplateFiller) {
        const templateContent = fs.readFileSync(templateFiller.templatePath, 'utf-8');
        // console.log(templateContent);
        // const result = Handlebars.compile(templateContent)(templateFiller.data || {});
        const result = templateContent.replace(/{{(\w+)}}/g, (match, key) => {
            return templateFiller.data[key] || "";
        });
        // console.log(result);
        return result;
    }

    /**
     * Angularモジュールファイルを生成するための関数です。
     * @param {string} srcDire - 検索するディレクトリのパス。
     * @returns {void}
     */
    exec() {
        // ディレクトリ内を再帰的に検索する
        const importStatementList = this.searchDirectory(this.srcDire);

        // Angularモジュールファイルを生成する
        fs.writeFileSync(`${this.srcDire}/app/app.module.ts`, this.fillTemplate({
            templatePath: './src/templates/app.module.ts.md',
            data: {
                // Angularモジュールに必要なコンポーネントのインポート文を格納する配列
                importsSection: importStatementList.map(obj => obj.importStatement).join('\n'),
                // Angularモジュールに必要なコンポーネントのクラス名を格納する配列
                className: importStatementList.map(obj => `    ${obj.className},`).join('\n'),
            }
        }));

        // Angularルーティングファイルを生成する
        const pages = importStatementList.filter(obj => obj.importStatement.indexOf('/pages/') >= 0);
        fs.writeFileSync(`${this.srcDire}/app/app-routing.module.ts`, this.fillTemplate({
            templatePath: './src/templates/app-routing.module.ts.md',
            data: {
                // pages系のみをroutingに追加する
                routeImports: pages.map(obj => obj.importStatement).join('\n'),
                routingPath: pages.map(obj => `  { path: '${Utils.toKebabCase(obj.className).replace(/-component.*/g, '')}', component: ${obj.className} },`).join('\n'),
            }
        }));

        // Angularインターセプターファイルを生成する
        fs.writeFileSync(`${this.srcDire}/app/api.interceptor.ts`, this.fillTemplate({
            templatePath: './src/templates/api.interceptor.ts.md',
            data: {}
        }));

        console.log(`Angularモジュールファイルを生成しました。`);
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

