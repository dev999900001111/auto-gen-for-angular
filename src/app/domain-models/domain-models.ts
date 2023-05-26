import * as fs from 'fs';
import { Utils } from '../common/utils';

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

export interface BoundedContext { name: string; Entities: Entity[]; ValueObjects: ValueObject[]; Aggregates: Aggrigate[]; DomainServices: DomainService[]; DomainEvents: DomainEvents[]; }
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
                    domainModelsRawMap[pattern] = JSON.parse(fs.readFileSync(`${domainModelsDire}${pattern}.json`, 'utf-8'));
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
            domainModelsRawMap[key] = JSON.parse(fs.readFileSync(`${domainModelsDire}${key}.json`, 'utf-8'));
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
            domainModelsRawMap[key] = JSON.parse(fs.readFileSync(`${domainModelsDire}${key}.json`, 'utf-8'));
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
                Entities: (entitiesAndValueObjectsNames).filter((entityName: string) => domainModel.Entities[entityName]).map((entityName: string) => entitiesAndValueObjects[entityName]) as Entity[],
                ValueObjects: (entitiesAndValueObjectsNames).filter((valueObjectName: string) => domainModel.ValueObjects[valueObjectName]).map((valueObjectName: string) => entitiesAndValueObjects[valueObjectName]) as ValueObject[],
                Aggregates: (boundedContextRaw.Aggregates || []).map((aggregateName: string) => domainModel.Aggregates[aggregateName]),
                DomainServices: (boundedContextRaw.DomainServices || []).map((domainServiceName: string) => domainModel.DomainServices[domainServiceName]),
                DomainEvents: (boundedContextRaw.DomainEvents || []).map((DomainEventName: string) => domainModel.DomainEvents[DomainEventName]),
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
    getAttributeTable(pattern: DomainModelPattern): string {
        let table = '';
        const domainModel: { [key: string]: any } = this;

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
                // Attributesを持たないパターンのものは無視
                if (object && object.Attributes) { } else { return }
                let buffer = `- ${objectName}\n`;
                buffer += object.Attributes.map((attribute: Attribute) => `   - ${attribute.name}: ${attribute.type};`).join('\n');
                return buffer;
            }).join('\n');
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

// const domainModel = DomainModelManager.loadModels();

// console.log(JSON.stringify(domainModel, null, 4));
// console.log(domainModel.getEntityTable());









// const jsonData = JSON.parse('{"Employee":{"Attributes":{"id":"int","name":"EmployeeName","contactDetails":"ContactDetails","position":"Position","department":"Department","team":"Team","employmentType":"EmploymentType","attendanceRecords":"List<AttendanceRecord>","salary":"Salary","performanceEvaluations":"List<PerformanceEvaluation>","trainingHistory":"List<TrainingHistory>"},"Methods":{"register":{"args":{"name":"EmployeeName","contactDetails":"ContactDetails","position":"Position","department":"Department","team":"Team","employmentType":"EmploymentType"},"returnType":"void"},"updateInfo":{"args":{"name":"EmployeeName","contactDetails":"ContactDetails","position":"Position","department":"Department","team":"Team","employmentType":"EmploymentType"},"returnType":"void"},"delete":{"args":{},"returnType":"void"}}},"EmploymentType":{"Attributes":{"id":"int","name":"String"},"Methods":{"create":{"args":{"name":"String"},"returnType":"void"},"update":{"args":{"name":"String"},"returnType":"void"},"delete":{"args":{},"returnType":"void"}}},"Position":{"Attributes":{"id":"int","name":"String"},"Methods":{"create":{"args":{"name":"String"},"returnType":"void"},"update":{"args":{"name":"String"},"returnType":"void"},"delete":{"args":{},"returnType":"void"}}},"Department":{"Attributes":{"id":"int","name":"String","teams":"List<Team>"},"Methods":{"create":{"args":{"name":"String"},"returnType":"void"},"update":{"args":{"name":"String"},"returnType":"void"},"delete":{"args":{},"returnType":"void"},"addTeam":{"args":{"team":"Team"},"returnType":"void"},"removeTeam":{"args":{"team":"Team"},"returnType":"void"}}},"Team":{"Attributes":{"id":"int","name":"String","department":"Department","employees":"List<Employee>"},"Methods":{"create":{"args":{"name":"String","department":"Department"},"returnType":"void"},"update":{"args":{"name":"String"},"returnType":"void"},"delete":{"args":{},"returnType":"void"},"addEmployee":{"args":{"employee":"Employee"},"returnType":"void"},"removeEmployee":{"args":{"employee":"Employee"},"returnType":"void"}}},' +


// export interface Attribute { name: string; type: string; }
// export interface Method { name: string; args: Attribute[]; returnType: string; }
// export interface Entity { name: string; Attributes: Attribute[]; Methods: Method[]; }

// function generateEntityClasses(jsonData: any): string[] {
//     const entityClasses: string[] = [];
//     for (const entityName in jsonData) {
//         const entityData = jsonData[entityName];
//         const attributes: Attribute[] = [];
//         for (const attributeName in entityData.Attributes) {
//             const attributeType = entityData.Attributes[attributeName];
//             const attribute: Attribute = {
//                 name: attributeName,
//                 type: attributeType,
//             };
//             attributes.push(attribute);
//         }
//         let classCode = `import javax.persistence.*;\n\n`;
//         classCode += `@Entity\n`;
//         classCode += `@Table(name = "${Utils.toSnakeCase(entityName)}")\n`;
//         classCode += `public class ${entityName} {\n\n`;
//         attributes.forEach(attribute => {
//             classCode += `    @Column\n`;
//             classCode += `    private ${attribute.type} ${attribute.name};\n\n`;
//         });
//         classCode += `    // getters and setters\n\n`;
//         classCode += `}\n`;
// @OneToOne(cascade = CascadeType.ALL)
// @JoinColumn(name = "contact_details_id")
// private ContactDetails contactDetails;


//         const entityClass = entity.generateEntityClass();
//         entityClasses.push(entityClass);
//     }
//     return entityClasses;
// }
// generateEntityClasses()

function genEntityAndRepository() {
    const model = DomainModel.loadModels();

    const packageName = 'com.example.demo';
    const entities = Object.keys(model.Entities).map((entityName: string) => {

        let classCode = ``;
        classCode = `package ${packageName}.entity;\n`;
        classCode += `\n`;
        classCode += `import jakarta.persistence.*;\n`;
        classCode += `import lombok.Data;\n`;
        classCode += `import java.util.*;\n`;
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
            classCode += `    private ${toJavaClass(attribute.type)} ${attribute.name};\n\n`;
        });
        classCode += `}\n`;

        fs.mkdirSync(`./gen/src/main/java/com/example/demo/entity`, { recursive: true });
        fs.writeFileSync(`./gen/src/main/java/com/example/demo/entity/${entityName}.java`, classCode);


        // repository
        classCode = ``;
        classCode += `package ${packageName}.repository;\n`;
        classCode += `\n`;
        classCode += `import ${packageName}.entity.${entityName};\n`;
        classCode += `import org.springframework.data.jpa.repository.JpaRepository;\n`;
        classCode += `import org.springframework.stereotype.Repository;\n`;
        classCode += `\n`;
        classCode += `@Repository\n`;
        classCode += `public interface ${entityName}Repository extends JpaRepository<${entityName}, Integer> {\n`;
        classCode += `\n`;
        classCode += `}\n`;
        fs.mkdirSync(`./gen/src/main/java/com/example/demo/repository`, { recursive: true });
        fs.writeFileSync(`./gen/src/main/java/com/example/demo/repository/${entityName}Repository.java`, classCode);

        return classCode;
    }).join('\n\n');
    const valueObjects = Object.keys(model.ValueObjects).map((valueObjectName: string) => {
        let classCode = ``;
        classCode += `package ${packageName}.entity;\n`;
        classCode += `\n`;
        classCode += `import jakarta.persistence.*;\n`;
        classCode += `import java.util.*;\n`;
        classCode += `import java.time.*;\n`;
        classCode += `import lombok.Data;\n`;
        classCode += `\n`;
        classCode += `@Data\n`;
        classCode += `@Embeddable\n`;
        classCode += `public class ${valueObjectName} {\n\n`;
        model.ValueObjects[valueObjectName].Attributes.forEach((attribute: Attribute) => {
            classCode += `    @Column(name="${Utils.toSnakeCase(valueObjectName)}_${Utils.toSnakeCase(attribute.name)}")\n`;
            classCode += `    private ${toJavaClass(attribute.type)} ${attribute.name};\n\n`;
        });
        classCode += `}\n`;
        fs.mkdirSync(`./gen/src/main/java/com/example/demo/entity`, { recursive: true });
        fs.writeFileSync(`./gen/src/main/java/com/example/demo/entity/${valueObjectName}.java`, classCode);
        return classCode;
    }).join('\n\n');

    // console.log(entities);
    // console.log(valueObjects);
}
// genEntityAndRepository();


function toJavaClass(type: string): string {
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
        .replace('void', 'Void')
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
    throw new Error(`Unexpected enum: ${str} in ${enumValues}`);
}
























// 2023-05-26T03:54:46.686+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.686+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_b4efrhyqk5dmblysn7xf7qo68" of relation "absence_request" does not exist, skipping
// 2023-05-26T03:54:46.694+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.694+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_jjfhk1hnymo8swl734mrym9fi" of relation "attendance_record_absence_requests" does not exist, skipping
// 2023-05-26T03:54:46.700+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.700+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_ekqx4q5o3pkdv9des9vacadx3" of relation "attendance_record_leave_requests" does not exist, skipping
// 2023-05-26T03:54:46.706+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.707+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_5mruup9hmv4bhgyo94d17bif" of relation "dashboard_reports" does not exist, skipping
// 2023-05-26T03:54:46.713+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.713+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_jb3km7rfxg17eerlf04174axb" of relation "department_teams" does not exist, skipping
// 2023-05-26T03:54:46.719+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.720+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_hr5ovw667hkx0jl5cmyo66wb8" of relation "employee" does not exist, skipping
// 2023-05-26T03:54:46.725+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.726+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_o1pwi5xuhx54ki6qgm8igygiy" of relation "employee" does not exist, skipping
// 2023-05-26T03:54:46.732+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.733+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_6o1mvrxpyqmb7haarvayfcn5j" of relation "employee" does not exist, skipping
// 2023-05-26T03:54:46.739+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.739+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_2w7fjaj0v5xnxeup7mwddestc" of relation "employee" does not exist, skipping
// 2023-05-26T03:54:46.745+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.746+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_egstclw344rualkm39e6s575g" of relation "employee_attendance_records" does not exist, skipping
// 2023-05-26T03:54:46.752+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.753+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_rfutdg860kr6canvnwvsp1kr3" of relation "employee_performance_evaluations" does not exist, skipping
// 2023-05-26T03:54:46.759+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.759+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_r1mpgeykb4bnqkmbuyuy8yx9p" of relation "employee_training_history" does not exist, skipping
// 2023-05-26T03:54:46.765+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.766+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_r9j8669vqh6j6ct4vwj7pmyf9" of relation "feedback" does not exist, skipping
// 2023-05-26T03:54:46.772+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.772+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_6xv8dl5wxoug5of6svw950pjr" of relation "feedback" does not exist, skipping
// 2023-05-26T03:54:46.778+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.800+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_g1hrokrjcbt9dttatq7v6vfjk" of relation "growth_plan" does not exist, skipping
// 2023-05-26T03:54:46.807+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.807+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_blx4dctja7mghn1tf3vqjjr1q" of relation "leave_request" does not exist, skipping
// 2023-05-26T03:54:46.813+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.813+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_fecd8x6kh0mkr8fmcr3xebmkm" of relation "performance_evaluation" does not exist, skipping
// 2023-05-26T03:54:46.819+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.820+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_4yn4vwtgs9ypl4gss3r5qvs4v" of relation "performance_evaluation_feedback" does not exist, skipping
// 2023-05-26T03:54:46.825+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.826+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_fn436uxx2yh1tin5mou2x7l61" of relation "performance_evaluation_performance_goals" does not exist, skipping
// 2023-05-26T03:54:46.831+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.832+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_geiiljhf05nlffmioxap27d0s" of relation "performance_goal" does not exist, skipping
// 2023-05-26T03:54:46.837+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.838+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_nj7cnkmj2erls2orbun4e08s" of relation "salary" does not exist, skipping
// 2023-05-26T03:54:46.845+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.845+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_mih9rvj7sl4surrjp8ffohsur" of relation "salary_salary_payments" does not exist, skipping
// 2023-05-26T03:54:46.851+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.851+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_fildivt3njtlx85urhswn3qbv" of relation "skill_matrix" does not exist, skipping
// 2023-05-26T03:54:46.857+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.858+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_p23cm1sniyq843ffd71rcjrsc" of relation "team_employees" does not exist, skipping
// 2023-05-26T03:54:46.864+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.865+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_rpgboa35j548hpukutbgjvoei" of relation "training_history" does not exist, skipping
// 2023-05-26T03:54:46.871+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Warning Code: 0, SQLState: 00000
// 2023-05-26T03:54:46.871+09:00  WARN 41100 --- [  restartedMain] o.h.engine.jdbc.spi.SqlExceptionHelper   : constraint "uk_k1y0fv644ro3y6qtbg3w2pybu" of relation "training_schedule" does not exist, skipping

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
