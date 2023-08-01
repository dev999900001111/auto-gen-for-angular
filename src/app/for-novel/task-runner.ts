import * as  fs from 'fs';
import fss from '../common/fss';
import { Utils } from '../common/utils';
import { BaseStep, MultiStep } from "../common/base-step";
import { ObjectModel, TreeModel } from './models';

const direDomainModels = `./gen/domain-models/`;
const direSource = `./gen/src/main/java/com/example/demo/`;

class Step0000_DrillDowner extends BaseStep {
  // model = 'gpt-4';
  systemMessageJa = '熟練の編集者.';
  systemMessage = 'Skilled editor.';
  constructor() {
    super();
    this.chapters = [
      // { title: 'Target Element', content: fs.readFileSync(`./000-requirements.md`, 'utf-8') },
      { title: 'Target Element', contentJp: `小説を書くためのポイント`, content: `Points for writing a novel`, },
      {
        title: `Instructions`,
        contentJp: Utils.trimLines(`
          Target Element に提示されている要素をさらに詳細な要素に分解してください。
        `),
        content: Utils.trimLines(`
          Please break down the elements presented in Target Element into more detailed elements.
        `),
      }, {
        title: 'Output rules',
        contentJp: Utils.trimLines(`
          以下のJSON形式で出力してください。
          \`\`\`json
          {"name": "\${name}", "definition": "\${definition}", "elements":[{"name": "\${name}", "definition": "\${definition}"},]}
          \`\`\`
        `),
        content: Utils.trimLines(`
          Please output in the following JSON format.
          \`\`\`json
          {"name": "\${name}", "definition": "\${definition}", "elements":[{"name": "\${name}", "definition": "\${definition}"},]}
          \`\`\`
        `)
      }
    ];
  }
  postProcess(result: string): string {
    const obj: ObjectModel = Utils.jsonParse(result);
    console.log(obj);
    return result;
  }
}
class Step0020_DrillDowner2 extends MultiStep {

  constructor() {
    super();

    const obj: ObjectModel = Utils.jsonParse(new Step0000_DrillDowner().result);
    class Step0020_DrillDowner2Chil extends BaseStep {
      // model = 'gpt-4';
      systemMessageJa = 'ロジカルシンキングの達人';
      systemMessage = 'Logical thinking master';
      constructor(index: number) {
        super();
        this.label = `Step0020_DrillDowner2Chil-${index}-${Utils.toPascalCase(obj.elements[index].name)}`;
        this.chapters = [
          { title: 'Whole structure', content: JSON.stringify(obj) },
          { title: 'Target Element', content: obj.elements[index].name },
          {
            title: `Instructions`,
            contentJp: Utils.trimLines(`
              Target Element に提示されている要素をさらに詳細な要素に分解してください。
            `),
            content: Utils.trimLines(`
              Please break down the elements presented in Target Element into more detailed elements.
            `),
          }, {
            title: 'Output rules',
            contentJp: Utils.trimLines(`
              以下のJSON形式で出力してください。
              \`\`\`json
              {"definition": "\${definition}", "elements":[{"name": "\${name}", "definition": "\${definition}"},]}
              \`\`\`
            `),
            content: Utils.trimLines(`
              Please output in the following JSON format.
              \`\`\`json
              {"definition": "\${definition}", "elements":[{"name": "\${name}", "definition": "\${definition}"},]}
              \`\`\`
            `)
          }
        ];
      }
    }
    obj.elements.map((element, index) => {
      this.childStepList.push(new Step0020_DrillDowner2Chil(index));
    });
  }
}

class Step0030_DrillDowner extends BaseStep {
  // model = 'gpt-4';
  systemMessageJa = '熟練の小説家.';
  systemMessage = 'Skilled novelist.';
  constructor() {
    super();
    this.chapters = [
      // { title: 'Target Element', content: fs.readFileSync(`./000-requirements.md`, 'utf-8') },
      // { title: 'Target Element', contentJp: `小説を書くためのポイント`, content: `Points for writing a novel`, },
      {
        title: 'Inspiration for the novel',
        children: [
          {
            title: 'Theme',
            contentJp: '秘密の恋愛と陰謀',
            content: 'Secret love and conspiracy',
          },
          {
            title: 'Title',
            contentJp: '運命の幕開け：愛と陰謀の華麗なる舞台',
            content: 'The beginning of fate: a magnificent stage of love and conspiracy',
          },
          {
            title: 'Synopsis',
            contentJp: Utils.trimLines(`
              19世紀のパリ、オペラ座には美しいバレリーナ、エミリアがいた。彼女はオペラ座の一座のスターであり、多くの男性たちの心を虜にしていた。しかし、彼女自身は秘密の恋愛に落ちていた。
              彼女の恋人は、若き貴族のアレクサンドル。彼らはオペラ座の地下に密かな逢瀬の場所を持っていた。しかし、アレクサンドルの家族はエミリアとの関係を許さないと決めており、陰謀を巡らせていた。
              アレクサンドルの兄、ヴィクトールはエミリアとの関係を利用し、オペラ座の支配権を手に入れようとしていた。彼はオペラ座の舞台裏で秘密の集会を開き、陰謀の渦にエミリアを巻き込んでいく。
              エミリアはアレクサンドルとの愛を守るため、ヴィクトールとの戦いに身を投じる。彼女はバレエの才能を駆使して、ヴィクトールの陰謀を暴き、愛する者たちを救う決意を固める。
              壮大な舞台の上で、陰謀と愛が交錯する。エミリアは自身の才能と勇気を駆使し、運命の幕開けを迎えるのだろうか？そして、彼女とアレクサンドルの愛は試練を乗り越え、永遠のものとなるのか？
              「運命の幕開け：愛と陰謀の華麗なる舞台」は、低俗な大衆娯楽小説として、情熱的な恋愛、陰謀、ドラマチックな展開が詰まった物語です。読者を引き込み、夢中にさせるような要素を盛り込んでいます。
            `),
            content: Utils.trimLines(`
              In 19th century Paris, the Opera House had a beautiful ballerina, Emilia. She was the star of the troupe at the opera, and captivated the hearts of many men. However, she herself had fallen in love with a secret lover.
              Her lover was Alexandre, a young nobleman. They had a secret meeting place in the basement of the opera house. However, Alexandre's family was determined not to allow him to have a relationship with Emilia, and they conspired against him.
              Alexandre's brother, Victor, wanted to use his relationship with Emilia to gain control of the opera house. He holds secret meetings backstage at the opera house, and gets Emilia caught up in the intrigue.
              Emilia throws herself into battle with Viktor to protect her love for Alexandre. She is determined to use her ballet talents to uncover Viktor's plot and save those she loves.
              Intrigue and love intersect on the grand stage. Will Emilia use her own talents and courage to meet her destiny? And will her love for Alexandre survive the trials and become eternal?
              The Dawn of Destiny: A Splendid Stage of Love and Intrigue is a low-key, popular entertainment novel packed with passionate romance, intrigue, and dramatic twists and turns. It contains elements that will draw readers in and keep them hooked.
            `),
            // One day, high school student Renta Sato has a miraculous event in which he is saved from a traffic accident. When he wakes up, he finds himself in a completely different world.
            // This different world is a harsh world where monsters run rampant and people live in fear. However, Renta Sato realizes that he has the strongest power in this different world. He has obtained the power of the hero.
            // Renta Sato challenges the battle with the monsters in order to fulfill his mission. His power is immense, and he demonstrates overwhelming skills in swordsmanship and magic. In addition, he can control special abilities and summon beasts.
            // He meets his friends and together they go on an adventure, challenging the fierce battle with the Demon King. He grows in battle with formidable enemies and deepens his bonds with his friends. And in the end, he defeats the Demon King and brings peace to the different world.
            // "Reincarnated in a different world! I'm the strongest hero!" is a typical "I'm great" novel. The main character, Renta Sato, has great power and grows as he faces difficult trials. It is an adventure story that excites readers with battle scenes, bonds with friends, and sometimes harem elements.
          },
        ]
      },
      {
        title: 'Elements to be considered',
        contentJp: Utils.trimLines(`
          - 舞台設定：物語が展開する時間と場所
             - 時代背景: 物語が発生する具体的な時代や歴史的な文脈
             - 地理的な位置: 物語が展開する物理的な場所や場所
             - 文化的な文脈: 物語の社会的、政治的、文化的な環境
             - 雰囲気: 舞台設定の全体的なムードや感情的なトーン
             - ワールドビルディング: 詳細で信じられる世界を作り上げるプロセス。その歴史、ルール、独特な特徴などを含む
             - イメージリー: 描写的な言語を使用して、読者の心に舞台設定の鮮明なイメージを作り出す
          - プロット：物語の出来事の連続と、それらが物語の中で展開する方法
             - エクスポジション：物語の舞台設定、キャラクター、初期状況の紹介
             - 発端：物語を動かし、主な衝突を紹介する出来事
             - 盛り上がり：緊張を高め、衝突を発展させる出来事の連続
             - クライマックス：物語の転換点で、主人公が直接衝突に直面する場面
             - 下降：クライマックスに続く出来事で、解決につながる
             - 解決：物語の結末で、衝突が解決し、緩みが解消される
             - サブプロット：メインプロットと並行して走る二次的なストーリーラインで、物語に深みを加える
             - 伏線：物語の将来の出来事についてのヒントや手がかり
             - フラッシュバック：背景情報や文脈を提供するために、過去の出来事を描写する場面
             - プロットの転換：物語の方向を変える予期せぬ出来事や暴露
          - キャラクター：物語全体を通じて、個性的で複雑なキャラクターを作り上げ、彼らの変化を描くプロセス
             - キャラクターのバックストーリー：キャラクターの人格や動機に影響を与える、キャラクターの歴史や経験
             - キャラクターの動機：キャラクターの行動や決定の背後にある動機
             - キャラクターの成長：物語全体を通じて、キャラクターの人格、信念、関係性が進化する
             - キャラクターの関係：キャラクター同士のつながりや相互作用で、キャラクターの発達に影響を与える
             - キャラクターの特徴：キャラクターの人格を定義する、ユニークな質、習慣、行動
             - キャラクターの外見：キャラクターの外見的な特徴やスタイルで、全体的なイメージに貢献する
             - キャラクターの対話：キャラクターが話したり、コミュニケーションしたりする方法で、人格や背景を反映する
             - キャラクターの行動：キャラクターの選択や行動で、人格や動機を示す
             - キャラクターの強みと弱み：キャラクターの人格のポジティブな側面とネガティブな側面で、バランスの取れた、現実的な描写を作り出す
             - キャラクターの衝突：キャラクターが直面する内的、外的な葛藤で、成長と発達に貢献する
        `),
        content: Utils.trimLines(`
          - Setting:: The time and place in which the story takes place
             - Time period: The specific era or historical context in which the story occurs
             - Geographical location: The physical place or places where the story takes place
             - Cultural context: The social, political, and cultural environment of the story
             - Atmosphere: The overall mood or emotional tone of the setting
             - World-building: The process of creating a detailed and believable fictional world, including its history, rules, and unique characteristics
             - Imagery: The use of descriptive language to create vivid images of the setting in the reader's mind
          - Plot development: The sequence of events and the way they unfold in the story
             - Exposition: The introduction of the story's setting, characters, and initial situation
             - Inciting incident: "The event that sets the story in motion and introduces the main conflict
             - Rising action: The series of events that build tension and develop the conflict
             - Climax: The turning point of the story, where the main character faces the conflict directly
             - Falling action: The events that follow the climax and lead to the resolution
             - Resolution: The conclusion of the story, where the conflict is resolved and loose ends are tied up
             - Subplots: Secondary storylines that run parallel to the main plot and add depth to the story
             - Foreshadowing: Hints or clues about future events in the story
             - Flashbacks: Scenes that depict events from the past to provide background information or context
             - Plot twists: Unexpected events or revelations that change the direction of the story
          - Character development: The process of creating well-rounded, complex characters with distinct personalities and growth throughout the story
             - Character backstory: The character's history and experiences that shape their personality and motivations
             - Character motivation: The driving force behind a character's actions and decisions
             - Character growth: The evolution of a character's personality, beliefs, and relationships throughout the story
             - Character relationships: The connections and interactions between characters that influence their development
             - Character traits: The unique qualities, habits, and behaviors that define a character's personality
             - Character appearance: The physical attributes and style of a character that contribute to their overall image
             - Character dialogue: The way a character speaks and communicates, reflecting their personality and background
             - Character actions: The choices and behaviors of a character that demonstrate their personality and motivations
             - Character strengths and weaknesses: The positive and negative aspects of a character's personality that create a balanced, realistic portrayal
             - Character conflict: The internal and external struggles a character faces that contribute to their growth and development
        `),
      },
      {
        title: `Instructions`,
        contentJp: Utils.trimLines(`
          Inspiration for the novel に書かれた内容を膨らませて物語を作成していきます。
          Elements to be considered に書かれた分類で物語の要素を整理し、それぞれの要素について考えていきます。
          あなたは舞台設定の担当です。（プロットやキャラクターなどの他の要素は別の人が担当します。）
          以下の注意点に従って、ステップバイステップで物語の舞台設定を考えてください。
          - 設定は可能な限り詳細に書いて下さい。
          - 可能な限り多くの設定を詳細に、リアリティをもって考えてください。以下の質問を参考にしてもよいです。
            - 地理、時代、社会、文化、政治、経済、宗教、歴史、人々、生態系、気候、天候、地形、動植物、ファッション、建物、建造物、交通、言語、教育、科学、技術、芸術、娯楽、スポーツ、食べ物、飲み物、医療、軍事、法律、政府、組織、企業、家族、友人、恋人、結婚、、等々、
          - 作成した設定のうち、物語を形成するのにふさわしいもののみを選択してください。特徴的でないものまで挙げる必要はありません。
          - 設定を作成したら、それぞれに矛盾する内容が無いかをチェックしてください。
          以上のサイクルを数回繰り返して精度を高めた後、最終的に作成した物語の舞台設定のみを出力してください。
        `),
        content: Utils.trimLines(`
          Expand the contents written in Inspiration for the novel and create a story.
          Organize the elements of the story according to the classification written in Elements to be considered, and think about each element.
          You are in charge of the setting. (Other elements such as plot and character are handled by other people.)
          Please think about the setting of the story step by step according to the following points.
          - Please write the setting in as much detail as possible.
          - Please think about as many settings as possible in detail and with realism. You can refer to the following questions.
            - Geography, era, society, culture, politics, economy, religion, history, people, ecosystem, climate, weather, terrain, flora and fauna, fashion, buildings, structures, transportation, language, education, science, technology, art, entertainment, sports, food, drink, medicine, military, law, government, organizations, companies, family, friends, lovers, marriage, etc.
          - Of the settings you have created, please select only those that are appropriate to form the story. You don't need to list everything that is not characteristic.
          - After creating the settings, check to make sure there are no conflicting contents for each of them.
          After repeating the above cycle several times to improve the accuracy, please output only the settings of the story you have created.
        `),
      }, {
        title: 'Output rules',
        contentJp: Utils.trimLines(`
          以下のJSON形式で出力してください。
          \`\`\`json
          {"name": "\${name}", "definition": "\${definition}", "elements":[{"name": "\${name}", "definition": "\${definition}"},]}
          \`\`\`
        `),
        content: Utils.trimLines(`
          Please output in the following JSON format.
          \`\`\`json
          {"name": "\${name}", "definition": "\${definition}", "elements":[{"name": "\${name}", "definition": "\${definition}"},]}
          \`\`\`
        `)
      }
    ];
  }
  postProcess(result: string): string {
    const obj: ObjectModel = Utils.jsonParse(result);
    fss.writeFileSync(`${direDomainModels}${Utils.toPascalCase(obj.name)}.java`, result);
    console.log(obj);
    return result;
  }
}


class Step0040_DrillDowner extends MultiStep {
  // model = 'gpt-4';
  systemMessageJa = '熟練の小説家.';
  systemMessage = 'Skilled novelist.';
  constructor() {
    super();
    const setting: ObjectModel = Utils.jsonParse(new Step0030_DrillDowner().result);


    class Step0040_DrillDownerChil extends BaseStep {
      systemMessageJa = '熟練の小説家.';
      systemMessage = 'Skilled novelist.';
      constructor(private obj: ObjectModel) {
        super();

        this.label = `Step0040_DrillDownerChil-${Utils.toPascalCase(obj.name)}`;

        this.chapters = [
          // { title: 'Target Element', content: fs.readFileSync(`./000-requirements.md`, 'utf-8') },
          // { title: 'Target Element', contentJp: `小説を書くためのポイント`, content: `Points for writing a novel`, },
          {
            title: 'Inspiration for the novel',
            children: [
              {
                title: 'Theme',
                contentJp: '秘密の恋愛と陰謀',
                content: 'Secret love and conspiracy',
              },
              {
                title: 'Title',
                contentJp: '運命の幕開け：愛と陰謀の華麗なる舞台',
                content: 'The beginning of fate: a magnificent stage of love and conspiracy',
              },
              {
                title: 'Synopsis',
                contentJp: Utils.trimLines(`
                  19世紀のパリ、オペラ座には美しいバレリーナ、エミリアがいた。彼女はオペラ座の一座のスターであり、多くの男性たちの心を虜にしていた。しかし、彼女自身は秘密の恋愛に落ちていた。
                  彼女の恋人は、若き貴族のアレクサンドル。彼らはオペラ座の地下に密かな逢瀬の場所を持っていた。しかし、アレクサンドルの家族はエミリアとの関係を許さないと決めており、陰謀を巡らせていた。
                  アレクサンドルの兄、ヴィクトールはエミリアとの関係を利用し、オペラ座の支配権を手に入れようとしていた。彼はオペラ座の舞台裏で秘密の集会を開き、陰謀の渦にエミリアを巻き込んでいく。
                  エミリアはアレクサンドルとの愛を守るため、ヴィクトールとの戦いに身を投じる。彼女はバレエの才能を駆使して、ヴィクトールの陰謀を暴き、愛する者たちを救う決意を固める。
                  壮大な舞台の上で、陰謀と愛が交錯する。エミリアは自身の才能と勇気を駆使し、運命の幕開けを迎えるのだろうか？そして、彼女とアレクサンドルの愛は試練を乗り越え、永遠のものとなるのか？
                  「運命の幕開け：愛と陰謀の華麗なる舞台」は、低俗な大衆娯楽小説として、情熱的な恋愛、陰謀、ドラマチックな展開が詰まった物語です。読者を引き込み、夢中にさせるような要素を盛り込んでいます。
                `),
                content: Utils.trimLines(`
                  In 19th century Paris, the Opera House had a beautiful ballerina, Emilia. She was the star of the troupe at the opera, and captivated the hearts of many men. However, she herself had fallen in love with a secret lover.
                  Her lover was Alexandre, a young nobleman. They had a secret meeting place in the basement of the opera house. However, Alexandre's family was determined not to allow him to have a relationship with Emilia, and they conspired against him.
                  Alexandre's brother, Victor, wanted to use his relationship with Emilia to gain control of the opera house. He holds secret meetings backstage at the opera house, and gets Emilia caught up in the intrigue.
                  Emilia throws herself into battle with Viktor to protect her love for Alexandre. She is determined to use her ballet talents to uncover Viktor's plot and save those she loves.
                  Intrigue and love intersect on the grand stage. Will Emilia use her own talents and courage to meet her destiny? And will her love for Alexandre survive the trials and become eternal?
                  The Dawn of Destiny: A Splendid Stage of Love and Intrigue is a low-key, popular entertainment novel packed with passionate romance, intrigue, and dramatic twists and turns. It contains elements that will draw readers in and keep them hooked.
                `),
                // One day, high school student Renta Sato has a miraculous event in which he is saved from a traffic accident. When he wakes up, he finds himself in a completely different world.
                // This different world is a harsh world where monsters run rampant and people live in fear. However, Renta Sato realizes that he has the strongest power in this different world. He has obtained the power of the hero.
                // Renta Sato challenges the battle with the monsters in order to fulfill his mission. His power is immense, and he demonstrates overwhelming skills in swordsmanship and magic. In addition, he can control special abilities and summon beasts.
                // He meets his friends and together they go on an adventure, challenging the fierce battle with the Demon King. He grows in battle with formidable enemies and deepens his bonds with his friends. And in the end, he defeats the Demon King and brings peace to the different world.
                // "Reincarnated in a different world! I'm the strongest hero!" is a typical "I'm great" novel. The main character, Renta Sato, has great power and grows as he faces difficult trials. It is an adventure story that excites readers with battle scenes, bonds with friends, and sometimes harem elements.
              },
              {
                title: 'Setting',
                content: `${setting.name}: ${setting.definition}`,
                children: setting.elements.map((element) => ({ title: element.name, content: element.definition, }))
              }
            ]
          },
          {
            title: 'Elements to be considered',
            contentJp: Utils.trimLines(`
              - 舞台設定：物語が展開する時間と場所
                 - 時代背景: 物語が発生する具体的な時代や歴史的な文脈
                 - 地理的な位置: 物語が展開する物理的な場所や場所
                 - 文化的な文脈: 物語の社会的、政治的、文化的な環境
                 - 雰囲気: 舞台設定の全体的なムードや感情的なトーン
                 - ワールドビルディング: 詳細で信じられる世界を作り上げるプロセス。その歴史、ルール、独特な特徴などを含む
                 - イメージリー: 描写的な言語を使用して、読者の心に舞台設定の鮮明なイメージを作り出す
              - プロット：物語の出来事の連続と、それらが物語の中で展開する方法
                 - エクスポジション：物語の舞台設定、キャラクター、初期状況の紹介
                 - 発端：物語を動かし、主な衝突を紹介する出来事
                 - 盛り上がり：緊張を高め、衝突を発展させる出来事の連続
                 - クライマックス：物語の転換点で、主人公が直接衝突に直面する場面
                 - 下降：クライマックスに続く出来事で、解決につながる
                 - 解決：物語の結末で、衝突が解決し、緩みが解消される
                 - サブプロット：メインプロットと並行して走る二次的なストーリーラインで、物語に深みを加える
                 - 伏線：物語の将来の出来事についてのヒントや手がかり
                 - フラッシュバック：背景情報や文脈を提供するために、過去の出来事を描写する場面
                 - プロットの転換：物語の方向を変える予期せぬ出来事や暴露
              - キャラクター：物語全体を通じて、個性的で複雑なキャラクターを作り上げ、彼らの変化を描くプロセス
                 - キャラクターのバックストーリー：キャラクターの人格や動機に影響を与える、キャラクターの歴史や経験
                 - キャラクターの動機：キャラクターの行動や決定の背後にある動機
                 - キャラクターの成長：物語全体を通じて、キャラクターの人格、信念、関係性が進化する
                 - キャラクターの関係：キャラクター同士のつながりや相互作用で、キャラクターの発達に影響を与える
                 - キャラクターの特徴：キャラクターの人格を定義する、ユニークな質、習慣、行動
                 - キャラクターの外見：キャラクターの外見的な特徴やスタイルで、全体的なイメージに貢献する
                 - キャラクターの対話：キャラクターが話したり、コミュニケーションしたりする方法で、人格や背景を反映する
                 - キャラクターの行動：キャラクターの選択や行動で、人格や動機を示す
                 - キャラクターの強みと弱み：キャラクターの人格のポジティブな側面とネガティブな側面で、バランスの取れた、現実的な描写を作り出す
                 - キャラクターの衝突：キャラクターが直面する内的、外的な葛藤で、成長と発達に貢献する
            `),
            content: Utils.trimLines(`
              - Setting:: The time and place in which the story takes place
                 - Time period: The specific era or historical context in which the story occurs
                 - Geographical location: The physical place or places where the story takes place
                 - Cultural context: The social, political, and cultural environment of the story
                 - Atmosphere: The overall mood or emotional tone of the setting
                 - World-building: The process of creating a detailed and believable fictional world, including its history, rules, and unique characteristics
                 - Imagery: The use of descriptive language to create vivid images of the setting in the reader's mind
              - Plot development: The sequence of events and the way they unfold in the story
                 - Exposition: The introduction of the story's setting, characters, and initial situation
                 - Inciting incident: "The event that sets the story in motion and introduces the main conflict
                 - Rising action: The series of events that build tension and develop the conflict
                 - Climax: The turning point of the story, where the main character faces the conflict directly
                 - Falling action: The events that follow the climax and lead to the resolution
                 - Resolution: The conclusion of the story, where the conflict is resolved and loose ends are tied up
                 - Subplots: Secondary storylines that run parallel to the main plot and add depth to the story
                 - Foreshadowing: Hints or clues about future events in the story
                 - Flashbacks: Scenes that depict events from the past to provide background information or context
                 - Plot twists: Unexpected events or revelations that change the direction of the story
              - Character development: The process of creating well-rounded, complex characters with distinct personalities and growth throughout the story
                 - Character backstory: The character's history and experiences that shape their personality and motivations
                 - Character motivation: The driving force behind a character's actions and decisions
                 - Character growth: The evolution of a character's personality, beliefs, and relationships throughout the story
                 - Character relationships: The connections and interactions between characters that influence their development
                 - Character traits: The unique qualities, habits, and behaviors that define a character's personality
                 - Character appearance: The physical attributes and style of a character that contribute to their overall image
                 - Character dialogue: The way a character speaks and communicates, reflecting their personality and background
                 - Character actions: The choices and behaviors of a character that demonstrate their personality and motivations
                 - Character strengths and weaknesses: The positive and negative aspects of a character's personality that create a balanced, realistic portrayal
                 - Character conflict: The internal and external struggles a character faces that contribute to their growth and development
            `),
          },
          {
            title: `Instructions`,
            contentJp: Utils.trimLines(`
              Inspiration for the novel に書かれた内容を膨らませて物語を作成していきます。
              あなたは舞台設定の担当で、のSettingも先程あなたが書いたものです。（プロットやキャラクターなどの他の要素は別の人が担当します。）
              先程書いてくれたGeographyの部分について、より詳細に考えて下さい。
              - 設定は可能な限り詳細に書いて下さい。
              - 可能な限り多くの設定を詳細に、リアリティをもって考えてください。
              - 作成した設定のうち、物語を形成するのにふさわしいもののみを選択してください。特徴的でないものまで挙げる必要はありません。
              - 設定を作成したら、それぞれに矛盾する内容が無いかをチェックしてください。
              以上のサイクルを数回繰り返して精度を高めた後、最終的に作成した${obj.name}のみを出力してください。
            `),
            content: Utils.trimLines(`
              Expand the contents written in Inspiration for the novel and create a story.
              You are in charge of the setting, and the Setting is what you wrote earlier. (Other elements such as plot and character are handled by other people.)
              Please think about the Geography you wrote earlier in more detail.
              - Please write the setting in as much detail as possible.
              - Please think about as many settings as possible in detail and with realism.
              - Of the settings you have created, please select only those that are appropriate to form the story. You don't need to list everything that is not characteristic.
              - After creating the settings, check to make sure there are no conflicting contents for each of them.
              After repeating the above cycle several times to improve the accuracy, please output only the ${obj.name} you have created.
            `),
          }, {
            title: 'Output rules',
            contentJp: Utils.trimLines(`
              以下のJSON形式で出力してください。
              \`\`\`json
              {"name": "\${name}", "definition": "\${definition}", "elements":[{"name": "\${name}", "definition": "\${definition}"},]}
              \`\`\`
            `),
            content: Utils.trimLines(`
              Please output in the following JSON format.
              \`\`\`json
              {"name": "\${name}", "definition": "\${definition}", "elements":[{"name": "\${name}", "definition": "\${definition}"},]}
              \`\`\`
            `)
          }
        ];

      }
      postProcess(result: string): string {
        fss.writeFileSync(`${direDomainModels}${Utils.toPascalCase(this.obj.name)}.json`, result);
        const obj: ObjectModel = Utils.jsonParse(result);
        console.log(obj);
        return result;
      }
    }
    this.childStepList = setting.elements.map((element) => new Step0040_DrillDownerChil(element));
  }
}

class Step0050_DrillDowner extends BaseStep {
  // model = 'gpt-4';
  systemMessageJa = '熟練の小説家.';
  systemMessage = 'Skilled novelist.';
  temperature: number = 0.7;
  constructor() {
    super();
    this.chapters = [
      {
        title: 'Inspiration for the novel',
        children: [
          { title: 'Theme', contentJp: '秘密の恋愛と陰謀', content: 'Secret love and conspiracy', },
          { title: 'Title', contentJp: '運命の幕開け：愛と陰謀の華麗なる舞台', content: 'The beginning of fate: a magnificent stage of love and conspiracy', },
          {
            title: 'Synopsis',
            contentJp: Utils.trimLines(`
              19世紀のパリ、オペラ座には美しいバレリーナ、エミリアがいた。彼女はオペラ座の一座のスターであり、多くの男性たちの心を虜にしていた。しかし、彼女自身は秘密の恋愛に落ちていた。
              彼女の恋人は、若き貴族のアレクサンドル。彼らはオペラ座の地下に密かな逢瀬の場所を持っていた。しかし、アレクサンドルの家族はエミリアとの関係を許さないと決めており、陰謀を巡らせていた。
              アレクサンドルの兄、ヴィクトールはエミリアとの関係を利用し、オペラ座の支配権を手に入れようとしていた。彼はオペラ座の舞台裏で秘密の集会を開き、陰謀の渦にエミリアを巻き込んでいく。
              エミリアはアレクサンドルとの愛を守るため、ヴィクトールとの戦いに身を投じる。彼女はバレエの才能を駆使して、ヴィクトールの陰謀を暴き、愛する者たちを救う決意を固める。
              壮大な舞台の上で、陰謀と愛が交錯する。エミリアは自身の才能と勇気を駆使し、運命の幕開けを迎えるのだろうか？そして、彼女とアレクサンドルの愛は試練を乗り越え、永遠のものとなるのか？
              「運命の幕開け：愛と陰謀の華麗なる舞台」は、低俗な大衆娯楽小説として、情熱的な恋愛、陰謀、ドラマチックな展開が詰まった物語です。読者を引き込み、夢中にさせるような要素を盛り込んでいます。
            `),
            content: Utils.trimLines(`
              In 19th century Paris, the Opera House had a beautiful ballerina, Emilia. She was the star of the troupe at the opera, and captivated the hearts of many men. However, she herself had fallen in love with a secret lover.
              Her lover was Alexandre, a young nobleman. They had a secret meeting place in the basement of the opera house. However, Alexandre's family was determined not to allow him to have a relationship with Emilia, and they conspired against him.
              Alexandre's brother, Victor, wanted to use his relationship with Emilia to gain control of the opera house. He holds secret meetings backstage at the opera house, and gets Emilia caught up in the intrigue.
              Emilia throws herself into battle with Viktor to protect her love for Alexandre. She is determined to use her ballet talents to uncover Viktor's plot and save those she loves.
              Intrigue and love intersect on the grand stage. Will Emilia use her own talents and courage to meet her destiny? And will her love for Alexandre survive the trials and become eternal?
              The Dawn of Destiny: A Splendid Stage of Love and Intrigue is a low-key, popular entertainment novel packed with passionate romance, intrigue, and dramatic twists and turns. It contains elements that will draw readers in and keep them hooked.
            `),
          },
        ]
      },
      {
        title: `Instructions`,
        contentJp: Utils.trimLines(`
          Inspiration for the novel に書かれた内容を膨らませて物語を作成していきます。
          この小説を書くに当たって、この物語独特なものとして重点的に作りこむべき要素を列挙してください。
        `),
        content: Utils.trimLines(`
          Expand the contents written in Inspiration for the novel and create a story.
          Please list the elements that should be emphasized as unique to this story when writing this novel.
        `),
      }, {
        title: 'Output rules',
        contentJp: Utils.trimLines(`
          以下のJSON形式で出力してください。日本語で出力してください。
          \`\`\`json
          {"name": "\${name}", "definition": "\${definition}", "elements":[{"name": "\${name}", "definition": "\${definition}"},]}
          \`\`\`
        `),
        content: Utils.trimLines(`
          Please output in the following JSON format. Please output in Japanese.
          \`\`\`json
          {"name": "\${name}", "definition": "\${definition}", "elements":[{"name": "\${name}", "definition": "\${definition}"},]}
          \`\`\`
        `)
      }
    ];
  }
  postProcess(result: string): string {
    const obj: ObjectModel = Utils.jsonParse(result);
    fss.writeFileSync(`${direDomainModels}${Utils.toPascalCase(obj.name)}.json`, result);
    console.log(obj);
    return result;
  }
}



function model() {
  const obj: ObjectModel = Utils.jsonParse(new Step0000_DrillDowner().result);
  console.log(`# ${obj.name}`);
  console.log(`${obj.definition}`);
  const tree: TreeModel = new TreeModel(obj.definition);
  new Step0020_DrillDowner2().childStepList.map((childStep, index) => {
    const obj2: ObjectModel = Utils.jsonParse(childStep.result);
    // obj.elements[index].elements = obj2.elements;
    const tree2 = new TreeModel(obj2.definition);
    tree2.children = obj2.elements.reduce((acc, cur) => {
      acc[cur.name] = new TreeModel(cur.definition);
      return acc;
    }, {} as any);
    tree.children[obj.elements[index].name] = tree2;


    console.log(`\n## ${obj.elements[index].name}`);
    console.log(`${obj.elements[index].definition}`);
    obj2.elements.map((element, index) => {
      console.log(`- ${element.name}`);
      console.log(`  ${element.definition}`);
    });

    // console.log(`### ${obj.elements[index].name}の要素`);

  });
  // console.log(JSON.stringify(tree, null, 2));
  // obj.elements.map((element, index) => {
  //   new Step0020_DrillDowner2Chil(index);
  //   Utils.toPascalCase(element.name);
  //   console.log(element);
  // });
}

export async function main() {
  let obj;
  return Promise.resolve().then(() => {
    // obj = new Step0000_DrillDowner();
    // obj.initPrompt();
    // return obj.run();
  }).then(() => {
    // obj = new Step0020_DrillDowner2();
    // obj.initPrompt();
    // return obj.run();
    // }).then(() => {
    //   obj = new Step0030_DrillDowner();
    //   obj.initPrompt();
    //   return obj.run();
    // }).then(() => {
    //   obj = new Step0040_DrillDowner();
    //   obj.initPrompt();
    //   return obj.run();
  }).then(() => {
    obj = new Step0050_DrillDowner();
    obj.initPrompt();
    return obj.run();
  }).then(() => {
  }).then(() => {
    // model();
  });
}
// main();

