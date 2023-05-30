import * as fs from 'fs';
import * as ts from "typescript";
import { Attribute, DomainModel, Relationship, RelationshipType, domainModelsDire } from '../domain-models/domain-models';
import { Utils } from '../common/utils';

const packageName = 'com.example.demo';

export function genEntityAndRepository() {
    const model = DomainModel.loadModels();

    const mainSrc = `
package ${packageName};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

}
`;
    fs.mkdirSync(`./gen/src/main/java/com/example/demo/`, { recursive: true });
    fs.writeFileSync(`./gen/src/main/java/com/example/demo/DemoApplication.java`, mainSrc);


    // Entity
    const entities = Object.keys(model.Entities).map((entityName: string) => {

        let classCode = ``;
        classCode = `package ${packageName}.entity;\n`;
        classCode += `\n`;
        classCode += `import jakarta.persistence.*;\n`;
        classCode += `import lombok.Data;\n`;
        classCode += `import java.util.Date;\n`;
        classCode += `import java.sql.Time;\n`;
        classCode += `import java.time.*;\n`;
        classCode += `import java.util.List;\n`;
        classCode += `\n`;
        classCode += `@Data\n`;
        classCode += `@Entity\n`;
        classCode += `@Table(name = "${Utils.toSnakeCase(entityName)}")\n`;
        classCode += `public class ${entityName} {\n\n`;

        const cardinalityMap: { [key: string]: RelationshipType } = {};
        model.Relationships.forEach((relationship: Relationship) => {
            const cardinality = stringToEnum<RelationshipType>(relationship.type, RelationshipType);
            if (relationship.source.name === entityName) {
                // console.log(relationship);
                // カーディナリティを格納
                cardinalityMap[relationship.target.name] = cardinality;
            } else if (relationship.target.name === entityName) {
                // カーディナリティの向きを逆にして格納
                cardinalityMap[relationship.source.name] = relationshipTypeReverse(cardinality);
            } else { }
        });
        model.Entities[entityName].Attributes.forEach((attribute: Attribute) => {

            // attributeの型を取得
            let foreignType = '';
            let isList = false;
            if (['list[', 'List<'].includes(attribute.type.substring(0, 5))) {
                foreignType = attribute.type.substring(5, attribute.type.length - 1);
                isList = true;
                // console.log(`List   ${foreignType}`);
            } else {
                foreignType = attribute.type;
                // console.log(`       ${foreignType}`);
            }

            // attributeの型がEntityかValueObjectかを判定
            if (model.Entities[foreignType] || model.ValueObjects[foreignType]) {
                // attributeの型がEntityかValueObjectかの場合は、それに応じたアノテーションを付与
                if (false) {
                } else if (model.ValueObjects[foreignType]) {
                    if (isList) {
                        classCode += `    @ElementCollection(fetch = FetchType.LAZY)\n`;
                    } else { }
                    classCode += `    @Embedded\n`;
                } else if (cardinalityMap[foreignType]) {
                    classCode += `    @${cardinalityMap[foreignType]}\n`;
                } else {
                    // 本来であれば、ここには来ないはず
                    console.log(`Error: ${entityName}.${attribute.name}:${foreignType} has no cardinality`);
                }
            } else {
                // attributeの型がEntityでもValueObjectでもない場合は、そのままの型でアノテーションを付与
                if (attribute.name === 'id') {
                    // idの場合は、@Idと@GeneratedValueを付与
                    classCode += `    @Id\n`;
                    classCode += `    @GeneratedValue(strategy = GenerationType.IDENTITY)\n`;
                } else {
                    classCode += `    @Column\n`;
                }
            }
            classCode += `    private ${toJavaClass(attribute.type)} ${Utils.toCamelCase(attribute.name)};\n\n`;
        });
        classCode += `}\n`;

        fs.mkdirSync(`./gen/src/main/java/com/example/demo/entity`, { recursive: true });
        fs.writeFileSync(`./gen/src/main/java/com/example/demo/entity/${entityName}.java`, classCode);

        return classCode;
    }).join('\n\n');

    // ValueObject実装作成
    const valueObjects = Object.keys(model.ValueObjects).map((valueObjectName: string) => {
        let classCode = ``;
        classCode += `package ${packageName}.entity;\n`;
        classCode += `\n`;
        classCode += `import jakarta.persistence.*;\n`;
        classCode += `import java.util.Date;\n`;
        classCode += `import java.sql.Time;\n`;
        classCode += `import java.time.*;\n`;
        classCode += `import lombok.Data;\n`;
        classCode += `\n`;
        classCode += `@Data\n`;
        classCode += `@Embeddable\n`;
        classCode += `public class ${valueObjectName} {\n\n`;
        model.ValueObjects[valueObjectName].Attributes.forEach((attribute: Attribute) => {
            classCode += `    @Column(name="${Utils.toSnakeCase(valueObjectName)}_${Utils.toSnakeCase(attribute.name)}")\n`;
            classCode += `    private ${toJavaClass(attribute.type)} ${Utils.toCamelCase(attribute.name)};\n\n`;
        });
        classCode += `}\n`;
        fs.mkdirSync(`./gen/src/main/java/com/example/demo/entity`, { recursive: true });
        fs.writeFileSync(`./gen/src/main/java/com/example/demo/entity/${valueObjectName}.java`, classCode);
        return classCode;
    }).join('\n\n');

    // API用json定義読み込み
    interface API { endpoint: string, method: string, pathVariable: string, request: string, validation: string, response: string, description: string, }
    const apiObj = Object.keys(model.BoundedContexts).reduce(
        (apiObj: { [key: string]: { [key: string]: API } }, boundedContextName: string) => {
            boundedContextName = Utils.toPascalCase(boundedContextName);
            apiObj = { ...Utils.jsonParse(fs.readFileSync(`${domainModelsDire}API-${boundedContextName}.json`, 'utf-8')), ...apiObj };
            return apiObj;
        }, {}
    ) as { [key: string]: { [key: string]: API } };
    // console.log(JSON.stringify(apiObj, null, 4));

    // Controller実装作成
    Object.keys(apiObj).map((apiName: string) => {
        const controllerName = apiName.replace(/Service$/g, 'Controller');
        let classCode = ``;
        classCode += `package ${packageName}.controller;\n`;
        classCode += `\n`;
        classCode += `import org.springframework.beans.factory.annotation.Autowired;\n`;
        classCode += `import org.springframework.web.bind.annotation.*;\n`;
        classCode += `import org.springframework.validation.BindingResult;\n`;
        classCode += `import ${packageName}.entity.*;\n`;
        classCode += `import ${packageName}.service.${apiName};\n`;
        classCode += `import jakarta.validation.Valid;\n`;
        classCode += `import java.util.*;\n`;
        classCode += `\n`;
        classCode += `@RestController\n`;
        // classCode += `@RequestMapping("/${apiName.replace(/Service$/g, '')}")\n`;
        classCode += `public class ${controllerName} {\n\n`;

        classCode += `    @Autowired\n`;
        classCode += `    private ${apiName} ${Utils.toCamelCase(apiName)};\n\n`;

        Object.keys(apiObj[apiName]).forEach((methodName: string) => {
            const api = apiObj[apiName][methodName];
            const requestType = `${Utils.toPascalCase(methodName)}Request`;
            let controllerParamAry: string[] = [];
            let serviceParamAry: string[] = [];
            if (api.pathVariable) {
                const type = convertStringToJson(api.pathVariable);
                controllerParamAry = Object.keys(type).map((key: string) => `@PathVariable ${toJavaClass(type[key])} ${key}`);
                serviceParamAry = Object.keys(type).map((key: string) => key);
            } { }
            if (api.request) {
                // classCode += typeToInterface(requestType, convertStringToJson(api.request));
                // controllerParamAry.push(`@Valid @RequestBody ${requestType} requestBody, BindingResult bindingResult`);
                controllerParamAry.push(`@Valid @RequestBody ${apiName}.${requestType} requestBody`);
                serviceParamAry.push(`requestBody`);
            } else { }
            let responseType = toJavaClass(api.response);
            if (api.response && api.response.startsWith('{') && api.response.endsWith('}')) {
                // classCode += typeToInterface(`${Utils.toPascalCase(methodName)}Response`, convertStringToJson(api.response), {});
                responseType = `${apiName}.${Utils.toPascalCase(methodName)}Response`;
            } else { }

            classCode += `    @${Utils.toPascalCase(api.method)}Mapping("${api.endpoint.replace(/\/api\/v1\//g, '/')}")\n`;
            classCode += `    public ${toJavaClass(responseType)} ${methodName}(${controllerParamAry.join(', ')}) {\n`;
            if (toJavaClass(api.response) === 'void') {
                // voidの場合は戻り値を返さない。
                classCode += `        ${Utils.toCamelCase(apiName)}.${methodName}(${serviceParamAry.join(', ')});\n`;
            } else {
                classCode += `        return ${Utils.toCamelCase(apiName)}.${methodName}(${serviceParamAry.join(', ')});\n`;
            }
            classCode += `    }\n\n`;
        });
        classCode += `}\n`;
        fs.mkdirSync(`./gen/src/main/java/com/example/demo/controller`, { recursive: true });
        fs.writeFileSync(`./gen/src/main/java/com/example/demo/controller/${controllerName}.java`, classCode);
        return classCode;
    }).join('\n\n');

    // Service実装作成
    Object.keys(apiObj).map((apiName: string) => {

        let classCode = ``;
        classCode += `package ${packageName}.service;\n`;
        classCode += `\n`;
        classCode += `import org.springframework.web.bind.annotation.*;\n`;
        classCode += `import ${packageName}.entity.*;\n`;
        classCode += `import jakarta.validation.constraints.*;\n`;
        classCode += `import java.util.*;\n`;
        classCode += `import lombok.Data;\n`;
        classCode += `\n`;
        classCode += `public interface ${apiName} {\n\n`;

        Object.keys(apiObj[apiName]).forEach((methodName: string) => {
            const api = apiObj[apiName][methodName];
            const requestType = `${Utils.toPascalCase(methodName)}Request`;
            let controllerParamAry: string[] = [];
            let serviceParamAry: string[] = [];
            if (api.pathVariable) {
                const type = convertStringToJson(api.pathVariable);
                controllerParamAry = Object.keys(type).map((key: string) => `${toJavaClass(type[key])} ${key}`);
                serviceParamAry = Object.keys(type).map((key: string) => key);
            } { }
            if (api.request) {
                classCode += typeToInterface(requestType, convertStringToJson(api.request), convertStringToJson(api.validation));
                controllerParamAry.push(`${requestType} requestBody`);
                serviceParamAry.push(`requestBody`);
            } else { }

            let responseType = toJavaClass(api.response);
            if (api.response && api.response.startsWith('{') && api.response.endsWith('}')) {
                classCode += typeToInterface(`${Utils.toPascalCase(methodName)}Response`, convertStringToJson(api.response), {});
                responseType = `${Utils.toPascalCase(methodName)}Response`;
            } else { }
            classCode += `    public ${responseType} ${methodName}(${controllerParamAry.join(', ')}) ;\n\n`;
            // classCode += `        return ${Utils.toCamelCase(apiName)}.${methodName}(${serviceParamAry.join(', ')});\n`;
            // classCode += `        // TODO implementation\n`;
            // classCode += `    }\n`;
        });
        classCode += `}\n`;
        fs.mkdirSync(`./gen/src/main/java/com/example/demo/service`, { recursive: true });
        fs.writeFileSync(`./gen/src/main/java/com/example/demo/service/${apiName}.java`, classCode);
        return classCode;
    }).join('\n\n');

    // ServiceImplひな形作成(promptで使うだけ。実際の実装は別途)
    Object.keys(apiObj).map((apiName: string) => {

        let classCode = ``;
        classCode += `package ${packageName}.service.impl;\n`;
        classCode += `\n`;
        classCode += `import org.springframework.beans.factory.annotation.Autowired;\n`;
        classCode += `import org.springframework.web.bind.annotation.*;\n`;
        classCode += `import ${packageName}.entity.*;\n`;
        classCode += `import ${packageName}.repository.*;\n`;
        classCode += `import java.util.*;\n`;
        classCode += `import jakarta.validation.constraints.*;\n`;
        classCode += `import lombok.Data;\n`;
        classCode += `\n`;
        classCode += `@Service\n`;
        classCode += `public class ${apiName}Impl {\n\n`;

        // Serviceが属するBoundedContextを特定
        const boundedContextName = Object.keys(model.BoundedContexts).find((boundedContextName: string) => model.BoundedContexts[boundedContextName].DomainServices[apiName]);
        if (boundedContextName) {
            Object.keys(model.BoundedContexts[boundedContextName].Entities).forEach((entityName: string) => {
                const entity = model.BoundedContexts[boundedContextName].Entities[entityName];
                classCode += `    @Autowired\n`;
                classCode += `    private ${entity.name}Repository ${Utils.toCamelCase(entity.name)}Repository;\n\n`;
            });
        } else { }


        Object.keys(apiObj[apiName]).forEach((methodName: string) => {
            const api = apiObj[apiName][methodName];
            const requestType = `${Utils.toPascalCase(methodName)}Request`;
            let controllerParamAry: string[] = [];
            let serviceParamAry: string[] = [];
            if (api.pathVariable) {
                const type = convertStringToJson(api.pathVariable);
                controllerParamAry = Object.keys(type).map((key: string) => `${toJavaClass(type[key])} ${key}`);
                serviceParamAry = Object.keys(type).map((key: string) => key);
            } { }
            if (api.request) {
                classCode += typeToInterface(requestType, convertStringToJson(api.request), convertStringToJson(api.validation));
                controllerParamAry.push(`${requestType} requestBody`);
                serviceParamAry.push(`requestBody`);
            } else { }

            let responseType = toJavaClass(api.response);
            if (api.response && api.response.startsWith('{') && api.response.endsWith('}')) {
                classCode += typeToInterface(`${Utils.toPascalCase(methodName)}Response`, convertStringToJson(api.response), {});
                responseType = `${Utils.toPascalCase(methodName)}Response`;
            } else { }

            classCode += `    public ${toJavaClass(api.response)} ${methodName}(${controllerParamAry.join(', ')}) {\n`;
            // classCode += `        return ${Utils.toCamelCase(apiName)}.${methodName}(${serviceParamAry.join(', ')});\n`;
            classCode += `        // TODO implementation\n`;
            classCode += `    }\n\n`;
        });
        classCode += `}\n`;
        fs.mkdirSync(`./gen/src/main/java/com/example/demo/service/impl`, { recursive: true });
        fs.writeFileSync(`./gen/src/main/java/com/example/demo/service/impl/${apiName}.java.md`, classCode);
        fs.writeFileSync(`./gen/src/main/java/com/example/demo/service/${apiName}.java.md`, classCode);
        return classCode;
    }).join('\n\n');
}
export function serviceImpl() {
    const model = DomainModel.loadModels();

    // API用json定義読み込み
    interface API { endpoint: string, method: string, pathVariable: string, request: string, validation: string, response: string, description: string, }
    const apiObj = Object.keys(model.BoundedContexts).reduce(
        (apiObj: { [key: string]: { [key: string]: API } }, boundedContextName: string) => {
            boundedContextName = Utils.toPascalCase(boundedContextName);
            apiObj = { ...Utils.jsonParse(fs.readFileSync(`${domainModelsDire}API-${boundedContextName}.json`, 'utf-8')), ...apiObj };
            return apiObj;
        }, {}
    ) as { [key: string]: { [key: string]: API } };
    // console.log(JSON.stringify(apiObj, null, 4));

    const jpaMethods: { [key: string]: string[] } = {};
    // ServiceImpl実装
    Object.keys(apiObj).map((apiName: string) => {
        let impl: any = {};
        if (fs.existsSync(`${domainModelsDire}ServiceImplementation-${Utils.toPascalCase(apiName)}.json`)) {
            try { impl = (Utils.jsonParse(fs.readFileSync(`${domainModelsDire}ServiceImplementation-${Utils.toPascalCase(apiName)}.json`, 'utf-8')) as any); } catch (e) { return; }
        } else { return; }
        // impl 正規化
        impl.additionalImports = impl.additionalImports || [];
        impl.additionalJPAMethods = impl.additionalJPAMethods || {};
        impl.methods = impl.methods || {};

        // console.log(`ServiceImplementation-${Utils.toPascalCase(apiName)}.json`);
        Object.keys(impl.additionalJPAMethods).forEach((repositoryName: string) => {
            jpaMethods[repositoryName] = [...(jpaMethods[repositoryName] || []), ...impl.additionalJPAMethods[repositoryName]];
        });

        let classCode = ``;
        classCode += `package ${packageName}.service.impl;\n`;
        classCode += `\n`;
        classCode += `import org.springframework.beans.factory.annotation.Autowired;\n`;
        classCode += `import org.springframework.web.bind.annotation.*;\n`;
        classCode += `import org.springframework.stereotype.Service;\n`;
        classCode += `import ${packageName}.entity.*;\n`;
        classCode += `import ${packageName}.repository.*;\n`;
        classCode += `import ${packageName}.service.${apiName};\n`;
        classCode += `import java.util.*;\n`;
        classCode += `import lombok.Data;\n`;
        classCode += `\n`;
        classCode += impl.additionalImports.map((importName: string) => `import ${importName};\n`).join('');
        classCode += Object.keys(apiObj[apiName]).filter((methodName: string) => apiObj[apiName][methodName].request).map((methodName: string) => `import ${packageName}.service.${apiName}.${Utils.toPascalCase(methodName)}Request;\n`).join('');
        classCode += `\n`;
        classCode += `@Service\n`;
        classCode += `public class ${apiName}Impl implements ${apiName} {\n\n`;

        // Serviceが属するBoundedContextを特定
        const boundedContextName = Object.keys(model.BoundedContexts).find((boundedContextName: string) => model.BoundedContexts[boundedContextName].DomainServices[apiName]);
        if (boundedContextName) {
            Object.keys(model.BoundedContexts[boundedContextName].Entities).forEach((entityName: string) => {
                const entity = model.BoundedContexts[boundedContextName].Entities[entityName];
                classCode += `    @Autowired\n`;
                classCode += `    private ${entity.name}Repository ${Utils.toCamelCase(entity.name)}Repository;\n\n`;
            });
        } else { }


        Object.keys(apiObj[apiName]).forEach((methodName: string) => {
            const api = apiObj[apiName][methodName];
            const requestType = `${Utils.toPascalCase(methodName)}Request`;
            let controllerParamAry: string[] = [];
            let serviceParamAry: string[] = [];
            if (api.pathVariable) {
                const type = convertStringToJson(api.pathVariable);
                controllerParamAry = Object.keys(type).map((key: string) => `${toJavaClass(type[key])} ${key}`);
                serviceParamAry = Object.keys(type).map((key: string) => key);
            } { }
            if (api.request) {
                // classCode += typeToInterface(requestType, convertStringToJson(api.request));
                controllerParamAry.push(`${requestType} requestBody`);
                serviceParamAry.push(`requestBody`);
            } else { }

            let responseType = toJavaClass(api.response);
            if (api.response && api.response.startsWith('{') && api.response.endsWith('}')) {
                classCode += typeToInterface(`${Utils.toPascalCase(methodName)}Response`, convertStringToJson(api.response), {});
                responseType = `${Utils.toPascalCase(methodName)}Response`;
            } else { }

            classCode += `    @Override\n`;
            if ((impl.methods[methodName] || '').trim().startsWith('public ') || (impl.methods[methodName] || '').trim().startsWith('@')) {
            } else {
                classCode += `    public ${toJavaClass(api.response)} ${methodName}(${controllerParamAry.join(', ')}) {\n`;
            }
            // classCode += `    private ${api.response || 'void'} ${methodName}(${controllerParamAry.join(', ')}) {\n`;
            classCode += `${(impl.methods[methodName] || '').replace(/^(.*)$/gm, `    $1`)}\n`;
            // .replace(/([a-z0-9])Id\(/g, '$1ID(').replace(/\.findByID\(/g, '.findById(')
            // classCode += `        return ${Utils.toCamelCase(apiName)}.${methodName}(${serviceParamAry.join(', ')});\n`;
            // classCode += `        // TODO implementation\n`;
            if ((impl.methods[methodName] || '').trim().startsWith('public ') || (impl.methods[methodName] || '').trim().startsWith('@')) {
            } else {
                classCode += `    }\n\n`;
            }
        });
        classCode += `}\n`;
        fs.mkdirSync(`./gen/src/main/java/com/example/demo/service/impl`, { recursive: true });
        fs.writeFileSync(`./gen/src/main/java/com/example/demo/service/impl/${apiName}Impl.java`, classCode);
        return classCode;
    }).join('\n\n');

    // repository
    const repository = Object.keys(model.Entities).map((entityName: string) => {
        let classCode = '';
        classCode = ``;
        classCode += `package ${packageName}.repository;\n`;
        classCode += `\n`;
        // classCode += `import ${packageName}.entity.${entityName};\n`;
        classCode += `import ${packageName}.entity.*;\n`;
        classCode += `import java.util.List;\n`;
        classCode += `import java.util.Optional;\n`;
        classCode += `import org.springframework.data.jpa.repository.JpaRepository;\n`;
        classCode += `import org.springframework.stereotype.Repository;\n`;
        classCode += `\n`;
        classCode += `@Repository\n`;
        classCode += `public interface ${entityName}Repository extends JpaRepository<${entityName}, Integer> {\n`;
        classCode += (jpaMethods[`${entityName}Repository`] || []).map((methodSignature: string) => `    public ${methodSignature};`).join('\n');
        classCode += `\n`;
        classCode += `}\n`;
        fs.mkdirSync(`./gen/src/main/java/com/example/demo/repository`, { recursive: true });
        fs.writeFileSync(`./gen/src/main/java/com/example/demo/repository/${entityName}Repository.java`, classCode);
        return classCode;
    }).join('\n\n');
    // console.log(jpaMethods);

}
function typeToInterface(className: string, obj: { [key: string]: any }, api: { [key: string]: any }, layer: number = 0) {
    let classCode = ``;
    const indent = '    ';
    classCode += `${indent.repeat(layer + 1)}@Data\n`;
    classCode += `${indent.repeat(layer + 1)}public static class ${className} {\n`;
    // console.log(api);
    Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object') {
            // console.log(key);
            classCode += typeToInterface(Utils.toPascalCase(key), obj[key], api, layer + 1);
            classCode += `${indent.repeat(layer + 2)}private ${Utils.toPascalCase(key)} ${key};\n`;
        } else {
            // constraint
            JSON.parse((api[key] || '[]').replace(/'/g, '"')).forEach((validation: string) => {
                classCode += `${indent.repeat(layer + 2)}${validation}\n`;
            });
            // classCode += `${indent.repeat(layer + 2)}private ${Utils.toPascalCase(toJavaClass(obj[key]))} ${key};\n`;
            classCode += `${indent.repeat(layer + 2)}private ${Utils.toPascalCase(toJavaClass(obj[key]))} ${key};\n`;
        }
    });
    classCode += `${indent.repeat(layer + 1)}}\n`;
    // console.log(classCode);
    return classCode;
}

function convertStringToJson(input: string): { [key: string]: any } {
    const sourceFile = ts.createSourceFile('test.ts', `const dat:${input};`, ts.ScriptTarget.Latest);
    return (sourceFile.statements[0] as any).declarationList.declarations.map((state: any) => {
        const typeStringToObject = function (type: ts.MappedTypeNode): { [key: string]: any } {
            return type.members?.reduce((obj: { [key: string]: any }, member: any) => {
                obj[member.name.escapedText] = member.type.members ? typeStringToObject(member.type) : member.type.getText(sourceFile);
                return obj;
            }, {} as { [key: string]: any }) || {};
        }
        return typeStringToObject(state.type);
    })[0];
}


function toJavaClass(type: string): string {
    type = type || 'void';
    if (type.startsWith('list[')) {
        type = type.replace('list[', 'List<').replace(']', '>')
    } else { }
    if (type.endsWith('[]') || type.endsWith('<>')) {
        type = `List<${type.substring(0, type.length - 2)}>`;
    } else { }
    return type
        .replace('list[', 'List<').replace(']', '>')
        .replace('string', 'String')
        .replace('int', 'Integer')
        .replace('date', 'Date')
        .replace('time', 'Time')
        .replace('timestamp', 'Timestamp')
        .replace('boolean', 'Boolean')
        .replace('float', 'Float')
        .replace('double', 'Double')
        .replace('long', 'Long')
        .replace('short', 'Short')
        .replace('byte', 'Byte')
        .replace('char', 'Character')
        .replace('void', 'void')
        .replace('object', 'Object')
        .replace('Object', 'byte[]')
        .replace('integer', 'Integer')
        .replace('number', 'Number')
        .replace('biginteger', 'BigInteger')
        .replace('bigdecimal', 'BigDecimal')
        .replace('localdate', 'LocalDate')
        .replace('localtime', 'LocalTime')
        .replace('localdatetime', 'LocalDateTime')
        .replace('zoneddatetime', 'ZonedDateTime')
        .replace('offsetdatetime', 'OffsetDateTime')
        .replace('offsettime', 'OffsetTime')
        .replace('blob', 'Blob')
        .replace('clob', 'Clob')
        .replace('array', 'Array')
        .replace('ref', 'Ref')
        .replace('url', 'URL')
        .replace('uri', 'URI')
        .replace('uuid', 'UUID')
        .replace('timeuuid', 'TimeUUID')
        .replace('inetaddress', 'InetAddress')
        .replace('file', 'File')
        .replace('path', 'Path')
        .replace('class', 'Class')
        .replace('locale', 'Locale')
        .replace('currency', 'Currency')
        .replace('timezone', 'TimeZone')
        .replace('simpledateformat', 'SimpleDateFormat')
        .replace('datetimeformatter', 'DateTimeFormatter')
        .replace('datetimeformat', 'DateTimeFormat')
        .replace('datetimeformatterbuilder', 'DateTimeFormatterBuilder')
        .replace('periodformatter', 'PeriodFormatter')
        .replace('periodformatterbuilder', 'PeriodFormatterBuilder')
        .replace('periodformat', 'PeriodFormat')
        ;
}

function relationshipTypeReverse(relationshipType: RelationshipType): RelationshipType {
    switch (relationshipType) {
        case RelationshipType.OneToOne:
            return RelationshipType.OneToOne;
        case RelationshipType.OneToMany:
            return RelationshipType.ManyToOne;
        case RelationshipType.ManyToOne:
            return RelationshipType.OneToMany;
        case RelationshipType.ManyToMany:
            return RelationshipType.ManyToMany;
        default:
            throw new Error(`Unexpected relationshipType: ${relationshipType}`);
    }
}
function stringToEnum<T extends string>(str: string, enumObj: { [key: string]: T }): T {
    const enumValues = Object.values(enumObj);
    if (enumValues.includes(str as T)) { return str as T; }
    throw new Error(`Unexpected enum: ${str} in ${enumValues} `);
}
