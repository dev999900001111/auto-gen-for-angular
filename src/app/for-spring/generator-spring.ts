import * as  fs from 'fs';
import { Utils } from '../common/utils';
import { BaseStep, MultiStep } from "../common/base-step";
import { Aggrigate, Attribute, BoundedContext, ContextMapRelationshipType, DomainModel, DomainModelPattern, Entity, RelationshipType, TableModel, ValueObject, genEntityAndRepository } from '../domain-models/domain-models';

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
          \`\`\`json
          ${formatMap[pattern]}
          \`\`\`
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
      fs.writeFileSync(`${this.dire}${this.pattern}-${Utils.toPascalCase(this.boundedContext)}.json`, Utils.mdTrim(result));
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

class Step0030_CreateEntity extends MultiStep {
  // 本来はドメインモデルを作るときに一緒に作ってしまいたいけどトークン長が長すぎるので分割する。
  // model = 'gpt-4';
  // dire: string = `./gen/domain-models/`;
  constructor() {
    super();
    const overview: { name: string, nickname: string, overview: string } = Utils.jsonParse(new Step0003_RequirementsToSystemOverview().result);
    const domainModel = DomainModel.loadModels();

    class Step0030_CreateEntityChil extends BaseStep {
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
              { title: `${DomainModelPattern.Entities}`, content: domainModel.getAttributeTable(DomainModelPattern.Entities, boundedContext), },
              { title: `${DomainModelPattern.ValueObjects}`, content: domainModel.getAttributeTable(DomainModelPattern.ValueObjects, boundedContext), },
              { title: `${DomainModelPattern.Aggregates}`, content: domainModel.getAttributeTable(DomainModelPattern.Aggregates, boundedContext), },
              {
                title: `Services`, content: Object.keys(boundedContext.DomainServices).map((serviceName: string) => {
                  // serviceName: methodName,,,
                  return `- ${serviceName}: ${boundedContext.DomainServices[serviceName].Methods.map((method) => method.name).join(', ')}`;
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
              - 以下の項目について設計して下さい。
                Endpoint, Method, Request, Validation, Response, Service.Method, Description
              イテレーションを何度か繰り返し、適切なリファクタリングを行い、完成したドメインモデルのみを出力してください。
              出力形式は Output Example を参考にしてください。
            `),
            content: Utils.trimLines(`
              Based on the Domain Models, create an API specification.
              The instructions are just guidelines. Please proceed while self-completing the know-how that is recalled based on the instructions.
              - Define the types of Request / Response in detail and accurately. It shouldn't always be the same as the model.
              - If you use an object type that is not defined in Domain Models, please specify the contents of the object type.
              - Design the following items.
                Endpoint, Method, Request, Validation, Response, Service.Method, Description
              Repeat the iteration several times, perform appropriate refactoring, and output only the completed domain model.
              Please refer to Output Example for the output format.
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
      postProcess(result: string): string {
        // ディレクトリが無ければ掘る
        if (fs.existsSync(this.dire)) { } else { fs.mkdirSync(this.dire, { recursive: true }); console.log(`Directory ${this.dire} created.`); }
        // ファイル書き込み
        try { fs.writeFileSync(`${this.dire}API-${Utils.toPascalCase(this.boundedContext.name)}.json`, Utils.mdTrim(result)); } catch (e) { console.log(e); }
        return result;
      }
    }
    this.childStepList = Object.keys(domainModel.BoundedContexts).map(boundedContextName => new Step0030_CreateEntityChil(domainModel.BoundedContexts[boundedContextName]));
  }
  postProcess(result: string[]): string[] {
    return result;
  }
}


class Step0040_CreateService extends MultiStep {
  // 本来はドメインモデルを作るときに一緒に作ってしまいたいけどトークン長が長すぎるので分割する。
  // model = 'gpt-4';
  // dire: string = `./gen/domain-models/`;
  constructor() {
    super();
    const overview: { name: string, nickname: string, overview: string } = Utils.jsonParse(new Step0003_RequirementsToSystemOverview().result);
    const domainModel = DomainModel.loadModels();

    class Step0040_CreateServiceChil extends BaseStep {
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
              { title: `${DomainModelPattern.Entities}`, content: domainModel.getAttributeTable(DomainModelPattern.Entities, boundedContext), },
              { title: `${DomainModelPattern.ValueObjects}`, content: domainModel.getAttributeTable(DomainModelPattern.ValueObjects, boundedContext), },
              { title: `${DomainModelPattern.Aggregates}`, content: domainModel.getAttributeTable(DomainModelPattern.Aggregates, boundedContext), },
            ]
          },
          { title: `Sample Code`, content: '```java\n' + fs.readFileSync(`./gen/src/main/java/com/example/demo/service/${serviceName}.java.md`, 'utf-8') + '\n```' },
          {
            title: `Instructions`,
            contentJp: Utils.trimLines(`
              Requirements と Domain Modelsの内容を理解してSample Codeの"TODO implementation"の部分を作成してください。
              指示はあくまでガイドラインです。指示を元に想起されるノウハウを自己補完しながら進めてください。
              テストをシミュレートしてバグを取り除いてください。
              イテレーションを何度か繰り返し、適切なリファクタリングを行い、完成した実装のみを出力してください。
              出力形式は Output Example を参考にしてください。
            `),
            content: Utils.trimLines(`
              Please understand the contents of Requirements and Domain Models and implement the "TODO implementation" part of Sample Code.
              The instructions are just guidelines. Please proceed while self-completing the know-how recalled based on the instructions.
              Simulate the test and remove the bug.
              Repeat the iteration several times, perform appropriate refactoring, and output only the completed implementation.
              Please refer to Output Example for the output format.
            `),
          },
          {
            title: `Output Format`, content: Utils.trimLines(`
              \`\`\`json
              {"additionalImports": ["\${import}"], "additionalJPAMethods": ["\${repository method}"], "methods": {"\${methodName}": "\${body source code of methods, which replaces \\"TODO implementation\\" without method signature}" }}
              \`\`\`
            `),
          },
          {
            title: `Output Example`, content: Utils.trimLines(`
              \`\`\`json
              {"additionalImports": ["java.util.List"], "additionalJPAMethods": {"EntityRepository":["List<Entity> findByEntityNameAndEntityLabel(String entityName,String entityLabel)"]}, "methods": {"findAll": "        List<Entity> findAll = this.employeeRepository.findAll();\\n        return findAll;" }}
              \`\`\`
            `),
          },
        ];
      }
      preProcess(prompt: string): string {
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
    this.childStepList = Object.keys(domainModel.DomainServices).map(serviceName => new Step0040_CreateServiceChil(serviceName));
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
  }).then(() => {
    obj = new Step0030_CreateEntity();
    obj.initPrompt();
    return obj.run();
    // obj.childStepList.forEach((step) => step.postProcess(step.result));
  }).then(() => {
    obj = new Step0040_CreateService();
    obj.initPrompt();
    return obj.run();
  }).then(() => {
  }).then(() => {
  }).then(() => {
    genEntityAndRepository();
  });
}
// main();

