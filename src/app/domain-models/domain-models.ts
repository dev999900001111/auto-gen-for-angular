import * as fs from 'fs';
import { Utils } from '../common/utils';
import { isNumberObject } from 'util/types';

const domainModelsDire = `./gen/domain-models/`;
export enum DomainModelPattern {
    Entities = 'Entities',
    ValueObjects = 'ValueObjects',
    Aggregates = 'Aggregates',

    DomainEvents = 'DomainEvents',
    DomainServices = 'DomainServices',

    // Repositories = 'Repositories',

    BoundedContexts = 'BoundedContexts',
    ContextMappings = 'ContextMappings',

    BatchJobs = 'BatchJobs',
    Relationships = 'Relationships',
}

export enum ContextMapRelationshipType {
    Partnership = 'Partnership',
    SharedKernel = 'SharedKernel',
    CustomerSupplier = 'CustomerSupplier',
    Conformist = 'Conformist',
    AnticorruptionLayer = 'AnticorruptionLayer',
    OpenHostService = 'OpenHostService',
    PublishedLanguage = 'PublishedLanguage',
}
export enum RelationshipType {
    OneToOne = 'OneToOne',
    OneToMany = 'OneToMany',
    ManyToOne = 'ManyToOne',
    ManyToMany = 'ManyToMany',
}

export interface Attribute { name: string; type: string; }
export interface Method { name: string; args: Attribute[]; returnType: string; }

export interface Entity { name: string; Attributes: Attribute[]; Methods: Method[]; }
export interface ValueObject { name: string; Attributes: Attribute[]; }
export interface Aggrigate { name: string; RootEntity: Entity; Entities: Entity[]; ValueObjects: ValueObject[]; }

export interface DomainEvents { name: string; description: string; Attributes: Attribute[]; Methods: Method[]; }
export interface DomainService { name: string; Methods: Method[]; }

export interface Repository { name: string; Methods: Method[]; }

export interface BoundedContext { name: string; Entities: { [key: string]: Entity }; ValueObjects: { [key: string]: ValueObject }; Aggregates: { [key: string]: Aggrigate }; DomainServices: { [key: string]: DomainService }; DomainEvents: { [key: string]: DomainEvents }; }
export interface ContextMapping { type: ContextMapRelationshipType; source: BoundedContext; target: BoundedContext; }

export interface BatchJob { name: string; Methods: Method[]; Attributes: Attribute[]; Description: string; }
export interface Relationship { type: string; source: Entity | ValueObject; target: Entity | ValueObject; }

export class DomainModel {
    Entities: { [key: string]: Entity } = {};
    ValueObjects: { [key: string]: ValueObject } = {};
    Aggregates: { [key: string]: Aggrigate } = {};

    Repositories: { [key: string]: Repository } = {};

    DomainEvents: { [key: string]: DomainEvents } = {};
    DomainServices: { [key: string]: DomainService } = {};

    BoundedContexts: { [key: string]: BoundedContext } = {};
    ContextMappings: ContextMapping[] = [];
    ContextMappingSourceMap: { [key: string]: { type: ContextMapRelationshipType, target: string }[] } = {};
    ContextMappingTargetMap: { [key: string]: { type: ContextMapRelationshipType, source: string }[] } = {};

    BatchJobs: { [key: string]: BatchJob } = {};
    Relationships: Relationship[] = [];
    RelationshipSourceMap: { [key: string]: { type: RelationshipType, target: string }[] } = {};
    RelationshipTargetMap: { [key: string]: { type: RelationshipType, source: string }[] } = {};

    constructor() { }

    static loadModels(): DomainModel {
        const domainModelsRawMap: { [key: string]: any } = {};
        Object.values(DomainModelPattern).forEach(pattern => {
            if (fs.existsSync(`${domainModelsDire}${pattern}.json`)) {
                try {
                    domainModelsRawMap[pattern] = Utils.jsonParse(fs.readFileSync(`${domainModelsDire}${pattern}.json`, 'utf-8'));
                } catch (e) {
                    console.error(`Error parsing ${pattern}.json`);
                }
            } else { }
        });

        const domainModel: DomainModel = new DomainModel();

        const loadMethod = (rawObj: any): Method[] => {
            const methods = rawObj['Methods'] || rawObj['methods'];
            return Object.keys(methods).map(methodName => {
                const methodRaw = methods[methodName];
                const method: Method = {
                    name: methodName,
                    args: loadArgs(methodRaw),
                    returnType: methodRaw['returnType'],
                };
                return method;
            });
        };
        const loadAttribute = (rawObj: any): Attribute[] => {
            const attributes = rawObj['Attributes'] || rawObj['attributes'];
            return Object.keys(attributes).map(attributeName => {
                return {
                    name: attributeName,
                    type: attributes[attributeName].replace('list[', 'List<').replace(']', '>'),
                };
            });
        };
        const loadArgs = (rawObj: any): Attribute[] => {
            return Object.keys(rawObj['args']).map(argName => {
                return {
                    name: argName,
                    type: rawObj['args'][argName].replace('list[', 'List<').replace(']', '>'),
                };
            });
        };

        // ValueObjects
        Object.keys(domainModelsRawMap.ValueObjects).forEach(valueObjectName => {
            const valueObjectRaw = domainModelsRawMap.ValueObjects[valueObjectName];
            const valueObject: ValueObject = {
                name: valueObjectName,
                Attributes: Object.keys(valueObjectRaw).map(argName => {
                    return {
                        name: argName,
                        type: valueObjectRaw[argName],
                    };
                })
            };
            domainModel.ValueObjects[valueObjectName] = valueObject;
        });
        // console.log(JSON.stringify(domainModel.ValueObjects));

        // Entities
        Object.keys(domainModelsRawMap.BoundedContexts).forEach(boundedContextName => {
            boundedContextName = Utils.toPascalCase(boundedContextName);
            const key = `Entities-${boundedContextName}`;
            domainModelsRawMap[key] = Utils.jsonParse(fs.readFileSync(`${domainModelsDire}${key}.json`, 'utf-8'));
            Object.keys(domainModelsRawMap[key] || []).filter(entityName => {
                // ValueObjectに登録済みの場合は重複定義になってしまうので除外
                return !domainModel.ValueObjects[entityName];
            }).forEach(entityName => {
                const entityRaw = domainModelsRawMap[key][entityName];
                const entity: Entity = {
                    name: entityName,
                    Attributes: loadAttribute(entityRaw),
                    Methods: loadMethod(entityRaw),
                };
                domainModel.Entities[entityName] = entity;
            });
        });
        // console.log(JSON.stringify(domainModel.Entities));

        // Aggregates
        Object.keys(domainModelsRawMap.Aggregates).forEach(aggregateName => {
            const aggregateRaw = domainModelsRawMap.Aggregates[aggregateName];

            const entitiesAndValueObjects = { ...domainModel.Entities, ...domainModel.ValueObjects };
            const entitiesAndValueObjectsNames = [...(aggregateRaw.Entities || []), ...(aggregateRaw.ValueObjects || [])];
            const aggregate: Aggrigate = {
                name: aggregateName,
                RootEntity: domainModel.Entities[aggregateRaw.RootEntity],
                Entities: entitiesAndValueObjectsNames.filter((entityName: string) => domainModel.Entities[entityName]).map((entityName: string) => entitiesAndValueObjects[entityName]) as Entity[],
                ValueObjects: entitiesAndValueObjectsNames.filter((entityName: string) => domainModel.ValueObjects[entityName]).map((entityName: string) => entitiesAndValueObjects[entityName]) as ValueObject[],
            };
            domainModel.Aggregates[aggregateName] = aggregate;
        });
        // console.log(JSON.stringify(domainModel.Aggregates));

        // DomainServices
        Object.keys(domainModelsRawMap.BoundedContexts).forEach(boundedContextName => {
            boundedContextName = Utils.toPascalCase(boundedContextName);
            const key = `DomainServices-${boundedContextName}`;
            domainModelsRawMap[key] = Utils.jsonParse(fs.readFileSync(`${domainModelsDire}${key}.json`, 'utf-8'));
            Object.keys(domainModelsRawMap[key] || []).forEach(domainServiceName => {
                const domainServiceRaw = domainModelsRawMap[key][domainServiceName];
                const domainService: DomainService = {
                    name: domainServiceName,
                    Methods: loadMethod(domainServiceRaw),
                };
                domainModel.DomainServices[domainServiceName] = domainService;
            });
        });
        // console.log(JSON.stringify(domainModel.DomainServices));

        // // Repositories
        // Object.keys(domainModelsRawMap.Repositories).forEach(repositoryName => {
        //     const repositoryRaw = domainModelsRawMap.Repositories[repositoryName];
        //     const repository: Repository = {
        //         name: repositoryName,
        //         Methods: loadMethod(repositoryRaw),
        //     };
        //     domainModel.Repositories[repositoryName] = repository;
        // });
        // // console.log(JSON.stringify(domainModel.Repositories));

        // DomainEvents
        Object.keys(domainModelsRawMap.DomainEvents).forEach(DomainEventName => {
            const DomainEventRaw = domainModelsRawMap.DomainEvents[DomainEventName];
            const DomainEvent: DomainEvents = {
                name: DomainEventName,
                description: DomainEventRaw.description,
                Attributes: loadAttribute(DomainEventRaw),
                Methods: loadMethod(DomainEventRaw),
            };
            domainModel.DomainEvents[DomainEventName] = DomainEvent;
        });
        // console.log(JSON.stringify(domainModel.DomainEvents));

        // BoundedContexts
        Object.keys(domainModelsRawMap.BoundedContexts).forEach(boundedContextName => {
            const boundedContextRaw = domainModelsRawMap.BoundedContexts[boundedContextName];
            // BoundedContextsでEntitiesとValueObjectsが混同されていることがあるので、両方を結合してからフィルタリングする
            const entitiesAndValueObjects = { ...domainModel.Entities, ...domainModel.ValueObjects };
            const entitiesAndValueObjectsNames = [...(boundedContextRaw.Entities || []), ...(boundedContextRaw.ValueObjects || [])];
            const boundedContext: BoundedContext = {
                name: boundedContextName,
                Entities: entitiesAndValueObjectsNames.reduce((entities: { [key: string]: Entity }, name: string) => {
                    if (domainModel.Entities[name]) { entities[name] = entitiesAndValueObjects[name] as Entity; } else { }
                    return entities;
                }, {} as { [key: string]: Entity }),
                ValueObjects: entitiesAndValueObjectsNames.reduce((entities: { [key: string]: ValueObject }, name: string) => {
                    if (domainModel.ValueObjects[name]) { entities[name] = entitiesAndValueObjects[name] as ValueObject; } else { }
                    return entities;
                }, {} as { [key: string]: ValueObject }),
                Aggregates: (boundedContextRaw.Aggregates || []).reduce((aggregates: { [key: string]: Aggrigate }, name: string) => {
                    aggregates[name] = domainModel.Aggregates[name]; return aggregates;
                }, {} as { [key: string]: Aggrigate }),
                DomainServices: (boundedContextRaw.DomainServices || []).reduce((domainServices: { [key: string]: DomainService }, name: string) => {
                    domainServices[name] = domainModel.DomainServices[name]; return domainServices;
                }, {} as { [key: string]: DomainService }),
                DomainEvents: (boundedContextRaw.DomainEvents || []).reduce((domainEvents: { [key: string]: DomainEvents }, name: string) => {
                    domainEvents[name] = domainModel.DomainEvents[name]; return domainEvents;
                }, {} as { [key: string]: DomainEvents }),
            };
            domainModel.BoundedContexts[boundedContextName] = boundedContext;
        });
        // console.log(JSON.stringify(domainModel.BoundedContexts));

        // ContextMappings
        domainModelsRawMap.ContextMappings.forEach((contextMappingRaw: any) => {
            const contextMapping: ContextMapping = {
                type: contextMappingRaw.type,
                source: domainModel.BoundedContexts[contextMappingRaw.source],
                target: domainModel.BoundedContexts[contextMappingRaw.target],
            };
            domainModel.ContextMappings.push(contextMapping);
            if (!domainModel.ContextMappingSourceMap[contextMappingRaw.source]) domainModel.ContextMappingSourceMap[contextMappingRaw.source] = [];
            if (!domainModel.ContextMappingTargetMap[contextMappingRaw.target]) domainModel.ContextMappingTargetMap[contextMappingRaw.target] = [];
            domainModel.ContextMappingSourceMap[contextMappingRaw.source].push({ type: contextMappingRaw.type, target: contextMappingRaw.target });
            domainModel.ContextMappingTargetMap[contextMappingRaw.target].push({ type: contextMappingRaw.type, source: contextMappingRaw.source });
        });
        // console.log(JSON.stringify(domainModel.ContextMappings));

        // BatchJobs
        Object.keys(domainModelsRawMap.BatchJobs).forEach(batchJobName => {
            const batchJobRaw = domainModelsRawMap.BatchJobs[batchJobName];
            const batchJob: BatchJob = {
                name: batchJobName,
                Description: batchJobRaw.Description,
                Attributes: loadAttribute(batchJobRaw),
                Methods: loadMethod(batchJobRaw),
            };
            domainModel.BatchJobs[batchJobName] = batchJob;
        });
        // console.log(JSON.stringify(domainModel.BatchJobs));

        // Relationships
        domainModel.Relationships = [];
        Object.keys(domainModel.Entities).forEach((entityName: string) => {
            domainModel.Entities[entityName].Attributes.forEach((attribute: Attribute) => {

                let propType = '';
                let isList = false;
                if (attribute.type.startsWith('List<')) {
                    propType = attribute.type.substring(5, attribute.type.length - 1);
                    // console.log(`List   ${propType}`);
                    isList = true;
                } else if (
                    domainModel.Entities[attribute.type] ||
                    domainModel.ValueObjects[attribute.type]
                ) {
                    propType = attribute.type;
                    // console.log(`       ${propType}`);
                }

                if (domainModel.Entities[propType]) {
                    const chilAttr = domainModel.Entities[propType].Attributes.find((attr: Attribute) => {
                        let propTypeChil = '';
                        if (attr.type.startsWith('List<')) {
                            propTypeChil = attr.type.substring(5, attr.type.length - 1);
                        } else if (domainModel.Entities[attr.type]) {
                            propTypeChil = attr.type;
                        } else { }
                        // console.log(`${propTypeChil} ${entityName}`);
                        return propTypeChil === entityName;
                    });
                    const isListChil = chilAttr ? chilAttr.type.startsWith('List<') : false;
                    // console.log(`${entityName} ${attribute.name} ${attribute.type} ${propType} ${isList} ${isListChil}`)
                    domainModel.Relationships.push({
                        type: isList
                            ? (isListChil ? RelationshipType.ManyToMany : RelationshipType.OneToMany)
                            : (isListChil ? RelationshipType.ManyToOne : RelationshipType.OneToOne),
                        source: domainModel.Entities[entityName],
                        target: domainModel.Entities[propType],
                    });
                } else {
                }
            });
        });
        // console.log(JSON.stringify(domainModel.RelationshipSourceMap));

        return domainModel;
    }

    /**
     * 
     * @returns 
     */
    getAttributeTable(pattern: DomainModelPattern, domainModelParam: DomainModel | BoundedContext = this): string {
        let table = '';
        const domainModel: { [key: string]: any } = domainModelParam;

        if (DomainModelPattern.Aggregates === pattern) {
            table = Object.keys(domainModel.Aggregates).map((aggregateName: string) => {
                const aggrigate = domainModel.Aggregates[aggregateName];
                let buffer = `- ${aggrigate.name}\n`;
                buffer += `   - RootEntity: ${aggrigate.RootEntity.name}\n`;
                buffer += `   - Entities: ${aggrigate.Entities.map((entity: Entity) => entity.name).join(', ')}\n`;
                buffer += `   - ValueObjects: ${aggrigate.ValueObjects.map((valueObject: ValueObject) => valueObject.name).join(', ')}\n`;
                return buffer;
            }).join('\n');
        } else {
            table = Object.keys(domainModel[pattern]).map(objectName => {
                const object = domainModel[pattern][objectName];
                // 数字から始まるものは、objectNameには名前が入っていないので、objectから取得する
                // if (`${objectName}`.match(/^[0-9]+/)) { objectName = object.name; } else { }
                // Attributesを持たないパターンのものは無視
                if (object && object.Attributes) { } else { return }
                let buffer = `- ${objectName}\n`;
                buffer += object.Attributes.map((attribute: Attribute) => `   - ${attribute.name}: ${attribute.type};`).join('\n');
                return buffer;
            }).join('\n\n');
        }
        return table;
    }
}

export interface ColumnModel { name: string; type: string; constraint: string; default: string; }
export class TableModel {
    constructor(public name: string, public columns: ColumnModel[]) { }
    public toDDL(): string {
        let ddl = `-- DROP TABLE ${this.name};\nCREATE TABLE ${this.name} (\n`;
        ddl += this.columns.map((column: ColumnModel) =>
            `    ${column.name} ${column.type} ${column.constraint} ${column.default ? (' DEFAULT ' + column.default) : ''}`
        ).join(',\n')
        ddl += '\n);\n'
        return ddl;
    }
    static loadModels(): TableModel[] {
        const tableColumns: { [key: string]: string[][] } = Utils.jsonParse(fs.readFileSync(`${domainModelsDire}TableColumns.json`, 'utf-8'));
        return Object.keys(tableColumns).map((tableName: string) => {
            return new TableModel(
                tableName,
                tableColumns[tableName].map((columnDefAry: string[]) => {
                    return {
                        name: columnDefAry[0],
                        type: columnDefAry[1],
                        constraint: columnDefAry[2],
                        default: columnDefAry[3],
                    }
                })
            );
        });
    }
}


//
// "employee": [
//     ["id", "serial", "PRIMARY KEY", ""],
//     ["name", "varchar(255)", "NOT NULL", ""],
//     ["email", "varchar(255)", "NOT NULL", ""],
//     ["phone", "varchar(20)", "", ""],
//     ["address", "varchar(255)", "", ""],
//     ["position_id", "integer", "REFERENCES position(id)", ""],
//     ["department_id", "integer", "REFERENCES department(id)", ""],
//     ["team_id", "integer", "REFERENCES team(id)", ""],
//     ["employment_type_id", "integer", "REFERENCES employment_type(id)", ""]
// ],
//
// const a = {
//     "Entities": {
//         "${EntityNam}": {
//             "Attributes": {
//                 "${name}": "${type}",
//                 "${name}": "${type}"
//             },
//             "Methods": {
//                 "${methodName}": {
//                     "args": {
//                         "${name}": "${type}",
//                         "${name}": "${type}"
//                     },
//                     "returnType": "${type}"
//                 }
//             }
//         }
//     },
//     "ValueObjects": {
//         "${ValueObjectName}": {
//             "${name}": "${type}",
//             "${name}": "${type}"
//         }
//     },
//     "Aggregates": {
//         "${AggregateName}": {
//             "RootEntity": "${EntityName}",
//             "Entities": [
//                 "${EntityName}"
//             ],
//             "ValueObjects": [
//                 "${ValueObjectName}"
//             ]
//         }
//     },
//     "DomainServices": {
//         "${DomainServiceName}": {
//             "Methods": {
//                 "${methodName}": {
//                     "args": {
//                         "${name}": "${type}",
//                         "${name}": "${type}"
//                     },
//                     "returnType": "${type}"
//                 }
//             }
//         }
//     },
//     "Repositories": {
//         "${RepositoryName}": {
//             "Methods": {
//                 "${methodName}": {
//                     "args": {
//                         "${name}": "${type}",
//                         "${name}": "${type}"
//                     },
//                     "returnType": "${type}"
//                 }
//             }
//         }
//     }
// };


// const DOMAIN_MODEL_PATTERNS = [
//   'Entities', 'ValueObjects', 'Aggregates',
//   'DomainServices', 'Repositories', 'resolve(this.postProcess(content));',
//   // 'DomainEvents', 'Factories',
//   // 'ContextMapping', 'AntiCorruptionLayer', 'ContinuousIntegration', 'Refactoring',
//   // ------
//   // 'DomainAnalysis',
//   // 'IdentifyBoundedContexts',
//   // 'ModelDrivenDesign',
//   // 'DesignRepositories',
//   // 'DesignServices',
//   // 'DesignFactories',
//   // 'ImplementAntiCorruptionLayer',
//   // 'LeveragingDomainEvents',
//   // 'EnterpriseArchitecture',
//   // 'DesignDomainModel',
//   // 'ImplementDomainLogic',
//   // 'CreateApplicationLayer',
//   // 'CreateInfrastructureLayer',
//   // 'PerformUnitTests',
//   // 'PerformIntegrationTests',
//   // 'ApplyDomainDrivenDesignPatterns',
//   // 'ImplementUI',
//   // 'IterativeDevelopment',
//   // 'RefineDomain',
//   // 'ImplementDomainEvents',
//   // 'ConsiderEnterpriseArchitecture',
//   // 'DomainDrivenDesign',
// ];

export function genEntityAndRepository() {
    const model = DomainModel.loadModels();

    const packageName = 'com.example.demo';

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
                controllerParamAry = Object.keys(type).map((key: string) => `@PathVariable ${type[key]} ${key}`);
                serviceParamAry = Object.keys(type).map((key: string) => key);
            } { }
            if (api.request) {
                // classCode += typeToInterface(requestType, convertStringToJson(api.request));
                // controllerParamAry.push(`@Valid @RequestBody ${requestType} requestBody, BindingResult bindingResult`);
                controllerParamAry.push(`@Valid @RequestBody ${apiName}.${requestType} requestBody`);
                serviceParamAry.push(`requestBody`);
            } else { }

            classCode += `    @${Utils.toPascalCase(api.method)}Mapping("${api.endpoint.replace(/\/api\/v1\//g, '/')}")\n`;
            classCode += `    private ${toJavaClass(api.response)} ${methodName}(${controllerParamAry.join(', ')}) {\n`;
            classCode += `        return ${Utils.toCamelCase(apiName)}.${methodName}(${serviceParamAry.join(', ')});\n`;
            classCode += `    }\n`;
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
                controllerParamAry = Object.keys(type).map((key: string) => `${type[key]} ${key}`);
                serviceParamAry = Object.keys(type).map((key: string) => key);
            } { }
            if (api.request) {
                classCode += typeToInterface(requestType, convertStringToJson(api.request), convertStringToJson(api.validation));
                controllerParamAry.push(`${requestType} requestBody`);
                serviceParamAry.push(`requestBody`);
            } else { }

            classCode += `    public ${toJavaClass(api.response)} ${methodName}(${controllerParamAry.join(', ')}) ;\n\n`;
            // classCode += `        return ${Utils.toCamelCase(apiName)}.${methodName}(${serviceParamAry.join(', ')});\n`;
            // classCode += `        // TODO implementation\n`;
            // classCode += `    }\n`;
        });
        classCode += `}\n`;
        fs.mkdirSync(`./gen/src/main/java/com/example/demo/service`, { recursive: true });
        fs.writeFileSync(`./gen/src/main/java/com/example/demo/service/${apiName}.java`, classCode);
        return classCode;
    }).join('\n\n');

    // ServiceImplひな形作成
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
                controllerParamAry = Object.keys(type).map((key: string) => `${type[key]} ${key}`);
                serviceParamAry = Object.keys(type).map((key: string) => key);
            } { }
            if (api.request) {
                classCode += typeToInterface(requestType, convertStringToJson(api.request), convertStringToJson(api.validation));
                controllerParamAry.push(`${requestType} requestBody`);
                serviceParamAry.push(`requestBody`);
            } else { }

            classCode += `    public ${toJavaClass(api.response)} ${methodName}(${controllerParamAry.join(', ')}) {\n`;
            // classCode += `        return ${Utils.toCamelCase(apiName)}.${methodName}(${serviceParamAry.join(', ')});\n`;
            classCode += `        // TODO implementation\n`;
            classCode += `    }\n`;
        });
        classCode += `}\n`;
        fs.mkdirSync(`./gen/src/main/java/com/example/demo/service/impl`, { recursive: true });
        fs.writeFileSync(`./gen/src/main/java/com/example/demo/service/impl/${apiName}.java.md`, classCode);
        return classCode;
    }).join('\n\n');

    const jpaMethods: { [key: string]: string[] } = {};
    // ServiceImpl実装
    Object.keys(apiObj).map((apiName: string) => {

        const impl = (Utils.jsonParse(fs.readFileSync(`${domainModelsDire}ServiceImplementation-${Utils.toPascalCase(apiName)}.json`, 'utf-8')) as any);
        Object.keys(impl.additionalJPAMethods || {}).forEach((repositoryName: string) => {
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
                controllerParamAry = Object.keys(type).map((key: string) => `${type[key]} ${key}`);
                serviceParamAry = Object.keys(type).map((key: string) => key);
            } { }
            if (api.request) {
                // classCode += typeToInterface(requestType, convertStringToJson(api.request));
                controllerParamAry.push(`${requestType} requestBody`);
                serviceParamAry.push(`requestBody`);
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
                classCode += `    }\n`;
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

import * as ts from "typescript";
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


function relationshipReverse(relationship: Relationship): Relationship {
    const reverseRelationship: Relationship = {
        source: relationship.target,
        target: relationship.source,
        type: relationship.type,
    };
    return reverseRelationship;
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


//  DROP TABLE absence_request                            CASCADE ;
//  DROP TABLE attendance_record                          CASCADE ;
//  DROP TABLE attendance_record_absence_requests         CASCADE ;
//  DROP TABLE attendance_record_leave_requests           CASCADE ;
//  DROP TABLE dashboard                                  CASCADE ;
//  DROP TABLE dashboard_reports                          CASCADE ;
//  DROP TABLE dashboard_visualizations                   CASCADE ;
//  DROP TABLE department                                 CASCADE ;
//  DROP TABLE department_teams                           CASCADE ;
//  DROP TABLE employee                                   CASCADE ;
//  DROP TABLE employee_attendance_records                CASCADE ;
//  DROP TABLE employee_performance_evaluations           CASCADE ;
//  DROP TABLE employee_training_history                  CASCADE ;
//  DROP TABLE employment_type                            CASCADE ;
//  DROP TABLE feedback                                   CASCADE ;
//  DROP TABLE growth_plan                                CASCADE ;
//  DROP TABLE leave_request                              CASCADE ;
//  DROP TABLE performance_evaluation                     CASCADE ;
//  DROP TABLE performance_evaluation_evaluation_criteria CASCADE ;
//  DROP TABLE performance_evaluation_feedback            CASCADE ;
//  DROP TABLE performance_evaluation_performance_goals   CASCADE ;
//  DROP TABLE performance_goal                           CASCADE ;
//  DROP TABLE position                                   CASCADE ;
//  DROP TABLE recurring_transactions                     CASCADE ;
//  DROP TABLE report                                     CASCADE ;
//  DROP TABLE report_visualizations                      CASCADE ;
//  DROP TABLE salary                                     CASCADE ;
//  DROP TABLE salary_bonuses                             CASCADE ;
//  DROP TABLE salary_deductions                          CASCADE ;
//  DROP TABLE salary_payment                             CASCADE ;
//  DROP TABLE salary_salary_payments                     CASCADE ;
//  DROP TABLE skill_matrix                               CASCADE ;
//  DROP TABLE team                                       CASCADE ;
//  DROP TABLE team_employees                             CASCADE ;
//  DROP TABLE training_history                           CASCADE ;
//  DROP TABLE training_program                           CASCADE ;
//  DROP TABLE training_schedule                          CASCADE ;

// genEntityAndRepository();