import * as fs from 'fs';
import { Utils } from '../common/utils';

export const domainModelsDire = `./gen/domain-models/`;

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

        const boundedContexts: { [key: string]: BoundedContext } = {};
        Object.keys(domainModelsRawMap.BoundedContexts).forEach(boundedContextName => {
            boundedContexts[Utils.toPascalCase(boundedContextName)] = domainModelsRawMap.BoundedContexts[boundedContextName];
        });
        domainModelsRawMap.BoundedContexts = boundedContexts;

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

function relationshipReverse(relationship: Relationship): Relationship {
    const reverseRelationship: Relationship = {
        source: relationship.target,
        target: relationship.source,
        type: relationship.type,
    };
    return reverseRelationship;
}
