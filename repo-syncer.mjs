import * as fs from 'fs';
import typescript from 'typescript';
const ts = typescript;
import { Utils } from './utils.mjs';

export class RepoSyncer {
    loadDefs(files = [
        './src/app/models.ts',
        ...fs.readdirSync('./src/app/services').filter(filename => filename.endsWith('.ts')).map(filename => `./src/app/services/${filename}`)
    ]) {
        const classes = {};
        files.forEach(filename => {
            const sourceCode = fs.readFileSync(filename, 'utf-8');
            // const sourceFile = ts.createSourceFile(filename, sourceCode, ts.ScriptTarget.Latest);
            const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest);
            sourceFile.statements.forEach(statement => {
                if (ts.isClassDeclaration(statement) || ts.isInterfaceDeclaration(statement) || ts.isEnumDeclaration(statement)) {
                    const className = statement.name.text;
                    if (className.endsWith('Service')) {
                        // サービスクラス
                        // console.log(statement);
                        const methodDefs = {};
                        const methods = statement.members
                            .filter(member =>
                                ts.canHaveModifiers(member)
                                && (!member.modifiers || !member.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.PrivateKeyword))
                                && !ts.isConstructorDeclaration(member)
                            )
                            .map(method => {
                                if (ts.isMethodDeclaration(method)) {
                                    const signatureStart = method.pos + 1; // nameの次の位置
                                    const signatureEnd = method.body?.pos ?? method.end; // bodyがあればその前の位置、なければ終了位置
                                    const signature = sourceCode.slice(signatureStart, signatureEnd).trim() + ';';
                                    return signature;
                                } else {
                                    // console.log(`============================================0000000`);
                                    // console.log(method.getText(sourceFile));
                                    // console.log(`============================================1111111`);
                                    return method.getText(sourceFile);
                                }
                            });
                        const classSourceCode = `export interface ${className} {\n  ${methods.join("\n  ")}\n}`;
                        classes[className] = {
                            name: className, path: filename, type: 'service',
                            src: `// src/app/services/${Utils.toKebabCase(className)}.ts\n${Utils.tsForm(classSourceCode)}`,
                            raw: statement.getText(sourceFile),
                        };
                    } else {
                        // モデルクラス
                        const constructor = statement.members.find(member => ts.isConstructorDeclaration(member));
                        if (constructor) {
                            // コンストラクタのデフォルト値を削除するブロック

                            // コンストラクタのパラメータを取得する
                            const parameters = constructor.parameters.map(parameter => {
                                const typeNode = parameter.type || parameter.initializer && parameter.initializer.type;
                                const typeName = typeNode ? typeNode.getText(sourceFile) : 'any';
                                return `${parameter.name.getText(sourceFile)}: ${typeName}`;
                            });

                            // コンストラクタの定義を取得する
                            let constructorDefinition = constructor.getText(sourceFile);
                            // デフォルト値を削除する
                            parameters.forEach(parameter => {
                                const parameterRegexp = new RegExp(`${parameter} *=.*?[,)\n]`, 'g');
                                constructorDefinition = constructorDefinition.replace(parameterRegexp, `${parameter},`);
                            });

                            // コンストラクタの定義をクラス全体の定義に差し替えた結果を出力する
                            const result = statement.getText(sourceFile).replace(constructor?.getText(sourceFile) || '', constructorDefinition);

                            // コンストラクタの定義をconsole.logする
                            // console.log(result);
                            classes[className] = {
                                name: className, path: filename, type: 'model',
                                src: Utils.tsForm(result.trim()).replace(/\n/g, ''),
                                raw: result.trim(),
                            };
                        } else {
                            // コンストラクタが無い場合はそのまま
                            // console.log(statement);
                            const type = ts.isEnumDeclaration(statement) ? 'enum' : 'model';
                            classes[className] = {
                                name: className, path: filename, type,
                                src: Utils.tsForm(statement.getText(sourceFile).trim()).replace(/\n/g, ''),
                                raw: statement.getText(sourceFile).trim(),
                            };
                        }
                    }
                } else {
                    //
                }
            });
            return classes;
        });
        return classes;
    }

    /**
     * サービスクラスの定義を必要なプロパティだけに絞り込む。
     * @param {*} classSourceCode 
     * @param {*} propList
     * @returns 
     */
    // funcFilter(classSourceCode, propList): string {
    //     const sourceFile = ts.createSourceFile('test.ts', classSourceCode, ts.ScriptTarget.Latest);
    //     return sourceFile.statements.map(statement => {
    //         const methods = statement.members
    //             // propListに載っているものだけに絞り込む
    //             .filter(member => propList.indexOf(member.name.getText(sourceFile)) !== -1)
    //             // テキスト配列にする
    //             .map(method => method.getText(sourceFile));
    //         return `// src/app/services/${Utils.toKebabCase(statement.name.text)}.ts\nexport interface ${statement.name.text} {\n  ${methods.join("\n  ")}\n}`;
    //     }).join('');
    // }
}
