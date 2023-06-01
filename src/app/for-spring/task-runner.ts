import * as  fs from 'fs';
import { Utils } from '../common/utils';
import { BaseStep, MultiStep } from "../common/base-step";
import { Aggrigate, Attribute, BoundedContext, ContextMapRelationshipType, DomainModel, DomainModelPattern, DomainService, Entity, RelationshipType, TableModel, ValueObject } from '../domain-models/domain-models';
import { genEntityAndRepository, serviceImpl } from './source-generator';

class Step0000_RequirementsToDomainModels extends BaseStep {
  model = 'gpt-4';
  systemMessageJa = '経験豊富で優秀なソフトウェアエンジニア。専門はドメイン駆動設計。';
  systemMessage = 'Experienced and talented software engineer. Specialized in domain-driven design.';
  constructor() {
    super();
    this.chapters = [
      { title: 'Requirements', content: fs.readFileSync(`./000-requirements.md`, 'utf-8') },
      {
        title: `Instructions`,
        contentJp: Utils.trimLines(`
          以下の指示に従ってステップバイステップでドメインモデルを作成してください。指示はあくまでガイドラインです。指示を元に想起されるポイントを自己補完しながら進めてください。
             1. **ドメイン分析**: DDDの最初のステップは、ドメインを理解することです。これには、ドメインエキスパートと密に連携して、ドメイン内のビジネスルール、プロセス、エンティティを理解する必要があります。このステップは、開発プロセス全体で開発者とドメインエキスパートの間で使用される共通言語であるユビキタス言語を作成するために重要です。
             2. **バウンデッドコンテキストの特定**: ドメインを理解したら、次のステップはバウンデッドコンテキストを特定することです。これらは、特定のモデルが有効な論理的な境界です。各バウンデッドコンテキストは、システムの異なる部分に対応し、独立して開発することができます。ただし、分割しすぎることによる弊害も大きいため、どうしても分割が必要な場合のみにとどめてください。
             3. **モデル駆動設計**: 各バウンデッドコンテキスト内で、モデル駆動設計を使用して、ドメインを反映したモデルを作成します。これには、エンティティ、値オブジェクト、集約、ドメインイベントの特定が含まれます。バウンデッドコンテキストは、ドメイン内の特定の部分を表す論理的な境界です。
               - **エンティティ**は、明確な識別子を持つオブジェクトです。
               - **値オブジェクト**は、識別子ではなく属性によって定義されるオブジェクトです。
               - **集約**は、単一のユニットとして扱われるエンティティと値オブジェクトのクラスタです。
               - **ドメインイベント**は、ドメインエキスパートが関心を持つ重要なイベントです。バウンデッドコンテキストを跨ぐようなもののみをドメインイベントとして扱ってください。
             4. **リポジトリの設計**: リポジトリは、集約の永続化を処理するために使用されます。リポジトリは、システムから集約を取得、追加、削除する方法を提供します。
             5. **サービスの設計**: サービスは、エンティティや値オブジェクトに自然に属さない操作です。ドメインオブジェクトには適合しないビジネスロジックをカプセル化します。
             6. **ファクトリの設計**: ファクトリは、複雑なオブジェクトや集約を作成するために使用されます。ファクトリは、これらのオブジェクトを作成するロジックをカプセル化します。
             7. **コンテキストマッピング**: 各バウンデッドコンテキスト内のモデルを設計した後は、これらのコンテキストがどのように相互作用するかを理解する必要があります。これは、コンテキストマッピングによって行われ、バウンデッドコンテキスト間の関係を特定します。
             8. **アンチコラプションレイヤーの実装**: レガシーシステムや外部システムとのやり取りが必要な場合は、アンチコラプションレイヤーを実装する必要があります。このレイヤーは、システム内のモデルと外部システムのモデルの間を変換し、外部システムのモデルがシステム内のモデルを破壊するのを防ぎます。
             9. **ビジネスルールや制約条件**: ビジネスルールや制約条件をドメインモデル内にドキュメント化する。
             10. **リファクタリング**: ドメインとシステムについて学ぶにつれて、モデルと設計をリファクタリングする必要がある場合があります。これはDDDの正常な部分であり、受け入れられるべきです。
          ここまでのステップを繰り返し、最終的に完成したドメインモデルのみを出力してください。
          `),
        content: Utils.trimLines(`
          Please create a domain model step by step according to the following instructions. The instructions are just guidelines. Please proceed while self-completing the points that are recalled based on the instructions.
             1. **Domain Analysis**: The first step in DDD is to understand the problem domain. This involves working closely with domain experts to understand the business rules, processes, and entities involved in the domain. This step is crucial for developing the Ubiquitous Language, a shared language between developers and domain experts that is used throughout the development process.
             2. **Identify Bounded Contexts**: Once you understand the domain, the next step is to identify the Bounded Contexts. These are logical boundaries within the domain where certain models are valid. Each Bounded Context corresponds to a different part of the system, and they can be developed independently. However, be careful not to split them too much.
             3. **Model-Driven Design**: Within each Bounded Context, you'll use Model-Driven Design to create models that reflect the domain. This involves identifying Entities, Value Objects, Aggregates, and Domain Events. 
                - **Entities** are objects that have a distinct identity.
                - **Value Objects** are objects that are defined by their attributes rather than an identity.
                - **Aggregates** are clusters of Entities and Value Objects that are treated as a single unit.
                - **Domain Events** are significant events that domain experts care about. Please treat only those that cross Bounded Contexts as Domain Events.
             4. **Design Repositories**: Repositories are used to handle the persistence of Aggregates. They provide a way to retrieve, add, and remove Aggregates from the system.
             5. **Design Services**: Services are operations that don't naturally belong to an Entity or Value Object. They encapsulate business logic that doesn't fit within the domain objects.
             6. **Design Factories**: Factories are used to create complex objects or Aggregates. They encapsulate the logic of creating these objects.
             7. **Context Mapping**: Once you've designed the models within each Bounded Context, you'll need to understand how these contexts interact with each other. This is done through Context Mapping, which identifies the relationships between Bounded Contexts.
             8. **Implement Anti-Corruption Layer**: If you have legacy systems or external systems that you need to interact with, you might need to implement an Anti-Corruption Layer. This layer translates between the models in your system and the models in the external system, preventing their models from corrupting yours.
             9. **Business Rules and Constraints**: Document business rules and constraints in the domain model.
             10. **Refactoring**: As you learn more about the domain and the system, you'll likely need to refactor your models and design. This is a normal part of DDD and should be embraced.
          Please repeat the steps so far and output only the completed domain model.
        `),
      }, {
        title: 'Output rules',
        contentJp: Utils.trimLines(`
          トークン数をなるべく節約するため、以下の点に注意してください。
          - 項目の区切り文字はパイプ区切り、パイプ区切りの中で更に分ける場合はカンマ区切りとすること。
        `),
        content: Utils.trimLines(`
          Please pay attention to the following points to save as many tokens as possible.
          - The delimiter of the item should be a pipe delimiter, and if it is further divided within the pipe delimiter, it should be a comma delimiter.
        `)
      }
    ];
  }
}

class Step0005_RequirementsToSystemOverview extends BaseStep {
  model = 'gpt-4';
  constructor() {
    super();
    this.chapters = [
      { title: 'Requirements', content: fs.readFileSync(`./000-requirements.md`, 'utf-8') },
      {
        title: 'prompt',
        contentJp: Utils.trimLines(`
          Requirements をよく理解して、システム概要を簡潔に表現してください。
          {"name": "\${システムの実態を反映した適切な名前を付けてください。}","nickname":"\${利用者に親しまれる、呼びやすい愛称を付けてください。}", "overview": "\${System Overview}", "rules": ["\${ビジネスルールや制約条件}"]}
        `),
        content: Utils.trimLines(`
          Please understand the requirements well and express the system overview concisely.
          {"name": "\${Please give an appropriate name that reflects the reality of the system.}","nickname":"\${Please give a familiar and easy-to-call nickname to the user.}", "overview": "\${System Overview}", "rules": ["\${Business rules and constraints}"]}
        `)
      },
    ];
  }
}


class Step0010_DomainModelsInitialize extends BaseStep {
  model = 'gpt-4';
  // model = 'gpt-3.5-turbo';
  systemMessage = 'Experienced and talented software engineer. Specialized in domain-driven design.';
  constructor() {
    super();
    this.chapters = [
      { title: 'Requirements', content: fs.readFileSync(`./000-requirements.md`, 'utf-8') },
      { title: 'Domain Models', content: new Step0000_RequirementsToDomainModels().result },
      {
        title: 'Instructions',
        contentJp: Utils.trimLines(`
          Requirements と Domain Modelsに基づいて、以下のように情報を展開してください。
          指示はあくまでガイドラインです。指示を元に想起されるノウハウを自己補完しながら進めてください。
          - Entities => Attributes
          - Value Objects => Attributes
          - Enums => Values
          - Aggregates => RootEntity, Entities, Value Objects
          - Domain Services => Methods
          Requirements、Domain Models に含まれる情報を抜け漏れなく反映してください。
          イテレーションを何度か繰り返し、適切なリファクタリングを行い、完成したドメインモデルのみを出力してください。
        `),
        content: Utils.trimLines(`
          Based on the Requirements and Domain Models, expand the information as follows.
          The instructions are just guidelines. Please proceed while self-completing the know-how recalled based on the instructions.
          - Entities => Attributes
          - Value Objects => Attributes
          - Enums => Values
          - Aggregates => RootEntity, Entities, Value Objects
          - Domain Services => Methods
          Please reflect all the information included in the Requirements and Domain Models without omissions.
          Iterate several times, perform appropriate refactoring, and output only the completed domain model.
        `)
      }, {
        title: 'Output rules',
        contentJp: Utils.trimLines(`
          トークン数をなるべく節約するため、以下の点に注意してください。
          - markdown形式で出力すること
          - 項目の区切り文字はパイプ区切り、パイプ区切りの中で更に分ける場合はカンマ区切りとすること。
        `),
        content: Utils.trimLines(`
          Please pay attention to the following points to save as many tokens as possible.
          - The delimiter of the item should be a pipe delimiter, and if it is further divided within the pipe delimiter, it should be a comma delimiter.
        `)
      }
    ];
  }
}
class Step0020_DomainModelsClassify extends BaseStep {
  model = 'gpt-4';
  // model = 'gpt-3.5-turbo';
  systemMessage = 'Experienced and talented software engineer. Specialized in domain-driven design.';
  constructor() {
    super();
    // - Entities / Value Objects Relationships => Relationship Type(${Object.values(RelationshipType).join('/')}), Source, Target
    // - Entities / Value Objects Relationships => Relationship Type(${Object.values(RelationshipType).join('/')}), Source, Target
    this.chapters = [
      { title: 'Requirements', content: fs.readFileSync(`./000-requirements.md`, 'utf-8') },
      { title: 'Domain Models Base', content: new Step0000_RequirementsToDomainModels().result },
      { title: 'Domain Models Refined', content: new Step0010_DomainModelsInitialize().result },
      {
        title: 'System Requirements', content: Utils.trimLines(`
        - Server Side Framework: Spring Boot (JPA, Web, Batch, Security, Actuator, Lombok, MapStruct, etc.)
        - Frontend Framework: React (Chakra-UI, etc.)
        - Database: PostgreSQL
        - Infrastructure: AWS
      `)
      }, {
        title: 'Instructions',
        contentJp: Utils.trimLines(`
          指示はあくまでガイドラインです。指示を元に想起されるノウハウを自己補完しながら進めてください。
          Requirements, Domain Models Base, Domain Model Refined を基に、以下の情報を展開してください。
          - Domain Events => Attributes, Description
          - Batch Jobs => Methods, Attributes, Description
          - Bounded Contexts => Bounded Context, Entities/Value Objects/Aggregates/Domain Services/Domain Events
          - Context Mapping => Relationship Type(${Object.values(ContextMapRelationshipType).join('/')}), Source, Target
          Requirements、Domain Models に含まれる情報を抜け漏れなく反映してください。
          イテレーションを何度か繰り返し、適切なリファクタリングを行い、完成したドメインモデルのみを出力してください。
        `),
        content: Utils.trimLines(`
          Based on the Requirements, Domain Models Base, and Domain Model Refined, expand the information as follows.
          Based on Requirements, Domain Models Base, Domain Model Refined, expand the following information.
          - Domain Events => Attributes, Description
          - Batch Jobs => Methods, Attributes, Description
          - Bounded Contexts => Bounded Context, Entities/Value Objects/Aggregates/Domain Services/Domain Events
          - Context Mapping => Relationship Type(${Object.values(ContextMapRelationshipType).join('/')}), Source, Target
          The instructions are just guidelines. Please proceed while self-completing the know-how recalled based on the instructions.
          Please reflect all the information included in the Requirements and Domain Models without omissions.
          Iterate several times, perform appropriate refactoring, and output only the completed domain model.
        `)
      }, {
        title: 'Output rules',
        contentJp: Utils.trimLines(`
          トークン数をなるべく節約するため、以下の点に注意してください。
          - 項目の区切り文字はパイプ区切り、パイプ区切りの中で更に分ける場合はカンマ区切りとすること。
        `),
        content: Utils.trimLines(`
          Please pay attention to the following points to save as many tokens as possible.
          - The delimiter of the item should be a pipe delimiter, and if it is further divided within the pipe delimiter, it should be a comma delimiter.
        `)
      }
    ];
  }
}

class Step0030_domainModelsJson extends MultiStep {

  constructor() {
    super();

    class Step0030_domainModelsJsonChil extends BaseStep {
      // model = 'gpt-4';
      dire: string;
      constructor(private pattern: string) {
        super();
        this.label = `${this.constructor.name}_${pattern}`;

        // export interface BoundedContext { name: string; Entities: Entity[]; ValueObjects: ValueObject[]; Aggregates: Aggrigate[]; DomainServices: DomainService[]; DomainEvents: DomainEvents[]; }
        const formatMap: { [key: string]: string } = {
          Entities: '{"${EntityName}": {"Attributes": {"${name}": "${type}"},"Methods": {"${MethodName}": {"args": {"${name}": "${type}","${name}": "${type}"},"returnType": "${type}"},"${MethodName}": {"args": {"${name}": "${type}","${name}": "${type}"},"returnType": "${type}"}}}}',
          ValueObjects: '{"${ValueObjectName}": {"${name}": "${type}","${name}": "${type}"}}',
          Enums: '{"${EnumName}": ["${value}"]}',
          Aggregates: '{"${AggregateName}": {"RootEntity": "${EntityName}","Entities": ["${EntityName}"],"ValueObjects": ["${ValueObjectName}"]}}',

          DomainEvents: '{"${EventyName}": {"description":"${EventTrigger and behavior}","Attributes": {"${name}": "${type}"},"Methods": {"${methodName}": {"args": {"${name}": "${type}","${name}": "${type}"},"returnType": "${type}"}}}}',
          DomainServices: '{"${DomainServiceName}": {"Methods": {"${methodName}": {"args": {"${name}": "${type}","${name}": "${type}"},"returnType": "${type}"}}}}',

          Repositories: '{"${RepositoryName}": {"Methods": {"${methodName}": {"args": {"${name}": "${type}","${name}": "${type}"},"returnType": "${type}"}}}}',

          BoundedContexts: '{"${BoundedContextName}":{"Entities":["${entityName}"],"ValueObjects":["${valueObjectName}"],"Aggregates":["${aggrigateName}"],"DomainServices":["${domainServiceName}"],"DomainEvents":["${domainEventName}"]},}',
          ContextMappings: `[{"type": "\${${Object.values(ContextMapRelationshipType).join('|')}}","source": "\${BoundedContextName}","target": "\${BoundedContextName}",}]`,

          BatchJobs: '{"${BatchJobName}": {"description":"${BatchJobTrigger and behavior}","Attributes": {"${name}": "${type}"},"Methods": {"${methodName}": {"args": {"${name}": "${type}","${name}": "${type}"},"returnType": "${type}"}}}}',
          Relationships: `[{"type": "\${${Object.values(RelationshipType).join('|')}}","source": "\${(Entity|ValueObject)Name}","target": "\${(Entity|ValueObject)Name}",}]`,
        };

        const step0010 = ['Entities', 'ValueObjects', 'Aggregates', 'Repositories', 'DomainServices',];
        const step0011 = ['DomainEvents', 'BatchJobs', 'Relationships', 'BoundedContexts', 'ContextMapping',];
        // const domainModelString = step0010.includes(pattern) ? new Step0010_DomainModelsInitialize().result : new Step0020_DomainModelsClassify().result;
        const domainModelString = new Step0010_DomainModelsInitialize().result + '\n\n' + new Step0020_DomainModelsClassify().result;

        this.chapters = [
          // { title: 'Requirements', content: fs.readFileSync(`./000-requirements.md`, 'utf-8') },
          // { title: 'Domain Models', content: new Step0000_RequirementsToDomainModels().result },
          // {
          //   title: 'System Requirements', content: Utils.trimLines(`
          //     - Server Side Framework: Spring Boot (JPA, Web, Batch, Security, Actuator, Lombok, MapStruct, etc.)
          //     - Frontend Framework: React (Chakra-UI, etc.)
          //     - Database: PostgreSQL
          //     - Infrastructure: AWS
          //   `)
          // },
          { title: 'Domain Models', content: domainModelString },
          {
            title: 'Instructions',
            contentJp: Utils.trimLines(`
              ドメインモデルから${pattern}を抽出して下さい。
            `),
            content: Utils.trimLines(`
              Please extract ${pattern} from the domain model.
            `)
          }, {
            title: 'Output rules',
            contentJp: Utils.trimLines(`
              JSON形式で出力してください。
              ${formatMap[pattern]}
            `),
            content: Utils.trimLines(`
              Please write the type in Java notation.
              ${formatMap[pattern]}
            `)
          }
        ];

        ////////////////// 
        this.dire = `./gen/domain-models/`;
        if (fs.existsSync(this.dire)) {
        } else {
          fs.mkdirSync(this.dire, { recursive: true });
          console.log(`Directory ${this.dire} created.`);
        }
      }
      postProcess(result: string): string {
        try {
          fs.writeFileSync(`${this.dire}${this.pattern}.json`, Utils.mdTrim(result));
        } catch (e) {
          if (this.pattern == DomainModelPattern.BatchJobs) {
            console.log(`BatchJobsは空`);
          } else {
            console.log(e);
          }
        }
        return result;
      }
    }
    this.childStepList = Object.values(DomainModelPattern).filter((pattern) => ![DomainModelPattern.Entities, DomainModelPattern.DomainServices].includes(pattern)).map((pattern) => new Step0030_domainModelsJsonChil(pattern));
  }
}

class Step0040_domainModelEntityAndDomainServiceJson extends MultiStep {
  constructor() {
    super();

    class Step0040_domainModelEntityAndDomainServiceJsonChil extends BaseStep {
      // model = 'gpt-4';
      dire: string = `./gen/domain-models/`;
      constructor(private pattern: string = 'Entities', private boundedContext: string = '') {
        super();
        this.label = `${this.constructor.name}_${pattern}-${Utils.toPascalCase(this.boundedContext)}`;

        const formatMap: { [key: string]: string } = {
          Entities: '{"${EntityName}": {"Attributes": {"${name}": "${type}"},"Methods": {"${MethodName}": {"args": {"${name}": "${type}","${name}": "${type}"},"returnType": "${type}"},"${MethodName}": {"args": {"${name}": "${type}","${name}": "${type}"},"returnType": "${type}"}}}}',
          ValueObjects: '{"${ValueObjectName}": {"${name}": "${type}","${name}": "${type}"}}',
          Enums: '{"${EnumName}": ["${value}"]}',
          Aggregates: '{"${AggregateName}": {"RootEntity": "${EntityName}","Entities": ["${EntityName}"],"ValueObjects": ["${ValueObjectName}"]}}',

          DomainEvents: '{"${EventyName}": {"description":"${EventTrigger and behavior}","Attributes": {"${name}": "${type}"},"Methods": {"${methodName}": {"args": {"${name}": "${type}","${name}": "${type}"},"returnType": "${type}"}}}}',
          DomainServices: '{"${DomainServiceName}": {"Methods": {"${methodName}": {"args": {"${name}": "${type}","${name}": "${type}"},"returnType": "${type}"}}}}',

          Repositories: '{"${RepositoryName}": {"Methods": {"${methodName}": {"args": {"${name}": "${type}","${name}": "${type}"},"returnType": "${type}"}}}}',

          BoundedContexts: '{"${BoundedContextName}":{"Entities":["${entityName}"],"ValueObjects":["${valueObjectName}"],"Aggregates":["${aggrigateName}"],"DomainServices":["${domainServiceName}"],"DomainEvents":["${domainEventName}"]},}',
          ContextMappings: `[{"type": "\${${Object.values(ContextMapRelationshipType).join('|')}}","source": "\${BoundedContextName}","target": "\${BoundedContextName}",}]`,

          BatchJobs: '{"${BatchJobName}": {"description":"${BatchJobTrigger and behavior}","Attributes": {"${name}": "${type}"},"Methods": {"${methodName}": {"args": {"${name}": "${type}","${name}": "${type}"},"returnType": "${type}"}}}}',
          Relationships: `[{"type": "\${${Object.values(RelationshipType).join('|')}}","source": "\${(Entity|ValueObject)Name}","target": "\${(Entity|ValueObject)Name}",}]`,
        };

        const step0010 = ['Entities', 'ValueObjects', 'Aggregates', 'Repositories', 'DomainServices',];
        const step0011 = ['DomainEvents', 'BatchJobs', 'Relationships', 'BoundedContexts', 'ContextMapping',];
        // const domainModelString = step0010.includes(pattern) ? new Step0010_DomainModelsInitialize().result : new Step0020_DomainModelsClassify().result;
        const domainModelString = new Step0010_DomainModelsInitialize().result + '\n\n' + new Step0020_DomainModelsClassify().result;

        this.chapters = [
          { title: 'Requirements', content: fs.readFileSync(`./000-requirements.md`, 'utf-8') },
          // { title: 'Domain Models', content: new Step0000_RequirementsToDomainModels().result },
          {
            title: 'System Requirements', content: Utils.trimLines(`
            - Server Side Framework: Spring Boot (JPA, Web, Batch, Security, Actuator, Lombok, MapStruct, etc.)
            - Frontend Framework: React (Chakra-UI, etc.)
            - Database: PostgreSQL
            - Infrastructure: AWS
          `)
          },
          { title: 'Domain Models', content: domainModelString },
          {
            title: 'Instructions',
            contentJp: Utils.trimLines(`
              ドメインモデルを参照し、BoundexContextが"${boundedContext}"の${pattern}のみを抽出して以下のJSON形式に変換してください。
              ${formatMap[pattern]}
            `),
            content: Utils.trimLines(`
              Please refer to the domain model and extract only the ${pattern} of BoundexContext "${boundedContext}" and convert it to the following JSON format.
              \`\`\`json
              ${formatMap[pattern]}
              \`\`\`
            `)
          },
        ];
      }
      preProcess(prompt: string): string {
        if (fs.existsSync(this.dire)) { } else { fs.mkdirSync(this.dire, { recursive: true }); console.log(`Directory ${this.dire} created.`); }
        fs.writeFileSync(`${this.dire}${this.pattern}-${Utils.toPascalCase(this.boundedContext)}.json.prompt.md`, this.prompt);
        return prompt;
      }
      postProcess(result: string): string {
        try {
          ////////////////// 
          fs.writeFileSync(`${this.dire}${this.pattern}-${Utils.toPascalCase(this.boundedContext)}.json`, Utils.mdTrim(result));
        } catch (e) {
          console.log(e);
        }
        return result;
      }
    }

    const boundedContexts: { [key: string]: { Entities: string[] } } = Utils.jsonParse(fs.readFileSync(`./gen/domain-models/${DomainModelPattern.BoundedContexts}.json`, 'utf-8'));
    this.childStepList = Object.keys(boundedContexts).map((boundedContextName) =>
      [DomainModelPattern.Entities, DomainModelPattern.DomainServices].map(pattern =>
        new Step0040_domainModelEntityAndDomainServiceJsonChil(pattern, boundedContextName)
      )
    ).reduce((a, b) => a.concat(b), []);
  }
}


class Step0050_CreateAPI extends MultiStep {
  // 本来はドメインモデルを作るときに一緒に作ってしまいたいけどトークン長が長すぎるので分割する。
  // model = 'gpt-4';
  // dire: string = `./gen/domain-models/`;
  constructor() {
    super();
    const overview: { name: string, nickname: string, overview: string } = Utils.jsonParse(new Step0005_RequirementsToSystemOverview().result);
    const domainModel = DomainModel.loadModels();

    class Step0050_CreateAPIChil extends BaseStep {
      // model = 'gpt-4';
      dire: string = `./gen/domain-models/`;
      constructor(public boundedContext: BoundedContext) {
        super();
        this.label = `${this.constructor.name}_${Utils.toPascalCase(this.boundedContext.name)}`;
        this.chapters = [
          // { title: 'System Name', content: `${overview.nickname} (${overview.name})` },
          // { title: 'System Overview', content: overview.overview },
          // { title: 'Requirements', content: fs.readFileSync(`./000-requirements.md`, 'utf-8') },
          {
            title: 'System Requirements', content: Utils.trimLines(`
            - Server Side Framework: Spring Boot (JPA, Web, Batch, Security, Actuator, Lombok, MapStruct, etc.)
            - Frontend Framework: React (Chakra-UI, etc.)
            - Database: PostgreSQL
            - Infrastructure: AWS
          `)
          },
          {
            title: 'Domain Models',
            // content: new Step0000_RequirementsToDomainModels().result,
            children: [
              { title: `${DomainModelPattern.Entities}`, content: domainModel.getAttributeTable(DomainModelPattern.Entities), },
              { title: `${DomainModelPattern.ValueObjects}`, content: domainModel.getAttributeTable(DomainModelPattern.ValueObjects), },
              // { title: `${DomainModelPattern.Aggregates}`, content: domainModel.getAttributeTable(DomainModelPattern.Aggregates, boundedContext), },
              { title: `${DomainModelPattern.Enums}`, content: domainModel.getAttributeTable(DomainModelPattern.Enums), },
              {
                title: `Services`, content: Object.keys(boundedContext.DomainServices).map((serviceName: string) => {
                  // serviceName: methodName,,,
                  // console.log(boundedContext.DomainServices);
                  return `- ${serviceName}: ${boundedContext.DomainServices[serviceName].Methods.map((method) => method.name).join(', ')}`;
                }).join('\n'),
              },
            ]
          },
          // { title: `Table Definitions`, content: tableModels.map((tableModel: TableModel) => tableModel.toDDL()).join('\n'), },
          {
            title: `Instructions`,
            contentJp: Utils.trimLines(`
              Domain Modelsに基づいて、${Object.keys(boundedContext.DomainServices).join(', ')} のAPI仕様書を作成してください。
              指示はあくまでガイドラインです。指示を元に想起されるノウハウを自己補完しながら進めてください。
              - Request / Response の型を詳細に正確に定義してください。必ずしもモデルと一緒ではないはずです。
              - Domain Models に定義されていないオブジェクトを使用しないでください。
              - 以下の項目について設計して下さい。
                Endpoint, Method, Request, Validation, Response, Service.Method, Description
              イテレーションを何度か繰り返し、適切なリファクタリングを行い、完成したドメインモデルのみを出力してください。
              出力形式は Output Example に則って、JSONのみ出力してください。不要な項目は出力しないでください。
            `),
            content: Utils.trimLines(`
              Based on the Domain Models, create API specifications for ${Object.keys(boundedContext.DomainServices).join(', ')}.
              The instructions are just guidelines. Please proceed while self-completing the know-how that is recalled based on the instructions.
              - Define the types of Request / Response in detail and accurately. It shouldn't always be the same as the model.
              - Do not use objects that are not defined in Domain Models.
              - Design the following items.
                Endpoint, Method, Request, Validation, Response, Service.Method, Description
              Repeat the iteration several times, perform appropriate refactoring, and output only the completed domain model.
              The output format should be JSON only in accordance with the Output Example. Do not output unnecessary items.
            `),
          },
          {
            title: `Output Example`,
            content: Utils.trimLines(`
              \`\`\`json
              {"UserService": {
                "findAll":{"endpoint":"/api/v1/users","pathVariable":null,"method":"GET","request":null,"validation":null,"response":"User[]","description":"Getallusers"},
                "findById":{"endpoint":"/api/v1/users/{id}","pathVariable":"{id:int}","method":"GET","request":null,"validation":null,"response":"User","description":"Getauserbyid"},
                "create":{"endpoint":"/api/v1/users","pathVariable":null,"method":"POST","request":"{name:string,email:string,passowrd:string}","validation":"{name:[\\"@NotBlank\\"],email:[\\"@Email\\"],passowrd:[\\"@NotBlank\\"]}","response":"User","description":"Createauser"},
                "update":{"endpoint":"/api/v1/users/{id}","pathVariable":"{id:int}","method":"PUT","request":"{name:string,email:string,passowrd:string}","validation":"{name:[\\"@NotBlank\\"],email:[\\"@Email\\"],passowrd:[\\"@NotBlank\\"]}","response":"User","description":"Updateauser"},
                "delete":{"endpoint":"/api/v1/users/{id}","pathVariable":"{id:int}","method":"DELETE","request":null,"validation":null,"response":null,"description":"Deleteauser"}
              }}
              \`\`\`
            `),
          }
        ];
      }
      preProcess(prompt: string): string {
        // ディレクトリが無ければ掘る
        if (fs.existsSync(this.dire)) { } else { fs.mkdirSync(this.dire, { recursive: true }); console.log(`Directory ${this.dire} created.`); }
        // ファイル書き込み
        try { fs.writeFileSync(`${this.dire}API-${Utils.toPascalCase(this.boundedContext.name)}.json.prompt.md`, this.prompt); } catch (e) { console.log(e); }
        return prompt;
      }

      postProcess(result: string): string {
        // ディレクトリが無ければ掘る
        if (fs.existsSync(this.dire)) { } else { fs.mkdirSync(this.dire, { recursive: true }); console.log(`Directory ${this.dire} created.`); }
        // ファイル書き込み
        try { fs.writeFileSync(`${this.dire}API-${Utils.toPascalCase(this.boundedContext.name)}.json`, Utils.mdTrim(result)); } catch (e) { console.log(e); }
        return result;
      }
    }
    this.childStepList = Object.keys(domainModel.BoundedContexts)
      .filter((boundedContextName) => (Object.keys(domainModel.BoundedContexts[boundedContextName].DomainServices)).length > 0)
      .map(boundedContextName => new Step0050_CreateAPIChil(domainModel.BoundedContexts[boundedContextName]));
  }
  postProcess(result: string[]): string[] {
    return result;
  }
}


class Step0060_CreateService extends MultiStep {
  // 本来はドメインモデルを作るときに一緒に作ってしまいたいけどトークン長が長すぎるので分割する。
  // model = 'gpt-4';
  // dire: string = `./gen/domain-models/`;
  constructor() {
    super();
    const overview: { name: string, nickname: string, overview: string } = Utils.jsonParse(new Step0005_RequirementsToSystemOverview().result);
    const domainModel = DomainModel.loadModels();

    class Step0060_CreateServiceChil extends BaseStep {
      // model = 'gpt-4';
      dire: string = `./gen/domain-models/`;
      constructor(public serviceName: string) {
        super();
        this.label = `${this.constructor.name}_${serviceName}`;

        const boundedContextName = Object.keys(domainModel.BoundedContexts).find((boundedContextName) => domainModel.BoundedContexts[boundedContextName].DomainServices[serviceName]);
        const boundedContext: BoundedContext = domainModel.BoundedContexts[boundedContextName || ''];
        // ドメインモデルに存在しないサービス名が指定された場合はエラー 
        if (boundedContext) { } else { throw new Error(`BoundedContext not found. ${serviceName}`); }
        this.chapters = [
          // { title: 'System Name', content: `${overview.nickname} (${overview.name})` },
          // { title: 'System Overview', content: overview.overview },
          { title: 'Requirements', content: fs.readFileSync(`./000-requirements.md`, 'utf-8') },
          {
            title: 'System Requirements', content: Utils.trimLines(`
            - Server Side Framework: Spring Boot (JPA, Web, Batch, Security, Actuator, Lombok, MapStruct, etc.)
            - Frontend Framework: React (Chakra-UI, etc.)
            - Database: PostgreSQL
            - Infrastructure: AWS
          `)
          },
          {
            title: 'Domain Models',
            children: [
              { title: `${DomainModelPattern.Entities}`, content: domainModel.getAttributeTable(DomainModelPattern.Entities), },
              { title: `${DomainModelPattern.ValueObjects}`, content: domainModel.getAttributeTable(DomainModelPattern.ValueObjects), },
              // { title: `${DomainModelPattern.Aggregates}`, content: domainModel.getAttributeTable(DomainModelPattern.Aggregates), },
              { title: `${DomainModelPattern.Enums}`, content: domainModel.getAttributeTable(DomainModelPattern.Enums), },
            ]
          },
          { title: `Base Code`, content: '```java\n' + fs.readFileSync(`./gen/src/main/java/com/example/demo/service/${serviceName}.java.md`, 'utf-8') + '\n```' },
          {
            title: `Instructions`,
            contentJp: Utils.trimLines(`
              Requirements と Domain Modelsの内容を理解してBase Code "${serviceName}"の全てのメソッドの実装を書いて下さい。
              対象は以下の通りです。
              - ${domainModel.DomainServices[serviceName].Methods.map((method) => method.name).join(', ')}
              指示はあくまでガイドラインです。指示を元に想起されるノウハウを自己補完しながら進めてください。
              - 項目名に一貫性に注意してください。特にIDとIdとidの違いには注意してください。
              - メソッドのシグネチャを変更せず、あくまでメソッドの中身だけを考えてください。
              - "TODO implementation"をメソッドの中身に置き換えるソースコードを書いてください。
              - Entityは全て@Builder, @Dataが付与されています。コンストラクタは使わず、builder()を使ってください。
              - エラーは全てRuntimeExceptionでthrowしてください。
              - テストをシミュレートしてバグを取り除いてください。
              - イテレーションを何度か繰り返し、適切なリファクタリングを行い、完成した実装のみを出力してください。
              出力形式は Output Example を参考にしてください。
            `),
            content: Utils.trimLines(`
              Please understand the contents of Requirements and Domain Models and write the implementation of all methods of Base Code "${serviceName}".
              The target is as follows.
              - ${domainModel.DomainServices[serviceName].Methods.map((method) => method.name).join(', ')}
              The instructions are just guidelines. Please proceed while self-completing the know-how recalled based on the instructions.
              - Pay attention to consistency in item names. Pay particular attention to the difference between ID, Id, and id.
              - Do not change the signature of the method, but consider only the contents of the method.
              - Write the source code that replaces "TODO implementation" in the contents of the method.
              - All entities are annotated with @Builder and @Data. Do not use the constructor, use builder().
              - Throw all errors with RuntimeException.
              - Simulate the test and remove the bug.
              - Repeat the iteration several times, perform appropriate refactoring, and output only the completed implementation.
              Please refer to Output Example for the output format.
            `),
          },
          {
            title: `Output Format`,
            contentJp: Utils.trimLines(`
              出力は以下のJSON形式で出力してください。読み取り可能なJSON形式である必要があります。改行やダブルクオーテーションを含む文字列は改行コードをエスケープしたうえで含めて出力してください。
              \`\`\`json
              {"additionalImports": ["\${import}"], "additionalJPAMethods": ["\${repository method}"], "methods": {"\${methodName}": {"annotations":["\${method annotation}"],"body":"\${body source code of methods, which replaces \\"TODO implementation\\" without method signature}"} }}
              \`\`\`
            `),
            content: Utils.trimLines(`
              Please output in the following JSON format. It must be a readable JSON format. Strings containing line breaks and double quotes should be output including the line break code after escaping.
              \`\`\`json
              {"additionalImports": ["\${import}"], "additionalJPAMethods": ["\${repository method}"], "methods": {"\${methodName}": {"annotations":["\${method annotation}"],"body":"\${body source code of methods, which replaces \\"TODO implementation\\" without method signature}"} }}
              \`\`\`
            `),
          },
          {
            title: `Output Example`, content: Utils.trimLines(`
              \`\`\`json
              {"additionalImports": ["java.util.List"], "additionalJPAMethods": {"EntityRepository":["List<Entity> findByEntityNameAndEntityLabel(String entityName,String entityLabel)"]}, "methods": {"findAll": {"annotations":["\${method annotation}"],"body":"        List<Entity> findAll = this.employeeRepository.findAll();\\n        return findAll;"} }}
              \`\`\`
            `),
          },
        ];
      }
      preProcess(prompt: string): string {
        fs.mkdirSync(`./gen/src/main/java/com/example/demo/service/impl`, { recursive: true });
        fs.writeFileSync(`./gen/src/main/java/com/example/demo/service/impl/${this.serviceName}Impl.java.prompt.md`, prompt);

        // ディレクトリが無ければ掘る
        if (fs.existsSync(this.dire)) { } else { fs.mkdirSync(this.dire, { recursive: true }); console.log(`Directory ${this.dire} created.`); }
        // ファイル書き込み
        try { fs.writeFileSync(`${this.dire}ServiceImplementation-${Utils.toPascalCase(this.serviceName)}.json.prompt.md`, this.prompt); } catch (e) { console.log(e); }
        return prompt;
      }
      postProcess(result: string): string {
        // ディレクトリが無ければ掘る
        if (fs.existsSync(this.dire)) { } else { fs.mkdirSync(this.dire, { recursive: true }); console.log(`Directory ${this.dire} created.`); }
        // ファイル書き込み
        try { fs.writeFileSync(`${this.dire}ServiceImplementation-${Utils.toPascalCase(this.serviceName)}.json`, Utils.mdTrim(result)); } catch (e) { console.log(e); }
        return result;
      }
    }
    this.childStepList = Object.keys(domainModel.DomainServices).map(serviceName => new Step0060_CreateServiceChil(serviceName));
  }
  postProcess(result: string[]): string[] {
    return result;
  }
}

const HISTORY_DIRE = `./history`;
export async function main() {
  try { fs.mkdirSync(`./prompts`, { recursive: true }); } catch (e) { }
  try { fs.mkdirSync(`${HISTORY_DIRE}`, { recursive: true }); } catch (e) { }

  let obj;
  return Promise.resolve().then(() => {
    obj = new Step0000_RequirementsToDomainModels();
    obj.initPrompt();
    return obj.run();
  }).then(() => {
    obj = new Step0005_RequirementsToSystemOverview();
    obj.initPrompt();
    return obj.run();
  }).then(() => {
    obj = new Step0010_DomainModelsInitialize();
    obj.initPrompt();
    return obj.run();
  }).then(() => {
    obj = new Step0020_DomainModelsClassify();
    obj.initPrompt();
    return obj.run();
  }).then(() => {
    obj = new Step0030_domainModelsJson();
    obj.initPrompt();
    return obj.run();
  }).then(() => {
    obj = new Step0040_domainModelEntityAndDomainServiceJson();
    obj.initPrompt();
    return obj.run();
    // }).then(() => {
    //   Step0040_domainModelEntitysJson.genSteps().forEach((step) => step.postProcess(step.result));
  }).then(() => {
    obj = new Step0050_CreateAPI();
    obj.initPrompt();
    return obj.run();
    // obj.childStepList.forEach((step) => step.postProcess(step.result));
  }).then(() => {
    genEntityAndRepository();
  }).then(() => {
    obj = new Step0060_CreateService();
    obj.initPrompt();
    return obj.run();
  }).then(() => {
    serviceImpl();
  }).then(() => {
  });
}
// main();

