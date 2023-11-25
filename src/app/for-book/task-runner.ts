import * as  fs from 'fs';
import { Utils } from '../../common/utils.js';
import { BaseStep, MultiStep, StepOutputFormat } from '../../common/base-step.js';
import { ObjectModel, TreeModel } from '../for-novel/models.js';
import { GPTModels } from '../../common/openai-api-wrapper.js';

/**
 * このエージェント用の共通設定。
 * エージェントごとに設定したいデフォルト値が異なるのでrunnerの最初に書くことにした。
 */
abstract class BaseStepForBook extends BaseStep {
  agentName: string = Utils.basename(Utils.dirname(import.meta.url));
  model: GPTModels = 'gpt-4-1106-preview';
  systemMessageJa = `あなたは個人向けのテクニカルライターです。クライアントから依頼を受けて、依頼人向けにカスタマイズされた参考書を書いてください。`;
  systemMessage = `You are a technical writer for individuals. Please write a reference book customized for the client.`;
  format = StepOutputFormat.MARKDOWN;
}

const direDomainModels = `./gen/domain-models/`;
const INSTRUCTION = [{
  title: 'Client profile',
  contentJp: Utils.trimLines(`
    上級プログラマー。経験年数は以下の通り。
    - Java 10年
    - javascript/typescript 5年
    - python 3年
    - C# 半年
    - C++ 半年
  `),
  content: Utils.trimLines(`
    High level programmer. The number of years of experience is as follows.
    - Java 10 years
    - javascript/typescript 5 years
    - python 3 years
    - C# 6 months
    - C++ 6 months
  `),
},
{
  // クライアントは仕事で新たにGO言語を習得する必要があるが、GO言語の参考書は初心者向けのものが多く、専門的なものが少ない。
  // また、習熟度の高いJavaやjavascriptとの比較を交えて、GO言語の特徴を理解するための参考書が無く困っている。
  title: 'Client\'s troubles',
  contentJp: Utils.trimLines(`
    apache kafkaについて学びたい。
    ハイレベルな成果を求められているため、網羅的に、かつ高度な内容を学びたいが適切な参考書がなくて困っている。
    サンプルコードなどを交えて学習したい。
  `),
  content: Utils.trimLines(`
    I want to learn about apache kafka.
    I am looking for a reference book that explains the content in detail.
    I want to learn with sample code.
  `),
  // GO言語でメタプログラミングをしたい。
  // 内容について詳しく解説してくれる参考書が無くて困っている。
  // メタプログラミングを導入してプログラムを大量生産したい。
  // I want to do metaprogramming in GO language.
  // I don't have a reference book that explains the content in detail and I'm in trouble.
  // I want to introduce metaprogramming and mass-produce programs.
},
];

class Step0000_DrillDowner extends BaseStepForBook {
  model: GPTModels = 'gpt-4-1106-preview';;
  // model = 'gpt-3.5-turbo-16k';
  systemMessageJa = `あなたは個人向けのテクニカルライターです。クライアントから依頼を受けて、依頼人向けにカスタマイズされた参考書を書いてください。`;
  systemMessage = `You are a technical writer for individuals. Please write a reference book customized for the client.`;
  format = StepOutputFormat.JSON;
  temperature = 0.7;
  constructor() {
    super();

    this.chapters = [
      ...INSTRUCTION,
      {
        title: `Instructions`,
        contentJp: Utils.trimLines(`
          クライアントにベストな参考書を届けるために以下のステップバイステップで作業してください。
          必要であればどれだけ長大な本になっても良いです。
          - クライアントのプロフィールをよく理解して、参考書の難易度を決めてください。
          - クライアントの悩みをよく理解して、カスタマイズのポイントを列挙してください。
          - クライアントのプロフィール、悩みに合わせた最適な参考書の章を考えてください。
          - 作成した章を、より詳細に説明する項を考えてください。
          - 章、項に抜け漏れがないか、クライアントのプロフィール、悩みと突き合わせてチェックしてください。
          - 必要な情報が全て抜け漏れなく記載されているかチェックして、足りていなければ追加してください。
          上記のステップを適切ない回数繰り返して、最終的な成果物のみ出力してください。
        `),
        content: Utils.trimLines(`
          Please work step by step to deliver the best reference book to the client.
          It can be as long as necessary.
          - Please understand the client's profile well and determine the difficulty of the reference book.
          - Please understand the client's troubles well and list the points of customization.
          - Please consider the best chapter of the reference book according to the client's profile and troubles.
          - Please consider the sections that explain the created chapter in more detail.
          - Please check the chapters and sections against the client's profile and troubles to make sure there are no omissions.
          - Please check that all the necessary information is included and add it if necessary.
          Repeat the above steps as many times as necessary and output only the final result.
        `),
      }, {
        title: 'Output rules',
        contentJp: Utils.trimLines(`
          以下のJSON形式で出力してください。
          \`\`\`json
          {"title": "\${title}", "level":"\${Difficulty of reference books}","customizePoints":["\${point}"],"chapters":[{"title": "\${title}", "description": "\${description}\","sections":[{"title": "\${title}", "description": "\${description}\"}]}]}
          \`\`\`
        `),
        content: Utils.trimLines(`
          Please output in the following JSON format.
          \`\`\`json
          {"title": "\${title}", "level":"\${Difficulty of reference books}","customizePoints":["\${point}"],"chapters":[{"title": "\${title}", "description": "\${description}\","sections":[{"title": "\${title}", "description": "\${description}\"}]}]}
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
interface BookModel {
  title: string;
  level: string;
  customizePoints: string[];
  chapters: {
    title: string;
    description: string;
    sections: {
      title: string;
      description: string;
    }[];
  }[];
}
class Step0020_DrillDowner2 extends MultiStep {

  obj: BookModel;
  constructor() {
    super();

    this.obj = Utils.jsonParse(new Step0000_DrillDowner().formed);
    const obj = this.obj; // innerclass用alias

    const tableOfContent = this.obj.chapters.map((chapter, chapterIndex0) => {
      if (chapter.title.trim().match(`^${chapterIndex0 + 1}[.-_:*]`)) {
      } else {
        // 先頭が数字じゃなかったらインデックスを振る
        chapter.title = ` ${chapterIndex0 + 1}. ${chapter.title}`;
      }
      return `# ${chapter.title}\n` + chapter.sections.map((section, sectionIndex0) => {
        if (section.title.trim().match(`^${chapterIndex0 + 1}[.-_:* ]${sectionIndex0 + 1}`)) {
          // console.log(section.title.trim());
          // console.log(`^${chapterIndex0 + 1}[.-_:* ]${sectionIndex0 + 1}`);
        } else {
          // 先頭が数字じゃなかったらインデックスを振る
          section.title = `${chapterIndex0 + 1}-${sectionIndex0 + 1}. ${section.title}`;
        }
        return `## ${section.title}`
      }).join('\n')
    }).join('\n');
    class Step0020_DrillDowner2Chil extends BaseStepForBook {
      // model: GPTModels = 'gpt-4-1106-preview';;
      systemMessageJa = `あなたは個人向けのテクニカルライターです。クライアントから依頼を受けて、依頼人向けにカスタマイズされた参考書を書いてください。`;
      systemMessage = `You are a technical writer for individuals. Please write a reference book customized for the client.`;
      constructor(index: string, section: { title: string; description: string; }) {
        super();
        this.label = `Step0020_DrillDowner2Chil-${section.title}`;
        // 回答の先頭を拘束することで、フォーマットを強制するテクニック。
        this.assistantMessage = `# ${index}`;
        this.chapters = [
          ...INSTRUCTION,
          {
            title: 'Book Information', children: [
              { title: 'Title', content: obj.title },
              { title: 'Level', content: obj.level },
              { title: 'Point', content: obj.customizePoints.join('\n') },
            ]
          },
          { title: 'Table of Contents.', content: `\`\`\`markdown\n${tableOfContent}\n\`\`\`` },
          {
            title: `Instructions`,
            contentJp: Utils.trimLines(`
              クライアントのプロフィール、悩みに合わせてステップバイステップで参考書を執筆してください。
              対象は目次に示した「${section.title}」のみです。他の項は他の人が担当します。
            `),
            content: Utils.trimLines(`
              Please write the reference book step by step according to the client's profile and troubles.
              The target is only " ${section.title} " shown in the table of contents. Other items will be handled by other people.
            `),
          }, {
            title: 'Output rules',
            contentJp: Utils.trimLines(`Markdown形式で、日本語で出力してください。`),
            content: Utils.trimLines(`Please output in Markdown format. Language is Japanese.`),
          }
        ];
      }
    }

    obj.chapters.map((chapter, chapterIndex0) => {
      chapter.sections.map((sections, sectionIndex0) => {
        this.childStepList.push(new Step0020_DrillDowner2Chil(`${chapterIndex0 + 1}-${sectionIndex0 + 1}`, sections));
      });
    });
  }
  postProcess(result: string[]): string[] {
    let counter = 0;
    fs.mkdirSync(`./gen/docs/${Utils.safeFileName(this.obj.title)}`, { recursive: true });
    this.obj.chapters.map((chapter, chapterIndex0) => {
      const text = chapter.sections.map((sections, sectionIndex0) => {
        counter++;
        return result[counter - 1];
      }).join('\n\n');
      console.log(text);
      fs.writeFileSync(`./gen/docs/${Utils.safeFileName(this.obj.title)}/${Utils.safeFileName(chapter.title)}.md`, text);
    });
    return result;
  }
}

export async function main() {
  let obj;
  return Promise.resolve().then(() => {
    obj = new Step0000_DrillDowner();
    obj.initPrompt();
    return obj.run();
  }).then(() => {
    obj = new Step0020_DrillDowner2();
    obj.initPrompt();
    return obj.run();
    // obj.postProcess(obj.childStepList.map(step => step.result));
  }).then(() => {
    //   obj = new Step0030_DrillDowner();
    //   obj.initPrompt();
    //   return obj.run();
    // }).then(() => {
    //   obj = new Step0040_DrillDowner();
    //   obj.initPrompt();
    //   return obj.run();
    // }).then(() => {
    //   obj = new Step0050_DrillDowner();
    //   obj.initPrompt();
    //   return obj.run();
  }).then(() => {
  }).then(() => {
    // model();
  });
}
// main();

