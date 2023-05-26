import * as  fs from 'fs';
import { Utils } from '../common/utils';
import { BaseStep, MultiStep } from "../common/base-step";
import { RepoSyncer } from '../common/repo-syncer';
// import { GenModuleFiles, genIndex } from './gen-angular-modules';
import { genIndex } from '../for-react/react-service';
import { ReactCodeGenerator } from '../for-react/react-service';
import { ModelControlClass, ServiceClass, ServiceClassMethod, ModelClass, ClassProp } from '../model-repo/to-use';
import { Aggrigate, Attribute, ContextMapRelationshipType, DomainModel, DomainModelPattern, Entity, RelationshipType, TableModel, ValueObject } from '../domain-models/domain-models';

class Step0000_RequirementsToDomainModels extends BaseStep {
  model = 'gpt-4';
  systemMessageJa = '経験豊富で優秀なソフトウェアエンジニア。専門はドメイン駆動設計。';
  systemMessage = 'Experienced and talented software engineer. Specialized in domain-driven design.';
  constructor() {
    super();
    this.chapters = [
      { title: 'Requirements', content: fs.readFileSync(`./000-requirements.md`, 'utf-8') },
      // {
      //   title: 'Prompt',
      //   contentJp: Utils.trimLines(`
      //     ドメインエキスパートとの対話をシミュレートし、ドメインモデルを作成してください。
      //     Entities, Value Objects, Aggregates, Domain Services, Repositories, Domain Events を適切に設定してください。
      //   `),
      //   content: Utils.trimLines(`
      //     Please simulate a conversation with a domain expert and create a business domain model.
      //     Please set Entities, Value Objects, Aggregates, Domain Services, Repositories, Domain Events appropriately.
      //   `),
      // },
      // Bounded Context
      // {
      //   title: 'Instructions',
      //   contentJp: Utils.trimLines(`
      //     以下のステップを踏んでRequirementsに基づいてドメインを特定する資料を作成して下さい。
      //     - プロジェクトのビジネス要件と目標を理解する。
      //     - ドメインエキスパートとコミュニケーションを取る。
      //     - ドメインを特定し、ビジネス要件に関連する主要な概念とプロセスを抽出する。
      //   `),
      //   content: Utils.trimLines(`
      //     Please create a document that identifies the domain based on the requirements by following the steps below.
      //     - Understand the business requirements and goals of the project.
      //     - Communicate with the domain expert.
      //     - Identify the domain and extract the key concepts and processes related to the business requirements.
      //   `),
      // },
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
        // 10. **継続的な統合**: システムを開発するにつれて、変更を継続的に統合して、すべてが正しく動作していることを確認する必要があります。これには、定期的に変更をメインブランチにマージし、自動テストを実行することが含まれます。
        // 9. **Continuous Integration**: As you're developing the system, you'll want to continuously integrate your changes to ensure that everything is working together correctly. This involves regularly merging your changes with the main branch and running automated tests.
        // 出力フォーマットは以下の通りとしてください。
        // {"BoundedContexts":{
        //   "\${BoundedContextName}":{"Entities":{"\${EntityName}":{"Attributes":["\${name}","\${name}"],"Methods":["\${name}()","\${name}()"]}},"ValueObjects":{"\${ValueObjectName}":{"Attributes":["\${name}","\${name}"],"Methods":["\${name}()","\${name}()"]}},"Aggregates":{"\${AggregateName}":{"RootEntity":"\${EntityName}","Entities":["\${EntityName}","\${EntityName}"],"ValueObjects":["\${ValueObjectName}","\${ValueObjectName}"]}},"DomainEvents":{"\${DomainEventName}":{"Describe":"\${describe}","Attributes":["\${name}","\${name}"]}},"DomainEventsHandler":{"Methods":["\${name}()","\${name}()"]},"DomainServices":{"\${ServiceName}":{"Methods":["\${name}()","\${name}()"]}},"Factories":{"\${FactoryName}":{"Methods":["\${name}()","\${name}()"]}},},
        //   "\${BoundedContextName}":{"Entities":{"\${EntityName}":{"Attributes":["\${name}","\${name}"],"Methods":["\${name}()","\${name}()"]}},"ValueObjects":{"\${ValueObjectName}":{"Attributes":["\${name}","\${name}"],"Methods":["\${name}()","\${name}()"]}},"Aggregates":{"\${AggregateName}":{"RootEntity":"\${EntityName}","Entities":["\${EntityName}","\${EntityName}"],"ValueObjects":["\${ValueObjectName}","\${ValueObjectName}"]}},"DomainEvents":{"\${DomainEventName}":{"Describe":"\${describe}","Attributes":["\${name}","\${name}"]}},"DomainEventsHandler":{"Methods":["\${name}()","\${name}()"]},"DomainServices":{"\${ServiceName}":{"Methods":["\${name}()","\${name}()"]}},"Factories":{"\${FactoryName}":{"Methods":["\${name}()","\${name}()"]}},},
        // },"Relationships":[{"type":"\${relationship}","source":"\${BoundedContextName}","target":"\${BoundedContextName}",}]}
        // {"boundedContexts":{
        //   "\${BoundedContextName}":{"entities":{"\${EntityName}":{"attributes":{"\${name}":"\${type}",},"methods":{"\${name}":[{"\${argName}":"\${argType}"},"\${returnType}"],}},},"valueObjects":{"\${ValueObjectName}":{"attributes":{"\${name}":"\${type}",},"methods":{"\${name}":[{"\${argName}":"\${argType}"},"\${returnType}"],}},},"aggregates":{"\${AggregateName}":{"rootEntity":"\${EntityName}","entities":["\${EntityName}","\${EntityName}"],"valueObjects":["\${ValueObjectName}","\${ValueObjectName}"]},},"domainEvents":{"\${DomainEventName}":{"describe":"\${describe}","attributes":{"\${name}":"\${type}",}}},"domainEventsHandler":{"methods":{"\${name}":[{"\${argName}":"\${argType}"},"\${returnType}"],}},"domainServices":{"\${ServiceName}":{"methods":{"\${name}":[{"\${argName}":"\${argType}"},"\${returnType}"],}}},"factories":{"\${FactoryName}":{"methods":{"\${name}":[{"\${argName}":"\${argType}"},"\${returnType}"],}}},"applicationServices":{"\${ServiceName}":{"methods":{"\${name}":[{"\${argName}":"\${argType}"},"\${returnType}"],}}},"repositories":{"\${RepositoryName}":{"methods":{"\${name}":[{"\${argName}":"\${argType}"},"\${returnType}"],}}}},
        //   "\${BoundedContextName}":{"entities":{"\${EntityName}":{"attributes":{"\${name}":"\${type}",},"methods":{"\${name}":[{"\${argName}":"\${argType}"},"\${returnType}"],}},},"valueObjects":{"\${ValueObjectName}":{"attributes":{"\${name}":"\${type}",},"methods":{"\${name}":[{"\${argName}":"\${argType}"},"\${returnType}"],}},},"aggregates":{"\${AggregateName}":{"rootEntity":"\${EntityName}","entities":["\${EntityName}","\${EntityName}"],"valueObjects":["\${ValueObjectName}","\${ValueObjectName}"]},},"domainEvents":{"\${DomainEventName}":{"describe":"\${describe}","attributes":{"\${name}":"\${type}",}}},"domainEventsHandler":{"methods":{"\${name}":[{"\${argName}":"\${argType}"},"\${returnType}"],}},"domainServices":{"\${ServiceName}":{"methods":{"\${name}":[{"\${argName}":"\${argType}"},"\${returnType}"],}}},"factories":{"\${FactoryName}":{"methods":{"\${name}":[{"\${argName}":"\${argType}"},"\${returnType}"],}}},"applicationServices":{"\${ServiceName}":{"methods":{"\${name}":[{"\${argName}":"\${argType}"},"\${returnType}"],}}},"repositories":{"\${RepositoryName}":{"methods":{"\${name}":[{"\${argName}":"\${argType}"},"\${returnType}"],}}}},
        // },"relationships": [{ "type": "\${relationship}", "source": "\${BoundedContextName}", "target": "\${BoundedContextName}", }], }
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
        // Please use the following output format.
        // {"BoundedContexts":{
        //   "\${BoundedContextName}":{"Entities":{"\${EntityName}":{"Attributes":["\${name}","\${name}"],"Methods":["\${name}()","\${name}()"]}},"ValueObjects":{"\${ValueObjectName}":{"Attributes":["\${name}","\${name}"],"Methods":["\${name}()","\${name}()"]}},"Aggregates":{"\${AggregateName}":{"RootEntity":"\${EntityName}","Entities":["\${EntityName}","\${EntityName}"],"ValueObjects":["\${ValueObjectName}","\${ValueObjectName}"]}},"DomainEvents":{"\${DomainEventName}":{"Describe":"\${describe}","Attributes":["\${name}","\${name}"]}},"DomainEventsHandler":{"Methods":["\${name}()","\${name}()"]},"DomainServices":{"\${ServiceName}":{"Methods":["\${name}()","\${name}()"]}},"Factories":{"\${FactoryName}":{"Methods":["\${name}()","\${name}()"]}},},
        //   "\${BoundedContextName}":{"Entities":{"\${EntityName}":{"Attributes":["\${name}","\${name}"],"Methods":["\${name}()","\${name}()"]}},"ValueObjects":{"\${ValueObjectName}":{"Attributes":["\${name}","\${name}"],"Methods":["\${name}()","\${name}()"]}},"Aggregates":{"\${AggregateName}":{"RootEntity":"\${EntityName}","Entities":["\${EntityName}","\${EntityName}"],"ValueObjects":["\${ValueObjectName}","\${ValueObjectName}"]}},"DomainEvents":{"\${DomainEventName}":{"Describe":"\${describe}","Attributes":["\${name}","\${name}"]}},"DomainEventsHandler":{"Methods":["\${name}()","\${name}()"]},"DomainServices":{"\${ServiceName}":{"Methods":["\${name}()","\${name}()"]}},"Factories":{"\${FactoryName}":{"Methods":["\${name}()","\${name}()"]}},},
        // },"Relationships":[{"type":"\${relationship}","source":"\${BoundedContextName}","target":"\${BoundedContextName}",}]}
      },
      // {
      //   title: 'Output Rules',
      //   contentJp: '出力はドメインモデルのみです（ドメインエキスパートとの対話は出力に含めないでください）。',
      //   content: 'The output is only the domain model (please do not include the conversation with the domain expert in the output).',
      // },
      // {
      //   title: 'Instructions',
      //   contentJp: Utils.trimLines(`
      //     ドメイン駆動設計（Domain-Driven Design, DDD）に基づいて開発を進める一般的な手順を示します。

      //     1. ビジネスの理解とドメインの特定:
      //       - プロジェクトのビジネス要件と目標を理解し、ドメインエキスパートとコミュニケーションを取ります。
      //       - ドメインを特定し、ビジネス要件に関連する主要な概念とプロセスを抽出します。

      //     2. コンテキストマッピング:
      //       - 関連するコンテキストやドメイン間の関係を可視化するために、コンテキストマップを作成します。
      //       - コンテキスト間の相互作用と共有される言語を特定します。

      //     3. ドメインモデルの設計:
      //       - ドメインモデルを作成します。ドメインモデルは、ビジネス要件とドメイン概念の表現です。
      //       - モデル駆動設計手法（Ubiquitous Language、エンティティ、バリューオブジェクト、集約、サービスなど）を使用して、ドメインモデルを構築します。

      //     4. ドメインロジックの実装:
      //       - ドメインモデルに基づいて、ドメインロジックを実装します。
      //       - ドメインエキスパートとの継続的なコミュニケーションを通じて、モデルを洗練し、適応させます。

      //     5. アプリケーション層の作成:
      //       - ドメインモデルを使用して、アプリケーション層を作成します。
      //       - ドメインサービスやファクトリなどの要素を実装し、ドメインロジックとの連携を管理します。

      //     6. インフラストラクチャ層の作成:
      //       - データベース、外部サービス、UIなどのインフラストラクチャ層を作成します。
      //       - ドメインモデルやアプリケーション層との間のデータの永続化や通信を担当します。

      //     7. 単体テストと結合テストの実施:
      //       - ドメインモデル、アプリケーション層、インフラストラクチャ層に対して、単体テストと結合テストを実施します。
      //       - ドメインロジックが正しく機能し、ビジネス要件を満たしていることを確認します。

      //     8. ドメイン駆動設計のパターンの適用:
      //       - ドメイン駆動設計には、さまざまなパターン（エンティティ、値オブジェクト、集約、ドメインサービスなど）があります。
      //       - 適切なパターンを適用し、ドメインモデルをより表現力豊かにし、柔軟性を高めます。

      //     9. UIの実装:
      //       - ユーザーインターフェース（UI）を実装します。
      //       - UIはドメインモデルやアプリケーション層と対話し、ユーザーとのインタラクションを処理します。

      //     10. 反復的な開発とドメインの洗練:
      //         - 反復的な開発手法を採用し、機能を追加・変更しながらドメインを洗練します。
      //         - ドメインエキスパートとの継続的なフィードバックを取り入れ、ドメインモデルや実装を改善します。

      //     11. ドメインイベントの活用:
      //         - ドメインイベントを使用して、ドメイン内での重要な変更やアクションをキャプチャし、他のコンテキストとの連携を実現します。

      //     12. エンタープライズアーキテクチャの検討:
      //         - ドメイン駆動設計をエンタープライズレベルで適用する場合、大規模なアーキテクチャの設計を検討します。
      //         - ドメインの境界、コンテキストの相互作用、インフラストラクチャの統合などを考慮します。
    ];
  }
}

class Step0003_RequirementsToSystemOverview extends BaseStep {
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


class Step0010_DomainModelsClassify extends BaseStep {
  // model = 'gpt-4';
  model = 'gpt-4-0314';
  systemMessage = 'Experienced and talented software engineer. Specialized in domain-driven design.';
  constructor() {
    super();
    this.chapters = [
      { title: 'Requirements', content: fs.readFileSync(`./000-requirements.md`, 'utf-8') },
      { title: 'Domain Models', content: new Step0000_RequirementsToDomainModels().result },
      {
        title: 'Instructions',
        // それぞれについての要素について、各要素のインターフェースシグネチャ（I/O項目）を明示してください。
        // DBテーブル定義書、API仕様書、画面設計の入力情報となるように、各要素のインターフェース（I/O項目）を明示してください。
        // * **サービスの設計**: サービスは、エンティティや値オブジェクトに自然に属さない操作です。ドメインオブジェクトには適合しないビジネスロジックをカプセル化します。
        // 3. **モデル駆動設計**: 各バウンデッドコンテキスト内で、モデル駆動設計を使用して、ドメインを反映したモデルを作成します。これには、エンティティ、値オブジェクト、集約、ドメインイベントの特定が含まれます。
        //   - **エンティティ**は、明確な識別子を持つオブジェクトです。
        //   - **値オブジェクト**は、識別子ではなく属性によって定義されるオブジェクトです。
        //   - **集約**は、単一のユニットとして扱われるエンティティと値オブジェクトのクラスタです。
        //   - **ドメインイベント**は、ドメインエキスパートが関心を持つ重要なイベントです。
        // 4. **リポジトリの設計**: リポジトリは、集約の永続化を処理するために使用されます。リポジトリは、システムから集約を取得、追加、削除する方法を提供します。
        // 5. **サービスの設計**: サービスは、エンティティや値オブジェクトに自然に属さない操作です。ドメインオブジェクトには適合しないビジネスロジックをカプセル化します。
        // 6. **ファクトリの設計**: ファクトリは、複雑なオブジェクトや集約を作成するために使用されます。ファクトリは、これらのオブジェクトを作成するロジックをカプセル化します。
        // * **コンテキストマッピング**: 各バウンデッドコンテキスト内のモデルを設計した後は、これらのコンテキストがどのように相互作用するかを理解する必要があります。これは、コンテキストマッピングによって行われ、バウンデッドコンテキスト間の関係を特定します。
        // * **コンテキストマッピング**: 各バウンデッドコンテキスト内のモデルを設計した後は、これらのコンテキストがどのように相互作用するかを理解する必要があります。これは、コンテキストマッピングによって行われ、バウンデッドコンテキスト間の関係を特定します。
        // - Domain Events => Attributes, Description
        // - Domain Services => Methods
        // - Batch Jobs => Methods, Attributes, Description
        contentJp: Utils.trimLines(`
          Requirements と Domain Modelsに基づいて、以下のように情報を展開してください。
          指示はあくまでガイドラインです。指示を元に想起されるノウハウを自己補完しながら進めてください。
          - Entities => Attributes, Methods
          - Value Objects => Attributes
          - Aggregates => RootEntity, Entities, Value Objects
          - Domain Services => Methods
          Requirements、Domain Models に含まれる情報を抜け漏れなく反映してください。
          イテレーションを何度か繰り返し、適切なリファクタリングを行い、完成したドメインモデルのみを出力してください。
        `),
        content: Utils.trimLines(`
          Based on the Requirements and Domain Models, expand the information as follows.
          The instructions are just guidelines. Please proceed while self-completing the know-how recalled based on the instructions.
          - Entities => Attributes, Methods
          - Value Objects => Attributes
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
      // {
      //   title: 'prompt',
      //   contentJp: Utils.trimLines(`
      //     上記のrequirementsとドメインモデルを良く理解し、ドメイン駆動設計パターンに基づいて分類して下さい。
      //     一般的なお作法に準拠し、かつ以下の点にも注意を払って作業を進めてください。
      //     - ドメインモデルに足りていないものがある場合は追加して下さい。
      //     - モデルの目的や責務を明確に説明する。
      //     - エンティティやバリューオブジェクトの属性と操作を記述する。
      //     - エンティティやバリューオブジェクトの関連性と集約を明示する。
      //     - ビジネスルールや制約条件をドメインモデル内にドキュメント化する。
      //     - イベントや通知の発生条件や影響範囲を記述する。
      //     - ドメインサービスやリポジトリの役割と責務を明確に説明する。
      //     - クラスやメソッドの意図と目的をドキュメント化する。
      //   `),
    ];
  }
}
class Step0011_DomainModelsClassify extends BaseStep {
  model = 'gpt-4-0314';
  systemMessage = 'Experienced and talented software engineer. Specialized in domain-driven design.';
  constructor() {
    super();
    // - Entities / Value Objects Relationships => Relationship Type(${Object.values(RelationshipType).join('/')}), Source, Target
    // - Entities / Value Objects Relationships => Relationship Type(${Object.values(RelationshipType).join('/')}), Source, Target
    this.chapters = [
      { title: 'Requirements', content: fs.readFileSync(`./000-requirements.md`, 'utf-8') },
      { title: 'Domain Models Base', content: new Step0000_RequirementsToDomainModels().result },
      { title: 'Domain Models Refined', content: new Step0010_DomainModelsClassify().result },
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



class Step0020_domainModelsJson extends BaseStep {
  // model = 'gpt-4';
  dire: string;
  constructor(private pattern: string = 'Entities', private boundedContext: string = '') {
    super();
    this.label = `${this.constructor.name}_${pattern}`;

    // export interface BoundedContext { name: string; Entities: Entity[]; ValueObjects: ValueObject[]; Aggregates: Aggrigate[]; DomainServices: DomainService[]; DomainEvents: DomainEvents[]; }
    const formatMap: { [key: string]: string } = {
      Entities: '{"${EntityName}": {"Attributes": {"${name}": "${type}"},"Methods": {"${MethodName}": {"args": {"${name}": "${type}","${name}": "${type}"},"returnType": "${type}"},"${MethodName}": {"args": {"${name}": "${type}","${name}": "${type}"},"returnType": "${type}"}}}}',
      ValueObjects: '{"${ValueObjectName}": {"${name}": "${type}","${name}": "${type}"}}',
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
    // const domainModelString = step0010.includes(pattern) ? new Step0010_DomainModelsClassify().result : new Step0011_DomainModelsClassify().result;
    const domainModelString = new Step0010_DomainModelsClassify().result + '\n\n' + new Step0011_DomainModelsClassify().result;

    this.chapters = [
      // { title: 'Requirements', content: fs.readFileSync(`./000-requirements.md`, 'utf-8') },
      // { title: 'Domain Models', content: new Step0000_RequirementsToDomainModels().result },
      { title: 'Domain Models', content: domainModelString },
      {
        title: 'prompt',
        contentJp: Utils.trimLines(`
          リテラルはJavaの表現を利用してください。
          ドメインモデルから${pattern}を抽出して以下のJSON形式に変換してください。
          ${formatMap[pattern]}
        `),
        content: Utils.trimLines(`
          Literals should use Java expressions.
          Please extract the ${pattern} from the domain model and convert them to the following JSON format.
          ${formatMap[pattern]}
        `)
      },
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
      fs.writeFileSync(`${this.dire}${this.pattern}.json`, JSON.stringify(Utils.jsonParse(result)));
    } catch (e) {
      if (this.pattern == DomainModelPattern.BatchJobs) {
        console.log(`BatchJobsは空`);
      } else {
        console.log(e);
      }
    }
    return result;
  }
  static genSteps() {
    return Object.values(DomainModelPattern).filter((pattern) => ![DomainModelPattern.Entities, DomainModelPattern.DomainServices].includes(pattern)).map((pattern) => new Step0020_domainModelsJson(pattern));
  }
}

class Step0021_domainModelEntitysJson extends BaseStep {
  // model = 'gpt-4';
  dire: string;
  constructor(private pattern: string = 'Entities', private boundedContext: string = '') {
    super();
    this.label = `${this.constructor.name}_${pattern}-${Utils.toPascalCase(this.boundedContext)}`;

    const formatMap: { [key: string]: string } = {
      Entities: '{"${EntityName}": {"Attributes": {"${name}": "${type}"},"Methods": {"${MethodName}": {"args": {"${name}": "${type}","${name}": "${type}"},"returnType": "${type}"},"${MethodName}": {"args": {"${name}": "${type}","${name}": "${type}"},"returnType": "${type}"}}}}',
      ValueObjects: '{"${ValueObjectName}": {"${name}": "${type}","${name}": "${type}"}}',
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
    // const domainModelString = step0010.includes(pattern) ? new Step0010_DomainModelsClassify().result : new Step0011_DomainModelsClassify().result;
    const domainModelString = new Step0010_DomainModelsClassify().result + '\n\n' + new Step0011_DomainModelsClassify().result;

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
          ${formatMap[pattern]}
        `)
      },
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
      fs.writeFileSync(`${this.dire}${this.pattern}-${Utils.toPascalCase(this.boundedContext)}.json`, JSON.stringify(Utils.jsonParse(result)));
    } catch (e) {
      console.log(e);
    }
    return result;
  }
  static genSteps() {
    const boundedContexts: { [key: string]: { Entities: string[] } } = Utils.jsonParse(new Step0020_domainModelsJson(DomainModelPattern.BoundedContexts).result);
    return Object.keys(boundedContexts).map((boundedContextName) =>
      [DomainModelPattern.Entities, DomainModelPattern.DomainServices].map(pattern =>
        new Step0021_domainModelEntitysJson(pattern, boundedContextName)
      )
    ).reduce((a, b) => a.concat(b), []);
  }
}

class Step0030_CreateEntity extends BaseStep {
  // 本来はドメインモデルを作るときに一緒に作ってしまいたいけどトークン長が長すぎるので分割する。
  model = 'gpt-4-0314';
  dire: string = `./gen/domain-models/`;
  constructor() {
    super();
    const overview: { name: string, nickname: string, overview: string } = Utils.jsonParse(new Step0003_RequirementsToSystemOverview().result);
    const domainModel = DomainModel.loadModels();

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
          { title: `${DomainModelPattern.Aggregates}`, content: domainModel.getAttributeTable(DomainModelPattern.Aggregates), },
          {
            title: `Services`, content: Object.keys(domainModel.DomainServices).map((serviceName: string) => {
              // serviceName: methodName,,,
              return `- ${serviceName}: ${domainModel.DomainServices[serviceName].Methods.map((method) => method.name).join(', ')}`;
            }).join('\n'),
          },
        ]
      },
      // { title: `Table Definitions`, content: tableModels.map((tableModel: TableModel) => tableModel.toDDL()).join('\n'), },
      {
        title: `Instructions`,
        contentJp: Utils.trimLines(`
          Domain Modelsに基づいて、API仕様書を作成してください。
          指示はあくまでガイドラインです。指示を元に想起されるノウハウを自己補完しながら進めてください。
          - Request / Response の型を詳細に正確に定義してください。必ずしもモデルと一緒ではないはずです。
          - Domain Models に定義されていないオブジェクト型を利用する場合は、オブジェクト型の内容を明示してください。
          - トークン数を節約するため、表形式で出力してください。列は以下の通りです。
            Endpoint, Method, Request, Response, Service.Method, Description
          イテレーションを何度か繰り返し、適切なリファクタリングを行い、完成したドメインモデルのみを出力してください。
        `),
        content: Utils.trimLines(`
          Based on the Domain Models, create an API specification.
          The instructions are just guidelines. Please proceed while self-completing the know-how that is recalled based on the instructions.
          - Define the types of Request / Response in detail and accurately. It shouldn't always be the same as the model.
          - If you use an object type that is not defined in Domain Models, please specify the contents of the object type.
          - To save tokens, output in tabular form. The columns are as follows.
            Endpoint, Method, Request, Response, Service.Method, Description
          Repeat the iteration several times, perform appropriate refactoring, and output only the completed domain model.
        `),
      }
    ];
  }
  // postProcess(result: string): string {
  //   // ディレクトリが無ければ掘る
  //   if (fs.existsSync(this.dire)) { } else { fs.mkdirSync(this.dire, { recursive: true }); console.log(`Directory ${this.dire} created.`); }
  //   // ファイル書き込み
  //   try { fs.writeFileSync(`${this.dire}Relationship.json`, result.replace(/^```.*$/gm, '')); } catch (e) { console.log(e); }
  //   // const tableModels = TableModel.loadModels();
  //   // const ddl = tableModels.map((tableModel: TableModel) => tableModel.toDDL()).join('\n');
  //   // try { fs.writeFileSync(`./gen/src/ddl/all-tables.sql`, ddl); } catch (e) { console.log(e); }
  //   return result;
  // }
}

class Step0017_RelationCardinality extends BaseStep {
  // 本来はドメインモデルを作るときに一緒に作ってしまいたいけどトークン長が長すぎるので分割する。
  model = 'gpt-4';
  dire: string = `./gen/domain-models/`;
  constructor() {
    super();
    const overview: { name: string, nickname: string, overview: string } = Utils.jsonParse(new Step0003_RequirementsToSystemOverview().result);
    const domainModel = DomainModel.loadModels();
    const tableModels = TableModel.loadModels();

    this.chapters = [
      // { title: 'System Name', content: `${overview.nickname} (${overview.name})` },
      // { title: 'System Overview', content: overview.overview },
      // { title: 'Requirements', content: fs.readFileSync(`./000-requirements.md`, 'utf-8') },
      // { title: 'Base Domain Models', content: new Step0000_RequirementsToDomainModels().result },
      {
        title: 'Refined Domain Models',
        children: [
          { title: `${DomainModelPattern.Aggregates}`, content: domainModel.getAttributeTable(DomainModelPattern.Aggregates), },
          { title: `${DomainModelPattern.Entities}`, content: domainModel.getAttributeTable(DomainModelPattern.Entities), },
          { title: `${DomainModelPattern.ValueObjects}`, content: domainModel.getAttributeTable(DomainModelPattern.ValueObjects), },
        ]
      },
      // { title: `Table Definitions`, content: tableModels.map((tableModel: TableModel) => tableModel.toDDL()).join('\n'), },
      {
        title: `Instructions`,
        contentJp: Utils.trimLines(`
          以下の指示に従って、Entities と ValueObjects の リレーションカーディナリティを明らかにしてください。
          - Entity, ValueObjectを対象にしてリレーションカーディナリティを検討してください。
          - DBスペシャリスト、セキュリティスペシャリスト、ビジネスアナリスト、UI/UXデザイナーなどの視点を考慮してください。
          - 項目に抜け漏れが無いことを確認すること。
          以上のプロセスをステップバイステップで繰り返し、最終的に出来上がったもの「のみ」を出力してください。
          出力フォーマットは以下の通りです。
          [["EntityA","1:1","EntityB"],["EntityA","1:N","EntityC"],["EntityA","N:N","EntityD"],["EntityA","N:1","EntityE"]]
        `),
        content: Utils.trimLines(`
          Following the instructions below, clarify the relation cardinality of Entities and ValueObjects.
          - Consider the relation cardinality for Entity and ValueObject.
          - Consider the perspectives of DB specialists, security specialists, business analysts, UI/UX designers, etc.
          - Make sure there are no missing items.
          Repeat the above process step by step and output only the final result.
          The output format is as follows.
          [
            ["EntityA","1:1","EntityB"],
            ["EntityA","1:N","EntityC"],
            ["EntityA","N:N","EntityD"],
            ["EntityA","N:1","EntityE"]
          ]
          `),
        // [["EntityA","1:1","EntityB"],["EntityA","1:N","EntityC"],["EntityA","N:N","EntityD"],["EntityA","N:1","EntityE"]]
        // [{"type": "\${${Object.values(RelationshipType).join('|')}}","source": "\${(Entity|ValueObject)Name}","target": "\${(Entity|ValueObject)Name}",}]

        // {"Tables":{"\${TableName}":[[\${columnName},\${columnType},\${columnConstraint},\${columnDefault}],[\${columnName},\${columnType},\${columnConstraint},\${columnDefault}]]},"Indexes":{"\${TargetTableName}":[
        //   [\${indexName},\${indexName},]
        // ]}}
      }
    ];
  }
  postProcess(result: string): string {
    // ディレクトリが無ければ掘る
    if (fs.existsSync(this.dire)) { } else { fs.mkdirSync(this.dire, { recursive: true }); console.log(`Directory ${this.dire} created.`); }
    // ファイル書き込み
    try { fs.writeFileSync(`${this.dire}Relationships.json`, result.replace(/^```.*$/gm, '')); } catch (e) { console.log(e); }
    // const tableModels = TableModel.loadModels();
    // const ddl = tableModels.map((tableModel: TableModel) => tableModel.toDDL()).join('\n');
    // try { fs.writeFileSync(`./gen/src/ddl/all-tables.sql`, ddl); } catch (e) { console.log(e); }
    return result;
  }
}

class Step0018_TableItemDefine extends BaseStep {
  // model = 'gpt-4';
  dire: string = `./gen/domain-models/`;
  constructor() {
    super();
    const overview: { name: string, nickname: string, overview: string } = Utils.jsonParse(new Step0003_RequirementsToSystemOverview().result);
    const domainModel = DomainModel.loadModels();
    this.chapters = [
      { title: 'System Name', content: `${overview.nickname} (${overview.name})` },
      { title: 'System Overview', content: overview.overview },
      {
        title: `Domain Models`, content: '\n', children: [
          { title: `${DomainModelPattern.Entities}`, content: domainModel.getAttributeTable(DomainModelPattern.Entities), },
          { title: `${DomainModelPattern.ValueObjects}`, content: domainModel.getAttributeTable(DomainModelPattern.ValueObjects), },
        ]
      },
      {
        title: `Instructions`,
        contentJp: Utils.trimLines(`
          Domain Models を元に、以下の点に注意してPostgreSQL用のDDLを作成してください。
          - Domain Models の全てのEntity, ValueObjectを対象に、テーブル設計をしてください。
          - DBスペシャリスト、セキュリティスペシャリスト、ビジネスアナリスト、UI/UXデザイナーなどの視点を考慮してください。
          - 項目に抜け漏れが無いことを確認すること。
          以上のプロセスをステップバイステップで繰り返し、最終的に出来上がったもののみを出力してください。
          出力形式は以下の通りとすること。
            {"\${TableName}":[[\${columnName},\${columnType},\${columnConstraint},\${columnDefault}],[\${columnName},\${columnType},\${columnConstraint},\${columnDefault}]]}
          `),
        content: Utils.trimLines(`
          Based on Domain Models, create a DDL for PostgreSQL with the following points in mind.
          - Design the table for all Entities and ValueObjects in Domain Models.
          - Consider the perspectives of DB specialists, security specialists, business analysts, UI/UX designers, etc.
          - Make sure there are no missing items.
          Repeat the above process step by step and output only the final result.
          The output format is as follows.
            {"\${TableName}":[[\${columnName},\${columnType},\${columnConstraint},\${columnDefault}],[\${columnName},\${columnType},\${columnConstraint},\${columnDefault}]]}
          `),
        // {"Tables":{"\${TableName}":[[\${columnName},\${columnType},\${columnConstraint},\${columnDefault}],[\${columnName},\${columnType},\${columnConstraint},\${columnDefault}]]},"Indexes":{"\${TargetTableName}":[
        //   [\${indexName},\${indexName},]
        // ]}}
      }
    ];
  }
  postProcess(result: string): string {
    // ディレクトリが無ければ掘る
    if (fs.existsSync(this.dire)) { } else { fs.mkdirSync(this.dire, { recursive: true }); console.log(`Directory ${this.dire} created.`); }
    // ファイル書き込み
    try { fs.writeFileSync(`${this.dire}TableColumns.json`, result.replace(/^```.*$/gm, '')); } catch (e) { console.log(e); }
    const tableModels = TableModel.loadModels();
    const ddl = tableModels.map((tableModel: TableModel) => tableModel.toDDL()).join('\n');
    try { fs.writeFileSync(`./gen/src/ddl/all-tables.sql`, ddl); } catch (e) { console.log(e); }
    return result;
  }
}

class Step0019_TableItemDefine extends BaseStep {
  model = 'gpt-4';
  dire: string = `./gen/domain-models/`;
  constructor() {
    super();
    const overview: { name: string, nickname: string, overview: string } = Utils.jsonParse(new Step0003_RequirementsToSystemOverview().result);
    const domainModel = DomainModel.loadModels();
    const tableModels = TableModel.loadModels();
    this.chapters = [
      { title: 'System Name', content: `${overview.nickname} (${overview.name})` },
      { title: 'System Overview', content: overview.overview },
      {
        title: `Domain Models`, content: '\n', children: [
          { title: `${DomainModelPattern.Entities}`, content: domainModel.getAttributeTable(DomainModelPattern.Entities), },
          { title: `${DomainModelPattern.ValueObjects}`, content: domainModel.getAttributeTable(DomainModelPattern.ValueObjects), },
        ]
      },
      { title: `Table Definitions`, content: tableModels.map((tableModel: TableModel) => tableModel.toDDL()).join('\n'), },
      {
        title: `Instructions`,
        contentJp: Utils.trimLines(`
          Table Definitions を元に、以下の点に注意してSpringJPA用のEntityクラスを作成してください。
          - Domain Models の全てのEntity, ValueObjectを対象にしてください。
          - DBスペシャリスト、セキュリティスペシャリスト、ビジネスアナリスト、UI/UXデザイナーなどの視点を考慮してください。
          - 項目に抜け漏れが無いことを確認すること。
          以上のプロセスをステップバイステップで繰り返し、最終的に出来上がったもののみを出力してください。
          出力形式は以下の通りとすること。
            {"\${EntityClassName}:\${tableName}":[[\${propName},[\${jpaAnnotations}]],[\${propName},[\${jpaAnnotations}]]]}
          `),
        content: Utils.trimLines(`
          Based on the Table Definitions, create an Entity class for SpringJPA with the following points in mind.
          - Please target all Entities, ValueObjects in Domain Models.
          - Consider the perspectives of DB Specialists, Security Specialists, Business Analysts, UI/UX Designers, etc.
          - Make sure there are no omissions in the items.
          Repeat the above process step by step and output only the final product.
          The output format should be as follows
            {"\${EntityClassName}:\${tableName}":[[\${propName},[\${jpaAnnotations}]],[\${propName},[\${jpaAnnotations}]]]}
          `),
        // {"Tables":{"\${TableName}":[[\${columnName},\${columnType},\${columnConstraint},\${columnDefault}],[\${columnName},\${columnType},\${columnConstraint},\${columnDefault}]]},"Indexes":{"\${TargetTableName}":[
        //   [\${indexName},\${indexName},]
        // ]}}
      }
    ];
  }
  postProcess(result: string): string {
    // ディレクトリが無ければ掘る
    if (fs.existsSync(this.dire)) { } else { fs.mkdirSync(this.dire, { recursive: true }); console.log(`Directory ${this.dire} created.`); }
    // ファイル書き込み
    try { fs.writeFileSync(`${this.dire}JpaEntityModels.json`, result.replace(/^```.*$/gm, '')); } catch (e) { console.log(e); }
    // const tableModels = TableModel.loadModels();
    // const ddl = tableModels.map((tableModel: TableModel) => tableModel.toDDL()).join('\n');
    // try { fs.writeFileSync(`./gen/src/ddl/all-tables.sql`, ddl); } catch (e) { console.log(e); }
    return result;
  }
}

class Step0022_makeDDL extends BaseStep {
  model = 'gpt-4';
  dire: string = `./gen/src/ddl/`;
  constructor() {
    super();
    const domainModel = DomainModel.loadModels();
    this.chapters = [
      {
        title: `Domain Models`, children: [
          { title: `${DomainModelPattern.Entities}`, content: domainModel.getAttributeTable(DomainModelPattern.Entities), },
          { title: `${DomainModelPattern.ValueObjects}`, content: domainModel.getAttributeTable(DomainModelPattern.ValueObjects), },
        ]
      },
      {
        title: `prompt`,
        contentJp: Utils.trimLines(`
          Domain Models を元にPostgreSQLのDDLを作成してください。
        `),
        content: Utils.trimLines(`
          Please create a PostgreSQL DDL based on Domain Models.
        `),
      },
    ];

  }
  postProcess(result: string): string {
    // ディレクトリが無ければ掘る
    if (fs.existsSync(this.dire)) { } else { fs.mkdirSync(this.dire, { recursive: true }); console.log(`Directory ${this.dire} created.`); }
    // ファイル書き込み
    try { fs.writeFileSync(`${this.dire}ddl.sql`, result.replace(/^```.*$/gm, '')); } catch (e) { console.log(e); }
    return result;
  }
}

class Step0023_makeDDL extends BaseStep {
  model = 'gpt-4';
  dire: string = `./gen/src/ddl/`;
  constructor(private pattern: DomainModelPattern) {
    super();
    this.label = `${this.constructor.name}_${pattern}`;
    const domainModel = DomainModel.loadModels();
    this.chapters = [
      { title: `Domain Model: ${pattern}`, content: domainModel.getAttributeTable(pattern), },
      {
        title: `prompt`,
        contentJp: Utils.trimLines(`
          ${pattern}を元にPostgreSQLのDDLを作成してください。
        `),
        content: Utils.trimLines(`
          Please create a PostgreSQL DDL based on ${pattern}.
        `),
      },
    ];

  }
  postProcess(result: string): string {
    // ディレクトリが無ければ掘る
    if (fs.existsSync(this.dire)) { } else { fs.mkdirSync(this.dire, { recursive: true }); console.log(`Directory ${this.dire} created.`); }
    // ファイル書き込み
    try { fs.writeFileSync(`${this.dire}${this.pattern}.sql`, result.replace(/^```.*$/gm, '')); } catch (e) { console.log(e); }
    return result;
  }
  static genSteps() {
    return [DomainModelPattern.Entities, DomainModelPattern.ValueObjects].map((pattern) => new Step0023_makeDDL(pattern));
  }
}

class Step0021_makeDDL extends BaseStep {
  // model = 'gpt-4';
  dire: string = `./gen/src/ddl/`;
  constructor(private aggrigate: Aggrigate) {
    super();

    this.label = `${this.constructor.name}_${aggrigate.name}`;
    const modelToTable = (model: Entity | ValueObject) => {
      let table = '';
      table += `- ${model.name}\n`;
      model.Attributes.map((attribute: Attribute) => {
        table += `   - ${attribute.name}: ${attribute.type};\n`;
      });
      return table;
    };
    this.chapters = [
      {
        title: `Domain Models`,
        children: [
          { title: `RootEntity`, content: modelToTable(aggrigate.RootEntity) },
          { title: `Entities`, content: aggrigate.Entities.map(modelToTable).join('\n') } || 'None',
          { title: `ValueObjects`, content: aggrigate.ValueObjects.map(modelToTable).join('\n') } || 'None',
        ]
      },
      {
        title: `prompt`,
        contentJp: Utils.trimLines(`
          Domain Models を元にPostgreSQLのDDLを作成してください。
          - schema は設定しないでください。
        `),
        content: Utils.trimLines(`
          Please create a PostgreSQL DDL based on Domain Models.
          - Please do not set the schema.
        `),
      },
    ];

  }
  postProcess(result: string): string {
    // ディレクトリが無ければ掘る
    if (fs.existsSync(this.dire)) { } else { fs.mkdirSync(this.dire, { recursive: true }); console.log(`Directory ${this.dire} created.`); }
    // ファイル書き込み
    try { fs.writeFileSync(`${this.dire}${this.aggrigate.name}.sql`, result.replace(/^```.*$/gm, '')); } catch (e) { console.log(e); }
    return result;
  }
  static genSteps() {
    const domainModel = DomainModel.loadModels();
    return Object.keys(domainModel.Aggregates).map((key: string) => new Step0021_makeDDL(domainModel.Aggregates[key]));
  }
}

class Step0024_makeEntity extends BaseStep {
  // model = 'gpt-4';
  dire: string = `./gen/src/java/my/example/entity/`;
  constructor(private pattern: DomainModelPattern) {
    super();
    this.label = `${this.constructor.name}_${pattern}`;
    const domainModel = DomainModel.loadModels();
    this.chapters = [
      { title: `Domain Model: ${pattern}`, content: domainModel.getAttributeTable(pattern) },
      { title: 'DDLs', content: new Step0023_makeDDL(pattern).result },
      {
        title: 'prompt',
        contentJp: Utils.trimLines(`
          ${pattern}とDDLを元にSpringBoot(JPA)のEntityを作成してください。
          - entityのパッケージ名は my.example.entity としてください。
          - ドメインモデルに含まれる${pattern}を全て作成してください。
          - Lombokを使用して、シンプルなコードで作成してください。
        `),
        content: Utils.trimLines(`
          Please create a SpringBoot (JPA) Entity based on ${pattern} and DDL.
          - Please use my.example.entity as the package name for the entity.
          - Please make all ${pattern} included in the domain model.
          - Please use Lombok to create simple code.
        `)
      },
    ];
  }
  postProcess(result: string): string {
    // ディレクトリが無ければ掘る
    if (fs.existsSync(this.dire)) { } else { fs.mkdirSync(this.dire, { recursive: true }); console.log(`Directory ${this.dire} created.`); }
    // ファイル書き込み
    try { fs.writeFileSync(`${this.dire}${this.pattern}.java`, result.replace(/^```.*$/gm, '')); } catch (e) { console.log(e); }
    return result;
  }
  static genSteps() {
    return [DomainModelPattern.Entities, DomainModelPattern.ValueObjects].map((pattern) => new Step0024_makeEntity(pattern));
  }
}

class Step0040_makeReactService extends BaseStep {
  model = 'gpt-4';
  constructor() {
    super();
    this.chapters = [
      // { title: 'System Overview', content: new Step0030_requirements_to_systemOverview().result },
      { title: 'Requirements', content: fs.readFileSync(`./000-requirements.md`, 'utf-8') },
      { title: 'Component List', content: Utils.spaceNormalize(new Step0000_RequirementsToDomainModels().result) },
      { title: 'React Component List', content: Utils.spaceNormalize(new Step0010_DomainModelsClassify().result) },
      {
        title: 'prompt', content: Utils.trimLines(`
          Let's think step by step.
          After reviewing the documents provided, please generate a list of React service classes needed for this system.
          - Enumerate the method purpose and signature.
          - If there are multiple possible patterns, opt for the simpler design.
          - Please consider the fields for your model classes. A model class represents the structure of data used in the system.
            Even when dealing with the same model, Request and Response types may have different structures.
            Please pay attention to the following points when determining the structures:
            - Guidelines for determining Request types:
                - The Request type for registering and updating data should be such that the structure of the object is not hierarchical.
                - When registering data, the Request type should not include an ID field since the ID is undetermined at that stage. 
                - Request types used for filtering purposes may have additional or different required fields compared to the model. They may also include fields to specify ranges.
            - Guidelines for determining Response types:
                - To facilitate the usage of data without the need for further manipulation on the frontend, Response types should be structured in a way that combines multiple models in advance. Instead of storing identifiers like \`xxId\`, the structure should directly hold the corresponding objects.
          The list of services should undergo review by professionals such as UI/UX designers, security specialists, business analysts, and consistency checkers. They will provide input for improvements. 
          The consistency checker will strictly ensure that your service list adheres to all previous requirements.
          Your final output should be the improved list of React service classes and their associated methods, and model / request / response classes and their associated properties list.
        `)
        // - Services that obtain simple classification values (type, key, value, label), such as gender classification, should be combined into one api.
        // - RequestかつPUT/POSTの場合は、複数のモデルを組み合わせて登録することは少ないため、複数のモデルを組み合わせることは避けてください。
        // - Responseの場合は、複数のモデルが組み合わされた構造（例えばxxIdのようなものを保持するのではなく、直接xxオブジェクトを保持する構造）としてください。 
      },
    ];
  }
}

class Step0050_makeReactModel extends BaseStep {
  model = 'gpt-4';
  constructor() {
    super();
    this.chapters = [
      { title: 'requirements', content: fs.readFileSync(`./000-requirements.md`, 'utf-8') },
      // { title: 'Component List', content: new Step0000_RequirementsToDomainModels().result },
      { title: 'React Component List', content: new Step0010_DomainModelsClassify().result },
      { title: 'React Service List', content: new Step0040_makeReactService().result },
      {
        title: 'prompt', content: Utils.trimLines(`
          Let's think step by step.
          - Based on the above design document, extract the names of all model classes (including request and response).
          - Note that some of the names may be similar but different, and check to see if any model classes have been omitted.
          - For the extracted model classes, include all necessary items other than those used on the screen.
          - Please consider the fields for your model classes. A model class represents the structure of data used in the system.
            Even when dealing with the same model, Request and Response types may have different structures.
            Please pay attention to the following points when determining the structures:
            - Guidelines for determining Request types:
                - The Request type for registering and updating data should be such that the structure of the object is not hierarchical.
                - When registering data, the Request type should not include an ID field since the ID is undetermined at that stage. 
                - Request types used for filtering purposes may have additional or different required fields compared to the model. They may also include fields to specify ranges.
            - Guidelines for determining Response types:
                - To facilitate the usage of data without the need for further manipulation on the frontend, Response types should be structured in a way that combines multiple models in advance. Instead of storing identifiers like \`xxId\`, the structure should directly hold the corresponding objects.
          - Define enums as appropriate.
          - For all model classes, define items and types without omissions (including filters, etc.).
          - When setting a new class for an item, please define the item and type as a model class without omission.
          - Please also describe the validation of items.
          - The Model Classes should be reviewed by experts such as UI/UX designers, security specialists, business analysts, consistency checkers, etc., and an improved version should be presented that incorporates their input (The consistency checker rigorously checks that all classes readable from the design document are reflected, and that classes referenced within the defined propertie's classes are also well defined.).
          Only the typescript source code Model classes, Enums, Validation Rules as comment is output.
        `)
        // - 上記の設計書を元に、全てのモデルクラス(request,response含む)の名前を抽出してください。
        // - 似ている名前でも異なるものがあることに注意して、モデルクラスの取りこぼしが無いか確認してください。
        // - 抽出したモデルクラスについて、画面上で使用する項目以外に必要な項目を全て含めてください。

        // - 全てのモデルクラスについて、項目と型を漏れなく定義してください（filter等も含めて）。
        // - 項目の方として新たにクラスを設定する場合もモデルクラスとして項目と型を漏れなく定義してください。
        // - 項目のバリデーションについても記載してください。

        // consistency checkers strictly check whether the Model Classes reflects all previous designs
      },
    ];
  }
}

class Step0060_makeReactModelSource extends BaseStep {
  constructor() {
    super();
    this.chapters = [
      { title: 'React Model List', content: new Step0050_makeReactModel().result },
      {
        title: 'prompt', content: Utils.trimLines(`
          Please create the above Model Classes as Typescript classes.
          Please refer to the following format.
          - If you are instructed to create an interface, convert it to a class and output it.
          \`\`\`typescript
          // ./src/app/models.ts
          export class ClassName {
            constructor(
              public name: type = default,
            ){
            }
          }
          \`\`\`
        `)
      },
    ];
  }
  postProcess(text: string): string {
    text = text.replace(/```.*/g, '').trim();
    fs.mkdirSync(`./gen/src/app`, { recursive: true });
    fs.writeFileSync(`./gen/src/app/models.ts`, text);
    return text;
  }
}
class Step0065_ReactModelList_to_Json extends BaseStep {
  constructor() {
    super();
    this.chapters = [
      { title: 'React Model List', content: new Step0050_makeReactModel().result },
      {
        title: 'prompt', content: Utils.trimLines(`
          Please convert the above List of Screensn into JSON format.
          {"ModelClassName":{"desc": "A brief description of the Model", "props":[{"name":"propName","type":"propType<generic>","validation":"propValidation",},]},,"EnumName":{"desc": "A brief description of the Enum", "values":["value","value",,]},,}
          Note that this is minified JSON without newlines and spaces(Do not add extra space.).
        `)
      },
    ];
  }
}
class Step0070_makeApiList extends BaseStep {
  constructor() {
    super();
    this.chapters = [
      // { title: 'React Component List', content: new Step0010_DomainModelsClassify().result },
      { title: 'React Service List', content: new Step0040_makeReactService().result },
      { title: 'React Model List', content: new Step0050_makeReactModel().result },
      {
        title: 'prompt', content: Utils.trimLines(`
          Please create an API list based on the above design document.
          - Please make the API list in a tabular format. The only columns should be "Method", "Path", "RequestBody", and "ResponseBody".
          - For login-related APIs, be sure to include a token in the ResponseBody. Even if the token is not specified in the output item of the service class, it must be returned from the API as a hidden item.
          - It is not necessary to implement all the methods of the service class. Select functions that should be processed on the server side appropriately and make them into APIs.
          - The API list should be reviewed by experts such as UI/UX designers, security specialists, business analysts, and strict consistency checkers, and an improved version should be presented with their input. (Strict consistency checkers will rigorously check that all features that should be implemented on the server are reflected in the API list).
          Only output the Improved APIs List.
        `)
      },
    ];
    const tail = `# prompt
Above is a screen-side design document created assuming React.
Based on this design document, please create an appropriate APIs list.
- Please make the API list in a tabular format. The only columns should be "Method", "Path", "RequestBody", and "ResponseBody".
- For login-related APIs, be sure to include a token in the ResponseBody. Even if the token is not specified in the output item of the service class, it must be returned from the API as a hidden item.
- It is not necessary to implement all the methods of the service class. Select functions that should be processed on the server side appropriately and make them into APIs.
- The API list should be reviewed by experts such as UI/UX designers, security specialists, business analysts, and strict consistency checkers, and an improved version should be presented with their input. (Strict consistency checkers will rigorously check that all features that should be implemented on the server are reflected in the API list).
Only output the Improved APIs List.`;
  }
}
class Step0080_makeReactServiceJson extends BaseStep {
  constructor() {
    super();
    this.chapters = [
      // { title: 'React Component List', content: new Step0010_DomainModelsClassify().result },
      { title: 'React Service List', content: new Step0040_makeReactService().result },
      // { title: 'React Model List', content: new Step0050_makeReactModel().result },
      {
        title: 'prompt', content: Utils.trimLines(`
          Please convert the above List of Screensn into JSON format.
          {"ServiceName":{"path":". /src/app/services/ServiceName.ts", "models":["modelClassName"],"methods":[{"name":"methodName","params":[{"name":"type"}],"return":"returnType<genericType>"}]},"ServiceName":{"path":". /src/app/services/ServiceName.ts", "models":["modelClassName"],"methods":[{"name":"methodName","params":[{"name":"type"}],"return":"returnType<genericType>"}]},,,}
          Note that this is correct minified JSON format (Do not add extra space.).
        `)
      },
    ];
  }
  preProcess(prompt: string): string {
    return prompt;
  }
  postProcess(result: string): string {
    ReactCodeGenerator.genService(result);
    genIndex();
    return result;
  }
}

class Step0100_ApiListJson extends BaseStep {
  constructor() {
    super();
    this.chapters = [
      { title: 'APIs List', content: new Step0070_makeApiList().result },
      {
        title: 'prompt', content: Utils.trimLines(`
          Please convert APIs List table to minified JSON format, like below.
          [{"method":"POST","path":"/api/auth/login","requestBody":"{ username, password }","responseBody":"{ token, user: User }","description":"Authenticates user and returns a token and user object"},{"method":"POST","path":"/api/auth/login","requestBody":"{ username, password }","responseBody":"{ token, user: User }","description":"Authenticates user and returns a token and user object" },,]
          Output Json only(Do not add extra space.).
        `)
      },
    ];
  }
}

class Step0102_createJSONdata extends BaseStep {
  constructor(chunkArray: any[], index: number, modelList: string,) {
    super();
    this.label = `${this.constructor.name}_${index}`;
    const cols = Object.keys(chunkArray[0]);
    const header = cols.join(' | ');
    const border = cols.map(key => '-').join(' | ');
    const bodies = chunkArray.map(obj => cols.map(key => obj[key]).join(' | '));
    const apiListTable = [header, border, ...bodies].map(row => `| ${row} |`).join('\n').replace(/  +/g, '');

    this.chapters = [
      { title: 'APIs List', content: apiListTable },
      { title: 'Models List', content: modelList },
      {
        title: 'prompt', content: Utils.trimLines(`
          Based on the above design document, please create a sample data (for Japanese) for the APIs List.
          Only the ResponseBody is required.
          Please use all values of Enum.
          The format is minified JSON as follows.
          {"\${Method}-\${Path}":\${mockdata}}
          Please output only JSON data(Do not add extra space.).
        `)
      }
    ];
    /**
     * 以上の設計書に基づいてAPIs ListのAPIのサンプルデータ（日本人向け）を作って下さい。
     * ResponseBodyのみでよいです。
     * Enumは全ての値を使ってください。
     * 形式は以下のminifiedJSONで、1つにまとめてください。
     * {"\${Method}-\${Path}":\${mockdata}}
     * JSON形式のデータ以外は出力しないでください。
     */
  }
  postProcess(result: string) {
    try {
      const all: { [key: string]: any } = Utils.jsonParse(result) as any;
      Object.keys(all).forEach(key => {
        let method = key.split('-')[0];
        let path = key.substring(method.length + 1);
        // スラッシュを1つにする、かつ先頭と末尾のスラッシュを外す。
        path = path.replace(/\/\/+/, '/').replace(/^\/|\/$/, '').replace(/[\?=\&]/g, '-');
        // console.log(path);
        path = path.replace(/:[^/]*\//g, '1/').replace(/:[^/]*$/g, '1').replace(/[{}]/g, '');
        // console.log(path);
        let dire = `./gen/src/assets/mock/${path}`.replace(/\/[^\/]*$/g, '');
        // ディレクトリを掘る。
        fs.mkdirSync(dire, { recursive: true });
        fs.writeFileSync(`./gen/src/assets/mock/${path}-${method}.json`, JSON.stringify(all[key], null, 4));
      });
    } catch (e) {
      // DELETEが無かったりすることもあるので無視する。
      // console.log(e);
      // console.log(result);
    }
    return result;
  }
  static genSteps() {
    const modelList = new Step0050_makeReactModel().result;
    const apiList = Utils.jsonParse(new Step0100_ApiListJson().result) as any[];
    return Utils.toChunkArray(apiList, 3).map((chunkArray: any, index: number) => new Step0102_createJSONdata(chunkArray, index, modelList));
  }
}

class Step0105_componentList_to_Json extends BaseStep {
  constructor() {
    super();
    this.chapters = [
      { title: 'Component List', content: new Step0000_RequirementsToDomainModels().result },
      {
        title: 'prompt', content: Utils.trimLines(`
          Please convert the above List of Screensn into JSON format.
          {"ScreenName":{"desc": "A brief description of the screen", "uiList"["UI component",,]},,}
          Note that this is minified JSON without newlines and spaces(Do not add extra space.).
        `)
      },
    ];
  }
}

class Step0120_makeScreenSpec extends BaseStep {
  // model = 'gpt-4';
  constructor(index: number, componentName: string, ngUiJSON: any) {
    super();
    this.label = `${this.constructor.name}_${index}-${componentName}`;

    const g: any = {};
    const ngUiList = Utils.spaceNormalize(new Step0010_DomainModelsClassify().result);
    const systemOverview: { name: string, nickname: string, overview: string } = Utils.jsonParse(new Step0003_RequirementsToSystemOverview().result);
    const serviceListJSON = new Step0080_makeReactServiceJson().result;
    g.services = Utils.jsonParse(serviceListJSON.replace(/```/g, '').trim());
    const serviceString = Object.keys(g.services).map(key => ` - ${key}: ${g.services[key].methods.map((method: any) => method.name + '(' + method.params.map((kv: { name: string, type: string }) => kv.name + ': ' + kv.type).join(', ') + '): ' + method.return).join(', ')}`).join('\n');
    const modelJSON = new Step0065_ReactModelList_to_Json().result;
    g.models = Utils.jsonParse(modelJSON.replace(/```/g, '').trim());
    // console.log(g.models);
    const modelString = Object.keys(g.models).filter(key => g.models[key].props).map(key => ` - ${key}(${g.models[key].props.map((prop: any) => prop.name + ': ' + prop.type).join(', ')})`).join('\n');
    const enumString = Object.keys(g.models).filter(key => g.models[key].values).map(key => ` - ${key}: ${g.models[key].values.map((value: string) => '"' + value + '"').join(' | ')}`).join('\n');

    const io = ['props'].map(io => Object.keys(ngUiJSON[componentName][io] || {}).filter(key => key.trim() !== '-').map(key => `- ${key}: ${ngUiJSON[componentName][io][key]}`).join('\n'));
    this.chapters = [
      { title: 'System Name', content: `${systemOverview.nickname} (${systemOverview.name})` },
      { title: 'System Overview', content: `${systemOverview.overview}` },
      { title: 'All React Components', content: ngUiList },
      { title: 'All Model Classes', content: modelString },
      { title: 'All Enums', content: enumString },
      { title: 'All Service Classes', content: serviceString },
      {
        title: 'prompt', content: Utils.trimLines(`
          Based on the above design, prepare a detailed screen design document for ${componentName}.
          > Please think step-by-step when creating the design document.
          > First, carefully read the System Overview to understand the purpose of this system.
          > Next, look at the React Component List carefully to understand the position of the ${componentName} within the overall system.
          > Then, think about the elements and functions you need for the ${componentName}.
          > Then select from All Service Classes which service (and model) will be used to provide the required information for the component.
          - Do not include information that will be implemented by child components.
          The chapter structure should be as follows.
          \`\`\`markdown
          # Detailed Screen Design Document
          ## Screen name
          ## Description
          ## Screen layout
          ## Data to be displayed
          ## Screen behavior
          ## Input Form
          ## Error messages
          ## React components used
          ## Model classes used (excluding use from child components)
          ## Service classes and methods used (excluding calls from child components)
                    \`\`\`
        `)
      }
    ];
  }
  static genSteps() {
    let ngUiJSON = Utils.jsonParse<any>(new Step0020_domainModelsJson().result.replace(/{"": ""}/g, 'null'));
    ngUiJSON = filterByComponentName(ngUiJSON);
    return Object.keys(ngUiJSON).map((componentName, index) => new Step0120_makeScreenSpec(index, componentName, ngUiJSON));
  }
}

class Step0130_makeScreenSpecJSON extends BaseStep {
  constructor(index: number, componentName: string, ngUiJSON: any) {
    super();
    this.label = `${this.constructor.name}_${index}-${componentName}`;
    this.chapters = [
      { title: '', content: new Step0120_makeScreenSpec(index, componentName, ngUiJSON).result },
      {
        title: 'prompt', content: Utils.trimLines(`
          Please convert the above List of Screensn into JSON format.
          {"reactComponentUsed":[\${React component used}], "modelClassesUsed":[\${Model class used}], "serviceClassesUsed":[\${Service class used}]]}
          * Models and Services shall be by name only List.
          Note that this is minified JSON without newlines and spaces(Do not add extra space.).
        `)
      },
    ];
  }
  static genSteps() {
    const g: any = {};
    let ngUiJSON = Utils.jsonParse<any>(new Step0020_domainModelsJson().result);
    ngUiJSON = filterByComponentName(ngUiJSON);
    const serviceListJSON = new Step0080_makeReactServiceJson().result;
    g.services = Utils.jsonParse(serviceListJSON.replace(/```/g, '').trim());
    const modelJSON = new Step0065_ReactModelList_to_Json().result;
    g.models = Utils.jsonParse(modelJSON.replace(/```/g, '').trim());
    return Object.keys(ngUiJSON).map((componentName, index) => new Step0130_makeScreenSpecJSON(index, componentName, ngUiJSON));
  }
}
function filterByComponentName(ngUiJSON: any) {
  const tmp: { [key: string]: any } = {};
  Object.keys(ngUiJSON).forEach(key => { if (['ROOT_ROUTER', 'PUBLIC_SCREEN', 'ROUTER', 'PRIVATE_SCREEN', 'HEADER', 'SIDENAVI', 'MAIN', 'MAIN_ROUTER', 'FOOTER',].includes(key)) { } else { tmp[key] = ngUiJSON[key]; } });
  ngUiJSON = tmp;
  ['childReactComponents'].forEach((prop: string) => { Object.keys(ngUiJSON).forEach(compName => { ngUiJSON[compName][prop] = ngUiJSON[compName][prop].filter((chilName: string) => Object.keys(ngUiJSON).includes(chilName) && !['RouterOutlet', 'HTMLComponents', 'describe'].includes(chilName)); }); });
  return ngUiJSON;
}

class Step0140_makeScreen extends BaseStep {
  // model = 'gpt-4';
  override systemMessage = 'You are an experienced and talented react programmer.';
  // 
  override assistantMessage = '```tsx';

  private dire: string;
  private nameCamel0: string;
  private nameKebab0: string;
  constructor(
    private index: number,
    private componentName: string,
    private ngUiJSON: any,
    private g: any,) {
    super();
    this.label = `${this.constructor.name}_${index}-${componentName}`;

    const doc = new Step0120_makeScreenSpec(index, componentName, ngUiJSON).result;
    const sv = Utils.jsonParse<{ [key: string]: ServiceClass }>(new Step0080_makeReactServiceJson().result);
    const md = Utils.jsonParse<{ [key: string]: ModelClass }>(new Step0065_ReactModelList_to_Json().result);
    const repo = new ModelControlClass(sv, md);
    const used = Utils.jsonParse(new Step0130_makeScreenSpecJSON(index, componentName, ngUiJSON).result.replace(/```/g, '').trim()) as { modelClassesUsed: string[], serviceClassesUsed: string[] };
    const svmd = repo.pickUp(used.serviceClassesUsed);

    const nameKebab = Utils.toKebabCase(componentName);
    this.nameKebab0 = nameKebab;
    this.nameCamel0 = Utils.toCamelCase(componentName);
    const io = ['props'].map(io => Object.keys(ngUiJSON[componentName][io] || {}).filter(key => key.trim() !== '-').map(key => `- ${key}: ${ngUiJSON[componentName][io][key]}`).join('\n'));
    // console.log(ngUiJSON[componentName].childReactComponents);
    // console.log(ngUiJSON[componentName].modalReactComponents);

    const compDef = ngUiJSON[componentName];
    this.chapters = [
      {
        title: '', content: doc, children: [
          {
            title: 'Elements to be used', children: [
              { title: 'React Components', content: (ngUiJSON[componentName].childReactComponents || []).map((chilName: string) => '- ' + chilName + '(' + ['props'].map(io => io + ':{' + Object.keys(ngUiJSON[chilName][io] || {}).filter(key => key.trim() !== '-').map(key => key + ': ' + ngUiJSON[chilName][io][key]).join(',') + '}').join(', ') + ')').join('\n') || 'None' },
              // { title: 'React Dialogs', content: (ngUiJSON[componentName].modalReactComponents || []).map((chilName: string) => '- ' + chilName + '(' + ['props'].map(io => io + ':{' + Object.keys(ngUiJSON[chilName][io] || {}).filter(key => key.trim() !== '-').map(key => key + ': ' + ngUiJSON[chilName][io][key]).join(',') + '}').join(', ') + ')').join('\n') || 'None' },
              // { title: 'HTML Elements', content: (ngUiJSON[componentName].HTMLComponents || []).map((name: string) => '- ' + name).join(', ') || 'None' },
            ]
          },
          { title: 'props (as React element)', content: io[0] },
        ]
      },
      {
        title: 'Reference', content: '', children: [
          { title: 'Service classes', content: svmd.serviceDef },
          { title: 'Model classes', content: svmd.modelDef },
        ]
      },
      {
        title: 'prompt', content: Utils.trimLines(`
          Let's think step by step.
          Please create ${this.nameCamel0}.tsx based on the above design document.
          Please note the following points when creating the tsx.
          - Please use Chakra UI.
          - Compose the screen using only the given components.
          - The screen must be in Japanese.
          Please output only ${this.nameCamel0}.tsx file.
          \`\`\`tsx
          import React from 'react';
          import { /* TODO import */ } from '@chakra-ui/react';
          import { ${used.modelClassesUsed.join(',')} } from '../models';
          import { ${used.serviceClassesUsed.map(serviceClassName => Utils.toCamelCase(serviceClassName)).join(',')} } from '../services';

          export interface ${this.nameCamel0}Props {
            // props
          }
          
          const ${this.nameCamel0} = (props:${this.nameCamel0}Props) => {

            // TODO implement

            return (
              // JSX elements
            );
          };
          export default ${this.nameCamel0};
          \`\`\`
        `)
      },
    ];

    ////////////////// 
    this.dire = `./gen/src/app/${ngUiJSON[componentName].type.toLowerCase().replace(/s$/g, '')}s`;
    if (fs.existsSync(this.dire)) {
    } else {
      fs.mkdirSync(this.dire, { recursive: true });
      console.log(`Directory ${this.dire} created.`);
    }
  }

  preProcess(prompt: string): string {
    fs.writeFileSync(`${this.dire}/${Utils.toPascalCase(this.nameCamel0)}.tsx.prompt.md`, prompt);
    // fs.writeFileSync(`./${this.dire}/${this.nameCamel0}.scss`, '');
    return prompt;
  }

  postProcess(result: string) {
    fs.writeFileSync(`${this.dire}/${Utils.toPascalCase(this.nameCamel0)}.tsx`, result
      .replace(/.*```.*\n/, '')
      .replace(/\n```.*/, '')
      .replace(/from ["']\.\/services\/.*["']/g, 'from \'../services\'')
      .replace(/from ["']\.\/services["']/g, 'from \'../services\'')
      .replace(/from ["']\.\/models\/.*["']/g, 'from \'../models\'')
      .replace(/from ["']\.\/models["']/g, 'from \'../models\'')
      .replace(/from ["']\.\.\/services\/.*["']/g, 'from \'../services\'')
      .replace(/from ["']\.\.\/services["']/g, 'from \'../services\'')
      .replace(/from ["']\.\.\/models\/.*["']/g, 'from \'../models\'')
      .replace(/from ["']\.\.\/models["']/g, 'from \'../models\'')
      .replace(/from ["']\.\.\/\.\.\/services\/.*["']/g, 'from \'../services\'')
      .replace(/from ["']\.\.\/\.\.\/models\/.*["']/g, 'from \'../models\'')
      .replace(/from '\.\.\/modals\//g, 'from \'../modals/')
      .replace(/from '\.\.\/pages\//g, 'from \'../pages/')
      .replace(/from '\.\.\/parts\//g, 'from \'../parts/')
      // .replace('$event.target.value', `$event.target['value']`)
      // .replace(/\.controls\.([a-zA-Z0-9_$]*)\./g, `.controls['$1']?.`)
      // .replace(/(\.controls[a-zA-Z0-9_$\[\]"']*\.errors)\.([a-zA-Z0-9_$]*)/g, `$1['$2']`)
    );
    return result;
  }

  static genSteps() {
    const g: any = {};
    let ngUiJSON = Utils.jsonParse<any>(new Step0020_domainModelsJson().result);
    // console.log(Object.keys(ngUiJSON));
    ngUiJSON = filterByComponentName(ngUiJSON);
    const serviceListJSON = new Step0080_makeReactServiceJson().result;
    g.services = Utils.jsonParse(serviceListJSON.replace(/```/g, '').trim());
    const modelJSON = new Step0065_ReactModelList_to_Json().result;
    g.models = Utils.jsonParse(modelJSON.replace(/```/g, '').trim());
    g.classes = new RepoSyncer().loadDefs();
    // console.log(g.models);
    // console.log(Object.keys(ngUiJSON));
    return Object.keys(ngUiJSON).map((componentName, index) => new Step0140_makeScreen(index, componentName, ngUiJSON, g));
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
    obj = new Step0003_RequirementsToSystemOverview();
    obj.initPrompt();
    return obj.run();
  }).then(() => {
    obj = new Step0010_DomainModelsClassify();
    obj.initPrompt();
    return obj.run();
  }).then(() => {
    obj = new Step0011_DomainModelsClassify();
    obj.initPrompt();
    return obj.run();
  }).then(() => {
    obj = new MultiStep(Step0020_domainModelsJson.genSteps());
    obj.initPrompt();
    return obj.run();
  }).then(() => {
    obj = new MultiStep(Step0021_domainModelEntitysJson.genSteps());
    obj.initPrompt();
    return obj.run();
  })


  // obj = new Step0030_CreateEntity();
  // obj.initPrompt();
  // await obj.run();


  // obj = new Step0017_RelationCardinality();
  // obj.initPrompt();
  // await obj.run();


  // obj = new Step0017_RelationCardinality();
  // obj.initPrompt();
  // await obj.run();


  // obj = new Step0018_TableItemDefine();
  // obj.initPrompt();
  // await obj.run();

  // obj = new Step0019_TableItemDefine();
  // obj.initPrompt();
  // await obj.run();

  // obj = new MultiStep(Step0021_makeDDL.genSteps());
  // obj.initPrompt();
  // await obj.run();

  // obj = new Step0022_makeDDL();
  // obj.initPrompt();
  // await obj.run();

  // obj = new MultiStep(Step0023_makeDDL.genSteps());
  // obj.initPrompt();
  // await obj.run();

  // obj = new MultiStep(Step0024_makeEntity.genSteps());
  // obj.initPrompt();
  // await obj.run();


  // obj = new Step0040_makeReactService();
  // obj.initPrompt();
  // await obj.run();

  // obj = new Step0050_makeReactModel();
  // obj.initPrompt();
  // await obj.run();


  // obj = new Step0060_makeReactModelSource();
  // obj.initPrompt();
  // await obj.run();


  // obj = new Step0065_ReactModelList_to_Json();
  // obj.initPrompt();
  // await obj.run();

  // obj = new Step0070_makeApiList();
  // obj.initPrompt();
  // await obj.run();

  // obj = new Step0080_makeReactServiceJson();
  // obj.initPrompt();
  // await obj.run();

  // new Step0080_makeReactServiceJson().postProcess(new Step0080_makeReactServiceJson().result);

  // obj = new Step0100_ApiListJson();
  // obj.initPrompt();
  // await obj.run();

  // obj = new MultiStep(Step0102_createJSONdata.genSteps());
  // obj.initPrompt();
  // await obj.run();

  // obj = new Step0105_componentList_to_Json();
  // obj.initPrompt();
  // await obj.run();

  // obj = new MultiStep(Step0120_makeScreenSpec.genSteps());
  // obj.initPrompt();
  // await obj.run();

  // obj = new MultiStep(Step0130_makeScreenSpecJSON.genSteps());
  // obj.initPrompt();
  // await obj.run();

  // obj = new MultiStep(Step0140_makeScreen.genSteps());
  // obj.initPrompt();
  // await obj.run();

  // Step0140_makeScreen.genSteps().forEach(step => step.preProcess(fs.readFileSync(step.promptPath, 'utf-8')));
  // Step0140_makeScreen.genSteps().forEach(step => { step.preProcess(step.prompt); step.postProcess(step.result) });
}
// main();

