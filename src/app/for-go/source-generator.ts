import * as fs from 'fs';
import * as ts from "typescript";
import fss from '../common/fss';
import { Attribute, DomainModel, Relationship, RelationshipType, domainModelsDire } from '../domain-models/domain-models';
import { Utils } from '../common/utils';
import main from './template/main.go';
import BaseEntityJava from './template/BaseEntity.java';
import ResourceNotFoundExceptionJava from './template/ResourceNotFoundException.java';
import { toGoClass } from './classname-converter';
import { toEntityCode, toEntityProto, toEnumCode, toEnumProto, toRepositoryCode, toServiceCode, toServiceEntity, toServiceProto, toUsecaseCode, toValueObjectCode, toValueObjectProto } from './model-converter';

const modName = 'github.com/dev999900001111/sample-app';
const outDire = `./gen/go/com/example/demo/`;
const ID_TYPE = 'int64';

export function genEntityAndRepository() {
    const model = DomainModel.loadModels();

    fss.writeFileSync(`${outDire}DemoApplication.java`, Utils.fillTemplate({ modName }, main));
    fss.writeFileSync(`${outDire}base/entity/base_entity.go`, Utils.fillTemplate({ modName }, BaseEntityJava));
    fss.writeFileSync(`${outDire}base/exception/ResourceNotFoundException.java`, Utils.fillTemplate({ modName }, ResourceNotFoundExceptionJava));
    fs.mkdirSync(`${outDire}app/`, { recursive: true });
    fs.mkdirSync(`${outDire}app/repository`, { recursive: true });
    fs.mkdirSync(`${outDire}app/service`, { recursive: true });
    fs.mkdirSync(`${outDire}app/usecase`, { recursive: true });

    // Entitys
    const entities = Object.keys(model.Entities).map((entityName: string) => {
        // goソース
        const classCode = toEntityCode(modName, model, entityName);
        fss.writeFileSync(`${outDire}entity/entity_${Utils.toSnakeCase(entityName)}.go`, classCode);

        // protoファイル
        const proto = toEntityProto(modName, model, entityName);
        fss.writeFileSync(`${outDire}service/entity_${Utils.toSnakeCase(entityName)}.proto`, proto.replace(/float64/g, 'double'));

        // repositoryファイル
        const repository = toRepositoryCode(modName, model, entityName);
        fss.writeFileSync(`${outDire}app/repository/${Utils.toSnakeCase(entityName)}.go`, repository);

        return classCode;
    }).join('\n\n');

    // Enum実装作成
    const enums = Object.keys(model.Enums).map((enumName: string) => {
        // goソース
        const classCode = toEnumCode(modName, model, enumName);
        fss.writeFileSync(`${outDire}entity/enum_${Utils.toSnakeCase(enumName)}.go`, classCode);

        // protoファイル
        const proto = toEnumProto(modName, model, enumName);
        fss.writeFileSync(`${outDire}service/enum_${Utils.toSnakeCase(enumName)}.proto`, proto.replace(/float64/g, 'double'));

        return classCode;
    }).join('\n\n');

    // ValueObject実装作成
    // ValueObjectとEntiyの処理が同じ感じになってきたので、共通化したい
    const valueObjects = Object.keys(model.ValueObjects).map((valueObjectName: string) => {
        // goソース
        const classCode = toValueObjectCode(modName, model, valueObjectName);
        fss.writeFileSync(`${outDire}entity/value_${Utils.toSnakeCase(valueObjectName)}.go`, classCode);

        // protoファイル
        const proto = toValueObjectProto(modName, model, valueObjectName);
        fss.writeFileSync(`${outDire}service/value_${Utils.toSnakeCase(valueObjectName)}.proto`, proto.replace(/float64/g, 'double'));

        return classCode;
    }).join('\n\n');

    // API用json定義読み込み
    interface API { endpoint: string, method: string, pathVariable: string, request: string, validation: string, response: string, description: string, }
    const apiObj = Object.keys(model.BoundedContexts).filter(
        (boundedContextName: string) => Object.keys(model.BoundedContexts[boundedContextName].DomainServices || {}).length > 0
    ).reduce(
        (apiObj: { [key: string]: { [key: string]: API } }, boundedContextName: string) => {
            boundedContextName = Utils.toPascalCase(boundedContextName);
            apiObj = { ...Utils.jsonParse(fs.readFileSync(`${domainModelsDire}API-${boundedContextName}.json`, 'utf-8')), ...apiObj };
            return apiObj;
        }, {}
    ) as { [key: string]: { [key: string]: API } };
    // console.log(JSON.stringify(apiObj, null, 4));
    // console.log(apiObj);

    // Service実装作成
    Object.keys(apiObj).map((apiName: string) => {

        const apiProto = toServiceProto(apiObj, modName, model, apiName);
        fss.writeFileSync(`${outDire}service/service_${Utils.toSnakeCase(apiName)}.proto`, apiProto.replace(/float64/g, 'double'));

        const serviceEntityCode = toServiceEntity(apiObj, modName, model, apiName);
        fss.writeFileSync(`${outDire}app/entity/service_${Utils.toSnakeCase(apiName.replace(/Service$/g, ''))}.go`, serviceEntityCode);

        const serviceCode = toServiceCode(apiObj, modName, model, apiName);
        fss.writeFileSync(`${outDire}app/service/${Utils.toSnakeCase(apiName)}.go`, serviceCode);

        const usecaseCode = toUsecaseCode(apiObj, modName, model, apiName);
        fss.writeFileSync(`${outDire}app/usecase/${Utils.toSnakeCase(apiName.replace(/Service$/g, 'Usecase'))}.go`, usecaseCode);

        const baseName = apiName.replace(/Service$/g, '');
        console.log(`    api.Register${baseName}ServiceServer(s, service.New${baseName}Service(usecase.New${baseName}Usecase(repository.New${baseName}Repository(db))))`);
        return apiName;
    }).join('\n\n');
}
export function serviceImpl() {
    const model = DomainModel.loadModels();

    // API用json定義読み込み
    interface API { endpoint: string, method: string, pathVariable: string, request: string, validation: string, response: string, description: string, }
    const apiObj = Object.keys(model.BoundedContexts).filter(
        (boundedContextName: string) => Object.keys(model.BoundedContexts[boundedContextName].DomainServices || {}).length > 0
    ).reduce(
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
        impl.additionalImports = impl.additionalImports.filter((value: any, index: number, self: any) => self.indexOf(value) === index);
        impl.additionalJPAMethods = impl.additionalJPAMethods || {};
        impl.methods = impl.methods || {};

        // console.log(`ServiceImplementation-${Utils.toPascalCase(apiName)}.json`);
        Object.keys(impl.additionalJPAMethods).forEach((repositoryName: string) => {
            jpaMethods[repositoryName] = [...(jpaMethods[repositoryName] || []), ...impl.additionalJPAMethods[repositoryName]];
        });

        let classCode = ``;
        classCode += `package ${modName}.service.impl;\n`;
        classCode += `\n`;
        classCode += `import org.springframework.beans.factory.annotation.Autowired;\n`;
        classCode += `import org.springframework.web.bind.annotation.*;\n`;
        classCode += `import org.springframework.stereotype.Service;\n`;
        classCode += `import ${modName}.base.exception.ResourceNotFoundException;\n`;
        classCode += `import ${modName}.entity.*;\n`;
        classCode += `import ${modName}.repository.*;\n`;
        classCode += `import ${modName}.service.${apiName};\n`;
        classCode += `import java.math.BigDecimal;\n`;
        classCode += `import java.time.*;\n`;
        classCode += `import java.util.*;\n`;
        classCode += `import lombok.Data;\n`;
        classCode += `\n`;
        classCode += impl.additionalImports.map((importName: string) => `import ${importName};\n`).join('');
        classCode += Object.keys(apiObj[apiName]).filter((methodName: string) => apiObj[apiName][methodName].request).map((methodName: string) => `import ${modName}.service.${apiName}.${Utils.toPascalCase(methodName)}Request;\n`).join('');
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
            ['request', 'response'].forEach((key: string) => { const apiAny = api as any; apiAny[key] = typeof (apiAny[key] || '') === 'object' ? JSON.stringify(apiAny[key]) : apiAny[key]; });
            const requestType = `${Utils.toPascalCase(methodName)}Request`;
            let controllerParamAry: string[] = [];
            let serviceParamAry: string[] = [];
            if (api.pathVariable) {
                const type = convertStringToJson(api.pathVariable);
                controllerParamAry = Object.keys(type).map((key: string) => `${toGoClass(type[key])} ${key}`);
                serviceParamAry = Object.keys(type).map((key: string) => key);
            } { }
            if (api.request) {
                // classCode += typeToInterface(requestType, convertStringToJson(api.request));
                controllerParamAry.push(`${requestType} requestBody`);
                serviceParamAry.push(`requestBody`);
            } else { }

            let responseType = toGoClass(api.response);
            if (api.response && api.response.startsWith('{') && api.response.endsWith('}')) {
                classCode += typeToInterface(`${Utils.toPascalCase(methodName)}Response`, convertStringToJson(api.response), {});
                responseType = `${Utils.toPascalCase(methodName)}Response`;
            } else { }

            classCode += `    @Override\n`;
            impl.methods[methodName] = impl.methods[methodName] || { annotations: [], body: '' };
            classCode += `    public ${toGoClass(api.response)} ${methodName}(${controllerParamAry.join(', ')}) {\n`;
            classCode += `${(impl.methods[methodName].body || '').replace(/^(.*)$/gm, `    $1`)}\n`;
            classCode += `    }\n\n`;
        });
        classCode += `}\n`;
        fss.writeFileSync(`${outDire}service/impl/${apiName}Impl.java`, classCode);
        return classCode;
    }).join('\n\n');

    // repository
    Object.keys(jpaMethods).forEach((repositoryName: string) => {
        jpaMethods[repositoryName] = [...new Set(jpaMethods[repositoryName])];
    });

    const repository = Object.keys(model.Entities).map((entityName: string) => {
        let classCode = '';
        classCode = ``;
        classCode += `package ${modName}.repository;\n`;
        classCode += `\n`;
        // classCode += `import ${modName}.entity.${entityName};\n`;
        classCode += `import ${modName}.entity.*;\n`;
        classCode += `import java.util.List;\n`;
        classCode += `import java.util.Optional;\n`;
        classCode += `import java.math.BigDecimal;\n`;
        classCode += `import java.time.*;\n`;
        classCode += `import java.util.*;\n`;
        classCode += `import org.springframework.data.jpa.repository.JpaRepository;\n`;
        classCode += `import org.springframework.stereotype.Repository;\n`;
        classCode += `\n`;
        classCode += `@Repository\n`;
        classCode += `public interface ${entityName}Repository extends JpaRepository<${entityName}, ${ID_TYPE}> {\n`;
        classCode += (jpaMethods[`${entityName}Repository`] || []).map((methodSignature: string) => `    public ${methodSignature};`).join('\n');
        classCode += `\n`;
        classCode += `}\n`;
        fss.writeFileSync(`${outDire}repository/${entityName}Repository.java`, classCode);
        return classCode;
    }).join('\n\n');
    // console.log(jpaMethods);

}
export function typeToInterface(className: string, obj: { [key: string]: any }, api: { [key: string]: any }, layer: number = 0) {
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
            Utils.jsonParse<[]>((api[key] || '[]').replace(/'/g, '\\"')).forEach((validation: string) => {
                classCode += `${indent.repeat(layer + 2)}${validation}\n`;
            });
            // classCode += `${indent.repeat(layer + 2)}private ${Utils.toPascalCase(toGoClass(obj[key]))} ${key};\n`;
            classCode += `${indent.repeat(layer + 2)}private ${Utils.toPascalCase(toGoClass(obj[key]))} ${key};\n`;
        }
    });
    classCode += `${indent.repeat(layer + 1)}}\n`;
    // console.log(classCode);
    return classCode;
}

export function convertStringToJson(input: string, isValidation = false): { [key: string]: any } {
    //TODO {a:int},{b:int}←こんな感じになってしまうことがあるのを無理やり対処しているが、本当は綺麗に対処したい。
    if (input && typeof input === 'object') {
        input = JSON.stringify(input);
    }
    if (isValidation) {
    } else {
        input = input.replace(/"/g, '');
    }
    const sourceFile = ts.createSourceFile('test.ts', `const dat:${(input || '').replace(/},{/g, ',')};`, ts.ScriptTarget.Latest);
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
