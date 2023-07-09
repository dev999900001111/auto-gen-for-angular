import * as fs from 'fs';
import { Utils } from "../common/utils";
import { Attribute, DomainModel, Entity, Relationship, RelationshipType, domainModelsDire } from "../domain-models/domain-models";
import { toGoClass } from "./classname-converter";
import { convertStringToJson } from './source-generator';

interface API { endpoint: string, method: string, pathVariable: string, request: string, validation: string, response: string, description: string, }

export function toServiceProto(apiObj: { [key: string]: { [key: string]: API } }, modName: string, model: DomainModel, apiName: string) {
    // Controller実装作成
    let classCode = ``;
    classCode += `syntax = "proto3";\n`;
    classCode += `package service;\n`;
    classCode += `option go_package = "./";\n`;
    classCode += `// option go_package = "github.com/dev999900001111/sample-app";\n`;
    classCode += `import "google/protobuf/descriptor.proto";\n`;
    classCode += `import "google/protobuf/timestamp.proto";\n`;
    classCode += `import "validate/validate.proto";\n`;

    const classMap: { [key: string]: string } = {};
    Object.keys(apiObj[apiName]).forEach((methodName: string) => {
        const api = apiObj[apiName][methodName];
        [
            convertStringToJson(api.pathVariable || `{}`),
            convertStringToJson(api.request || `{}`),
            convertStringToJson(api.response || `{}`),
        ].forEach((json: { [key: string]: any }) => {
            // console.log(json);
            Object.keys(json).forEach((key: string) => {
                // console.log(`${key}: ${json[key]}`);
                if (model.Entities[json[key]]) {
                    classMap[json[key]] = 'entity';
                } else if (model.ValueObjects[json[key]]) {
                    classMap[json[key]] = 'value';
                } else if (model.Enums[json[key]]) {
                    classMap[json[key]] = 'enum';
                } else { }
            });
        });
        let cls = '';
        if (!api.response || api.response === 'void') {
        } else if (api.response.startsWith('List<') || api.response.endsWith(']')) {
            cls = api.response.replace(/List</g, '').replace(/>/g, '').replace(/\[\]/g, '');
        } else if (api.response.startsWith('{') || api.response.endsWith('}')) {
        } else {
            cls = api.response;
        }
        if (cls) {
            if (model.Entities[cls]) {
                classMap[cls] = 'entity';
            } else if (model.ValueObjects[cls]) {
                classMap[cls] = 'value';
            } else if (model.Enums[cls]) {
                classMap[cls] = 'enum';
            } else { }
        } else { }
    });
    // console.log(classMap);
    Object.keys(classMap).forEach((key: string) => {
        classCode += `import "${classMap[key]}_${Utils.toSnakeCase(key)}.proto";\n`;
    });

    classCode += `\n`;
    classCode += `service ${apiName} {\n`;
    Object.keys(apiObj[apiName]).forEach((methodName: string) => {
        const camelMethodName = Utils.toPascalCase(methodName);
        classCode += `    rpc ${camelMethodName}(${camelMethodName}Request) returns (${camelMethodName}Response);\n`;
    });
    classCode += `}\n\n`;
    Object.keys(apiObj[apiName]).forEach((methodName: string) => {
        const pascalMethodName = Utils.toPascalCase(methodName);
        const api = apiObj[apiName][methodName];

        let reqType = {};
        if (api.pathVariable) {
            const type = convertStringToJson(api.pathVariable);
            reqType = { ...reqType, ...type };
        } { }
        if (api.request) {
            reqType = { ...reqType, ...convertStringToJson(api.request) };
        } else { }
        classCode += `message ${pascalMethodName}Request {\n`;
        classCode += typeToInterface(reqType, convertStringToJson(api.validation, true));
        classCode += `}\n`;

        classCode += `message ${pascalMethodName}Response {\n`;
        if (!api.response || api.response === 'void' || api.response === 'Void') {
        } else if (api.response && api.response.startsWith('{') && api.response.endsWith('}')) {
            classCode += typeToInterface(convertStringToJson(api.response), {});
        } else {
            if (api.response.startsWith('List<') || api.response.endsWith(']')) {
                const type = api.response.replace(/.*</g, '').replace(/>/g, '').replace(/\[\]/g, '');
                classCode += `    repeated ${type} ${Utils.toPascalCase(type)} = 1;\n`;
            } else {
                classCode += `    ${api.response} ${Utils.toPascalCase(api.response)} = 1;\n`;
            }
        }
        classCode += `}\n\n`;
    });

    return classCode;
}


export function toServiceEntity(apiObj: { [key: string]: { [key: string]: API } }, modName: string, model: DomainModel, apiName: string) {
    // Controller実装作成
    let classCode = ``;
    classCode += `package entity\n`;
    // classCode += `import (\n`;
    // classCode += `    "time"\n`;
    // classCode += `)\n`;

    const classMap: { [key: string]: string } = {};
    Object.keys(apiObj[apiName]).forEach((methodName: string) => {
        const api = apiObj[apiName][methodName];
        [
            convertStringToJson(api.pathVariable || `{}`),
            convertStringToJson(api.request || `{}`),
            convertStringToJson(api.response || `{}`),
        ].forEach((json: { [key: string]: any }) => {
            // console.log(json);
            Object.keys(json).forEach((key: string) => {
                // console.log(`${key}: ${json[key]}`);
                if (model.Entities[json[key]]) {
                    classMap[json[key]] = 'entity';
                } else if (model.ValueObjects[json[key]]) {
                    classMap[json[key]] = 'value';
                } else if (model.Enums[json[key]]) {
                    classMap[json[key]] = 'enum';
                } else { }
            });
        });
        let cls = '';
        if (!api.response || api.response === 'void') {
        } else if (api.response.startsWith('List<') || api.response.endsWith(']')) {
            cls = api.response.replace(/List</g, '').replace(/>/g, '').replace(/\[\]/g, '');
        } else if (api.response.startsWith('{') || api.response.endsWith('}')) {
        } else {
            cls = api.response;
        }
        if (cls) {
            if (model.Entities[cls]) {
                classMap[cls] = 'entity';
            } else if (model.ValueObjects[cls]) {
                classMap[cls] = 'value';
            } else if (model.Enums[cls]) {
                classMap[cls] = 'enum';
            } else { }
        } else { }
    });
    // console.log(classMap);

    classCode += `\n`;
    Object.keys(apiObj[apiName]).forEach((methodName: string) => {
        const pascalMethodName = Utils.toPascalCase(methodName);
        const api = apiObj[apiName][methodName];

        let reqType = {};
        if (api.pathVariable) {
            const type = convertStringToJson(api.pathVariable);
            reqType = { ...reqType, ...type };
        } { }
        if (api.request) {
            reqType = { ...reqType, ...convertStringToJson(api.request) };
        } else { }
        classCode += `type ${pascalMethodName}Request struct {\n`;
        classCode += typeToInterface2(reqType, convertStringToJson(api.validation, true));
        classCode += `}\n`;

        classCode += `type ${pascalMethodName}Response struct {\n`;
        if (!api.response || api.response === 'void' || api.response === 'Void') {
        } else if (api.response && api.response.startsWith('{') && api.response.endsWith('}')) {
            classCode += typeToInterface2(convertStringToJson(api.response), {});
        } else {
            if (api.response.startsWith('List<') || api.response.endsWith(']')) {
                const type = api.response.replace(/.*</g, '').replace(/>/g, '').replace(/\[\]/g, '');
                classCode += `    ${type} []${Utils.toPascalCase(type)}\n`;
            } else {
                classCode += `    ${api.response} ${Utils.toPascalCase(api.response)}\n`;
            }
        }
        classCode += `}\n\n`;
    });
    return classCode;
}

export function toServiceCode(apiObj: { [key: string]: { [key: string]: API } }, modName: string, model: DomainModel, apiName: string) {
    // Controller実装作成
    let classCode = ``;

    classCode += `package service\n`;
    classCode += `\n`;
    classCode += `import (\n`;
    classCode += `	"context"\n`;
    classCode += `\n`;
    classCode += `	api "${modName}/api"\n`;
    classCode += `	uc "${modName}/internal/app/usecase"\n`;
    classCode += `	et "${modName}/internal/app/entity"\n`;
    classCode += `	"github.com/mitchellh/mapstructure"\n`;

    classCode += `\n`;
    classCode += `	"google.golang.org/grpc/codes"\n`;
    classCode += `	"google.golang.org/grpc/status"\n`;
    classCode += `)\n`;
    classCode += `\n`;
    classCode += `type ${apiName} struct {\n`;
    classCode += `	api.Unimplemented${apiName}Server\n`;
    // classCode += `	api.Unsafe${apiName}Server\n`;
    classCode += `	u uc.${apiName.replace(/Service$/g, 'Usecase')}\n`;
    classCode += `}\n`;
    classCode += `\n`;
    classCode += `func New${apiName}(u uc.${apiName.replace(/Service$/g, 'Usecase')}) *${apiName} {\n`;
    classCode += `	return &${apiName}{u: u}\n`;
    classCode += `}\n`;
    classCode += `\n`;
    Object.keys(apiObj[apiName]).forEach((methodName: string) => {
        const pascalMethodName = Utils.toPascalCase(methodName);
        classCode += `func (s *${apiName}) ${pascalMethodName}(ctx context.Context, req *api.${pascalMethodName}Request) (*api.${pascalMethodName}Response, error) {\n`;
        classCode += `	var reqObj et.${pascalMethodName}Request\n`;
        classCode += `	errReqMap := mapstructure.Decode(req, &reqObj)\n`;
        classCode += `	if errReqMap != nil {\n`;
        classCode += `	    return nil, status.Error(codes.InvalidArgument, "Request mapping error")\n`;
        classCode += `	}\n`;
        classCode += `	\n`;
        classCode += `	res, err := s.u.${pascalMethodName}(ctx, &reqObj)\n`;
        classCode += `	if err != nil {\n`;
        classCode += `		return nil, status.Error(codes.NotFound, "resource not found")\n`;
        classCode += `	}\n`;
        classCode += `	\n`;
        classCode += `	var resApiObj api.${pascalMethodName}Response\n`;
        classCode += `	errResMap := mapstructure.Decode(res, &resApiObj)\n`;
        classCode += `	if errResMap != nil {\n`;
        classCode += `	    return nil, status.Error(codes.Internal, "Response mapping error")\n`;
        classCode += `	}\n`;
        classCode += `	return &resApiObj, nil\n`;
        classCode += `}\n`;
    });
    return classCode;
}

export function toUsecaseCode(apiObj: { [key: string]: { [key: string]: API } }, modName: string, model: DomainModel, apiName: string) {
    // Controller実装作成
    let classCode = ``;
    const baseName = Utils.toPascalCase(apiName.replace(/Service$/g, ''));

    classCode += `package usecase\n`;
    classCode += `\n`;
    classCode += `import (\n`;
    classCode += `	"context"\n`;
    classCode += `\n`;
    // classCode += `	pb "${modName}/api"\n`;
    classCode += `	et "${modName}/internal/app/entity"\n`;
    classCode += `	repo "${modName}/internal/app/repository"\n`;
    // classCode += `\n`;
    // classCode += `	"google.golang.org/grpc/codes"\n`;
    // classCode += `	"google.golang.org/grpc/status"\n`;
    classCode += `)\n`;
    classCode += `\n`;
    classCode += `type ${baseName}Usecase interface {\n`;
    Object.keys(apiObj[apiName]).forEach((methodName: string) => {
        const pascalMethodName = Utils.toPascalCase(methodName);
        classCode += `    ${pascalMethodName}(ctx context.Context, req *et.${pascalMethodName}Request) (*et.${pascalMethodName}Response, error) \n`;
    });
    classCode += `}\n`;
    classCode += `\n`;
    classCode += `type ${Utils.toCamelCase(baseName)}Usecase struct {\n`;
    classCode += `	r repo.${baseName}Repository\n`;
    classCode += `}\n`;
    classCode += `\n`;
    classCode += `func New${baseName}Usecase(r repo.${baseName}Repository) ${baseName}Usecase {\n`;
    classCode += `	return &${Utils.toCamelCase(baseName)}Usecase{r: r}\n`;
    classCode += `}\n`;
    classCode += `\n`;
    Object.keys(apiObj[apiName]).forEach((methodName: string) => {
        const pascalMethodName = Utils.toPascalCase(methodName);
        classCode += `func (u *${Utils.toCamelCase(baseName)}Usecase) ${pascalMethodName}(ctx context.Context, req *et.${pascalMethodName}Request) (*et.${pascalMethodName}Response, error) {\n`;
        classCode += `	// TODO implements n`;
        classCode += `	return res, nil\n`;
        classCode += `}\n`;
    });
    return classCode;
}


export function toRepositoryCode(modName: string, model: DomainModel, entityName: string) {
    const camelEntityName = Utils.toCamelCase(entityName);
    let classCode = ``;

    classCode += `package repository\n`;
    classCode += `\n`;
    classCode += `import (\n`;
    classCode += `    "context"\n`;
    classCode += `    "database/sql"\n`;
    classCode += `    "log"\n`;
    classCode += `\n`;
    classCode += `    entity "${modName}/internal/app/entity"\n`;
    classCode += `)\n`;
    classCode += `\n`;
    classCode += `type ${entityName}Repository interface {\n`;
    classCode += `    Get${entityName}(ctx context.Context, id int32                     ) (*entity.${entityName}, error)\n`;
    classCode += `    Create${entityName}(ctx context.Context, inDto entity.${entityName}) (*entity.${entityName}, error)\n`;
    classCode += `    Update${entityName}(ctx context.Context, inDto entity.${entityName}) (*entity.${entityName}, error)\n`;
    classCode += `    List${entityName}(ctx context.Context                              ) (*entity.${entityName}, error)\n`;
    classCode += `    Delete${entityName}(ctx context.Context, id int32                  ) (*entity.${entityName}, error)\n`;
    classCode += `}\n`;
    classCode += `\n`;
    classCode += `type ${camelEntityName}Repository struct {\n`;
    classCode += `    db *sql.DB\n`;
    classCode += `}\n`;
    classCode += `\n`;
    classCode += `func New${entityName}Repository(db *sql.DB) ${entityName}Repository {\n`;
    classCode += `    return &${camelEntityName}Repository{db: db}\n`;
    classCode += `}\n`;
    classCode += `\n`;
    classCode += `func (repository *${camelEntityName}Repository) Get${entityName}(ctx context.Context, id int32) (*entity.${entityName}, error) {\n`;
    classCode += `    row := repository.db.QueryRowContext(ctx, "SELECT * FROM ${entityName} WHERE id = $1", id)\n`;
    classCode += `    log.Printf("database: logger")\n`;
    classCode += `    var obj entity.${entityName}\n`;
    classCode += `    err := row.Scan(&obj)\n`;
    classCode += `    if err != nil {\n`;
    classCode += `        return nil, err\n`;
    classCode += `    }\n`;
    classCode += `    return &obj, nil\n`;
    classCode += `}\n`;
    classCode += `\n`;
    classCode += `func (repository *${camelEntityName}Repository) Create${entityName}(ctx context.Context, inDto entity.${entityName}) (*entity.${entityName}, error) {\n`;
    classCode += `    row := repository.db.QueryRowContext(ctx, "SELECT * FROM ${entityName} WHERE id = $1", 1)\n`;
    classCode += `    log.Printf("database: logger")\n`;
    classCode += `    var obj entity.${entityName}\n`;
    classCode += `    err := row.Scan(&obj)\n`;
    classCode += `    if err != nil {\n`;
    classCode += `        return nil, err\n`;
    classCode += `    }\n`;
    classCode += `    return &obj, nil\n`;
    classCode += `}\n`;
    classCode += `\n`;
    classCode += `func (repository *${camelEntityName}Repository) Update${entityName}(ctx context.Context, inDto entity.${entityName}) (*entity.${entityName}, error) {\n`;
    classCode += `    row := repository.db.QueryRowContext(ctx, "SELECT * FROM ${entityName} WHERE id = $1", 1)\n`;
    classCode += `    log.Printf("database: logger")\n`;
    classCode += `    var obj entity.${entityName}\n`;
    classCode += `    err := row.Scan(&obj)\n`;
    classCode += `    if err != nil {\n`;
    classCode += `        return nil, err\n`;
    classCode += `    }\n`;
    classCode += `    return &obj, nil\n`;
    classCode += `}\n`;
    classCode += `\n`;
    classCode += `func (repository *${camelEntityName}Repository) List${entityName}(ctx context.Context) (*entity.${entityName}, error) {\n`;
    classCode += `    row := repository.db.QueryRowContext(ctx, "SELECT * FROM ${entityName} WHERE id = $1", 1)\n`;
    classCode += `    log.Printf("database: logger")\n`;
    classCode += `    var obj entity.${entityName}\n`;
    classCode += `    err := row.Scan(&obj)\n`;
    classCode += `    if err != nil {\n`;
    classCode += `        return nil, err\n`;
    classCode += `    }\n`;
    classCode += `    return &obj, nil\n`;
    classCode += `}\n`;
    classCode += `\n`;
    classCode += `func (repository *${camelEntityName}Repository) Delete${entityName}(ctx context.Context, id int32) (*entity.${entityName}, error) {\n`;
    classCode += `    row := repository.db.QueryRowContext(ctx, "SELECT * FROM ${entityName} WHERE id = $1", id)\n`;
    classCode += `    log.Printf("database: logger")\n`;
    classCode += `    var obj entity.${entityName}\n`;
    classCode += `    err := row.Scan(&obj)\n`;
    classCode += `    if err != nil {\n`;
    classCode += `        return nil, err\n`;
    classCode += `    }\n`;
    classCode += `    return &obj, nil\n`;
    classCode += `}\n`;
    return classCode;
}


export function typeToInterface(obj: { [key: string]: any }, api: { [key: string]: any }, layer: number = 0) {
    let classCode = ``;
    Object.keys(obj).forEach((key, index) => {
        if (typeof obj[key] === 'object') {
            console.log(`key:object:::::::::::------------------------${key}`);
        } else {
            classCode += `    ${toGoClass(obj[key])} ${Utils.toPascalCase(key)} = ${index + 1}`;
            // [(validate.rules).string = {min_len: 1, max_len: 50, required: true}]
            if (Utils.jsonParse<[]>((api[key] || '[]').replace(/'/g, '\\"')).length > 0) {
                classCode += ` [(validate.rules).message = {`;
                classCode += Utils.jsonParse<[]>((api[key] || '[]').replace(/'/g, '\\"')).map((validation: string) =>
                    validation.replace('@NotNull', 'required: true').replace('@NotBlank', 'required: true')
                ).join(', ');
                classCode += `}]`;
            } else {
                // no validate
            }
            classCode += `;\n`;
        }
    });
    return classCode;
}

export function typeToInterface2(obj: { [key: string]: any }, api: { [key: string]: any }, layer: number = 0) {
    let classCode = ``;
    Object.keys(obj).forEach((key, index) => {
        if (typeof obj[key] === 'object') {
            console.log(`key:object:::::::::::------------------------${key}`);
        } else {
            classCode += `    ${Utils.toPascalCase(key)} ${toGoClass(obj[key])}\n`;
        }
    });
    return classCode;
}

export function toEnumCode(modName: string, model: DomainModel, enumName: string) {
    let classCode = ``;
    classCode += `package entity\n`;
    classCode += `\n`;
    classCode += `// Enum \n`;
    classCode += `type ${enumName} int32\n`;
    classCode += `const (\n`;
    // valueは全て大文字に変換
    classCode += model.Enums[enumName].Values.map((value, index) => `    ${Utils.toPascalCase(value)} ${enumName} = ${index}`).join('\n');
    classCode += `\n)\n`;
    return classCode;
}

export function toEntityCode(modName: string, model: DomainModel, entityName: string) {
    let classCode = ``;

    classCode = ``;
    classCode += `package entity\n`;
    classCode += `\n`;
    classCode += `import (\n`;
    classCode += `	"${modName}/internal/app/base"\n`;
    classCode += `	"time"\n`;
    classCode += `)\n`;
    classCode += `\n`;
    classCode += `// Entity \n`;
    classCode += `type ${entityName} struct {\n`;

    // idを持っているかどうかを判定し、持っていない場合は追加
    if (!model.Entities[entityName].Attributes.find((attribute: Attribute) => attribute.name === 'id')) {
        classCode += `	Id   int64\n`;
    } else { }

    // attributeの型をJavaの型に変換
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

        // attributeの型をJavaの型に変換
        attribute.type = toGoClass(attribute.type);

        // attributeの型がEntityかValueObjectかを判定
        if (model.ValueObjects[foreignType]) {
            // attributeの型がEntityかValueObjectかの場合は埋め込み
            classCode += `	${foreignType}\n`;
        } else {
            classCode += `	${Utils.toPascalCase(attribute.name)} ${attribute.type}\n`;
        }
    });
    // entityはBaseEntityを埋め込む
    classCode += `	base.BaseEntity\n`;
    classCode += `}\n`;
    return classCode;
}
export function toValueObjectCode(modName: string, model: DomainModel, valueObjectName: string) {
    let classCode = ``;
    classCode += `package entity\n`;
    classCode += `\n`;
    classCode += `import (\n`;
    classCode += `	"${modName}/internal/app/base"\n`;
    classCode += `	"time"\n`;
    classCode += `)\n`;
    classCode += `\n`;
    classCode += `// ValueObject \n`;
    classCode += `type ${valueObjectName} struct {\n`;

    model.ValueObjects[valueObjectName].Attributes.forEach((attribute: Attribute) => {
        let isList = false;
        let foreignType = '';
        if (['list[', 'List<'].includes(attribute.type.substring(0, 5))) {
            foreignType = attribute.type.substring(5, attribute.type.length - 1);
            isList = true;
            // console.log(`List   ${foreignType}`);
        } else {
            foreignType = attribute.type;
            // console.log(`       ${foreignType}`);
        }

        // attributeの型をJavaの型に変換
        attribute.type = toGoClass(attribute.type);

        // attributeの型がEntityかValueObjectかを判定
        if (model.ValueObjects[foreignType]) {
            // attributeの型がEntityかValueObjectかの場合は埋め込み
            classCode += `	${foreignType}\n`;
        } else {
            classCode += `	${Utils.toPascalCase(attribute.name)} ${attribute.type}\n`;
        }
    });
    classCode += `}\n`;
    return classCode;
}












export function toEnumProto(modName: string, model: DomainModel, enumName: string) {
    let classCode = ``;

    classCode += `syntax = "proto3";\n`;
    classCode += `package service;\n`;
    classCode += `option go_package = "./";\n`;
    classCode += `// option go_package = "${modName}";\n`;
    classCode += `\n`;
    classCode += `enum ${Utils.toPascalCase(enumName)} {\n`;
    classCode += model.Enums[enumName].Values.map((value, index) => `    ${Utils.toPascalCase(value)} = ${index};`).join('\n');
    classCode += `\n}\n`;
    return classCode;
}

export function toEntityProto(modName: string, model: DomainModel, entityName: string) {
    let classCode = ``;

    classCode += `syntax = "proto3";\n`;
    classCode += `package service;\n`;
    classCode += `option go_package = "./";\n`;
    classCode += `// option go_package = "${modName}";\n`;
    classCode += `import "google/protobuf/timestamp.proto";\n`;
    classCode += `\n`;
    model.Entities[entityName].Attributes.forEach((attribute: Attribute, index: number) => {
        let foreignType = '';
        if (['list[', 'List<'].includes(attribute.type.substring(0, 5))) {
            foreignType = attribute.type.substring(5, attribute.type.length - 1);
        } else {
            foreignType = attribute.type.replace(/\[\]/g, '');
        }
        if (model.Entities[foreignType]) {
            classCode += `import "entity_${Utils.toSnakeCase(foreignType)}.proto";\n`;
        } else if (model.Enums[foreignType]) {
            classCode += `import "enum_${Utils.toSnakeCase(foreignType)}.proto";\n`;
        } else {
        }
    });

    classCode += `message ${Utils.toPascalCase(entityName)} {\n`;
    model.Entities[entityName].Attributes.forEach((attribute: Attribute, index: number) => {
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

        // attributeの型をJavaの型に変換
        attribute.type = toGoClass(attribute.type).replace(/time.Time/g, 'google.protobuf.Timestamp');

        // attributeの型がEntityかValueObjectかを判定
        if (model.ValueObjects[foreignType]) {
            // attributeの型がEntityかValueObjectかの場合は埋め込み
            model.ValueObjects[foreignType].Attributes.forEach((attribute: Attribute) => {
                classCode += `	${attribute.type} ${Utils.toPascalCase(attribute.name)} = ${index + 1};\n`;
            });
        } else {
            classCode += `	${attribute.type} ${Utils.toPascalCase(attribute.name)} = ${index + 1};\n`;
        }
    });
    classCode += `}\n`;
    return classCode;
}

export function toValueObjectProto(modName: string, model: DomainModel, valueObjectName: string) {
    let classCode = ``;

    classCode += `syntax = "proto3";\n`;
    classCode += `package service;\n`;
    classCode += `option go_package = "./";\n`;
    classCode += `//option go_package = "${modName}";\n`;
    classCode += `import "google/protobuf/timestamp.proto";\n`;
    classCode += `\n`;
    model.ValueObjects[valueObjectName].Attributes.forEach((attribute: Attribute, index: number) => {
        let foreignType = '';
        if (['list[', 'List<'].includes(attribute.type.substring(0, 5))) {
            foreignType = attribute.type.substring(5, attribute.type.length - 1);
        } else {
            foreignType = attribute.type.replace(/\[\]/g, '');
        }
        if (model.Entities[foreignType]) {
            classCode += `import "entity_${Utils.toSnakeCase(foreignType)}.proto";\n`;
        } else if (model.Enums[foreignType]) {
            classCode += `import "enum_${Utils.toSnakeCase(foreignType)}.proto";\n`;
        } else {
        }
    });

    classCode += `message ${Utils.toPascalCase(valueObjectName)} {\n`;
    model.ValueObjects[valueObjectName].Attributes.forEach((attribute: Attribute, index: number) => {
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

        // attributeの型をJavaの型に変換
        attribute.type = toGoClass(attribute.type).replace(/time.Time/g, 'google.protobuf.Timestamp');

        // attributeの型がEntityかValueObjectかを判定
        if (model.ValueObjects[foreignType]) {
            // attributeの型がEntityかValueObjectかの場合は埋め込み
            model.ValueObjects[foreignType].Attributes.forEach((attribute: Attribute) => {
                classCode += `	${attribute.type} ${Utils.toPascalCase(attribute.name)} = ${index + 1};\n`;
            });
        } else {
            classCode += `	${attribute.type} ${Utils.toPascalCase(attribute.name)} = ${index + 1};\n`;
        }
    });
    classCode += `}\n`;
    return classCode;
}
