import * as  fs from 'fs';
import { Utils } from './utils';
import { BaseStep, MultiRunner } from "./base-step";
import { RepoSyncer } from './repo-syncer';
// import { GenModuleFiles, genIndex } from './gen-angular-modules';
import { genIndex } from './react-service';
import { ReactCodeGenerator } from './react-service';
class Step0000_RequirementsToComponentList extends BaseStep {
  model = 'gpt-4';
  constructor() {
    super();
    this.chapters = [
      { title: 'requirements', content: fs.readFileSync(`./000-requirements.md`, 'utf-8') },
      {
        title: 'prompt', content: Utils.trimLines(`
          - As a UI/UX designer, design a list of screens based on a good understanding of the requirements definition.
          - Design only under MAIN_ROUTER.
          - If multiple patterns of design are possible, please select the simplest pattern.
          - The list should be reviewed by professionals such as UI/UX designers, security specialists, business analysts, database specialists, strict consistency checker, etc., and an improved version should be presented with their input.(the strict consistency checker checks in detail whether the requirements definition is consistent with the list of screens.)
          Only the system overview and the completed list of screens and their components should be output.
          Output the list of completed screens and their components as a list.
          For each screen, please specify the data to be handled, the screen transition destination, and the modals to be used, and screen description.Output in the following format.
          <ROOT_ROUTER>
            <PUBLIC_SCREEN>
              <ROUTER>
                <LOGIN/>
                ...
              </ROUTER>
            </PUBLIC_SCREEN>
            <PRIVATE_SCREEN/>
              <HEADER/>
              <SIDENAVI/>
              <MAIN>
                <MAIN_ROUTER>
                  <SCREEN_NAME/>
                  <SCREEN_NAME/>
                  <SCREEN_NAME/>
                  ...
                </MAIN_ROUTER>
              </MAIN>
              <FOOTER/>
            </PRIVATE_SCREEN>
          </ROOT_ROUTER>
        `)
      },
    ];
  }
}

class Step0010_ComponentList_to_ReactComponentList extends BaseStep {
  model = 'gpt-4';
  constructor() {
    super();
    this.chapters = [
      { title: 'requirements', content: fs.readFileSync(`./000-requirements.md`, 'utf-8') },
      { title: 'componentList', content: new Step0000_RequirementsToComponentList().result },
      {
        title: 'prompt', content: Utils.trimLines(`
          After familiarizing yourself with the instructions up to this point, list all the React components you will need for this system.
          - Please use Chakra UI.
          - Design only under MAIN_ROUTER.
          - Please classify the components into page, parts, and modal.
          - If multiple patterns of design are possible, please select the simplest pattern.
          - For pages, please set the path. For other types, the path is not required.
          - Please also clearly indicate the I/O of components such as props, Don't forget to write the type, and generic type.
          - Indicate explicitly the parent-child relationship between components.
          - Please specify the state to be held by the component.
          - The component list should be reviewed by professionals such as UI/UX designers, security specialists, business analysts, strict consistency checker,  etc., and an improved version should be presented with their input (strict consistency checkers should strictly check for consistency between the screen list and component list).
          Output only the Improved React components List(after review).
          Explicitly describe the type (pages, parts, modals), component name, path, child react components, props, state, and screen description in a tabular format(Do not add extra space.).
        `)
      },
    ];
  }
}

class Step0020_ReactComponentList_to_ReactComponentJson extends BaseStep {
  constructor() {
    super();
    this.chapters = [
      { title: 'React Components List', content: new Step0010_ComponentList_to_ReactComponentList().result },
      {
        title: 'prompt', content: Utils.trimLines(`
          Please convert the above design of React components to the following format. 
          {"\${ComponentName}": {"type": "page, parts, modal","path":"\${path}","props": {{"\${varName}": "\${varType}"},"state": {{"\${varName}": "\${varType}"},,},},"childReactComponents":["\${childComponentName}"], "modalReactComponents":["\${modalComponentName}"], "HTMLComponents": ["\${htmlComponentName}}"], "describe":"describe"}}
          Be careful to convert all components to JSON correctly.
          Note that it is minified JSON without line breaks and spaces(Do not add extra space.).
        `)
      },
    ];
  }
}

class Step0030_requirements_to_systemOverview extends BaseStep {
  constructor() {
    super();
    this.chapters = [
      { title: 'requirements', content: fs.readFileSync(`./000-requirements.md`, 'utf-8') },
      {
        title: 'prompt', content: Utils.trimLines(`
          Please familiarize yourself with the above requirements document and express it in simple sentences as a system overview.
        `)
      },
    ];
  }
}

class Step0040_makeReactService extends BaseStep {
  model = 'gpt-4';
  constructor() {
    super();
    this.chapters = [
      // { title: 'System Overview', content: new Step0030_requirements_to_systemOverview().result },
      { title: 'Requirements', content: fs.readFileSync(`./000-requirements.md`, 'utf-8') },
      { title: 'Component List', content: Utils.spaceNormalize(new Step0000_RequirementsToComponentList().result) },
      { title: 'React Component List', content: Utils.spaceNormalize(new Step0010_ComponentList_to_ReactComponentList().result) },
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
      // { title: 'Component List', content: new Step0000_RequirementsToComponentList().result },
      { title: 'React Component List', content: new Step0010_ComponentList_to_ReactComponentList().result },
        { title: 'React Service List', content: new Step0040_makeReactService().result },
      {
        title: 'prompt', content: Utils.trimLines(`
          Let's think step by step.
          - 上記の設計書を元に、全てのモデルクラス(request,response含む)の名前を抽出してください。
          - 似ている名前でも異なるものがあることに注意して、モデルクラスの取りこぼしが無いか確認してください。
          - 抽出したモデルクラスについて、画面上で使用する項目以外に必要な項目を全て含めてください。
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
          - 全てのモデルクラスについて、項目と型を漏れなく定義してください（filter等も含めて）。
          - 項目のバリデーションについても記載してください。
          - The Model Classes should be reviewed by experts such as UI/UX designers, security specialists, business analysts, consistency checkers, etc., and an improved version should be presented that incorporates their input (consistency checkers strictly check whether the Model Classes reflects all previous designs).
          Only the list of improved Model classes, Enums,  Validation Rules (tabular format, without extra space.) is output.
        `)
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
      // { title: 'React Component List', content: new Step0010_ComponentList_to_ReactComponentList().result },
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
      // { title: 'React Component List', content: new Step0010_ComponentList_to_ReactComponentList().result },
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
    this.label = `Step0102_${index}-createJSONdata`;
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
      { title: 'Component List', content: new Step0000_RequirementsToComponentList().result },
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
    this.label = `Step0120_${index}-makeScreenSpec-${componentName}`;

    const g: any = {};
    const ngUiList = Utils.spaceNormalize(new Step0010_ComponentList_to_ReactComponentList().result);
    const systemOverview = new Step0030_requirements_to_systemOverview().result;
    const serviceListJSON = new Step0080_makeReactServiceJson().result;
    g.services = Utils.jsonParse(serviceListJSON.replace(/```/g, '').trim());
    const serviceString = Object.keys(g.services).map(key => ` - ${key}: ${g.services[key].methods.map((method: any) => method.name + '(' + method.params.map((kv: { name: string, type: string }) => kv.name + ': ' + kv.type).join(', ') + '): ' + method.return).join(', ')}`).join('\n');
    const modelJSON = new Step0065_ReactModelList_to_Json().result;
    g.models = Utils.jsonParse(modelJSON.replace(/```/g, '').trim());
    // console.log(g.models);
    const modelString = Object.keys(g.models).filter(key => g.models[key].props).map(key => ` - ${key}(${Object.keys(g.models[key].props).map(propKey => propKey + ': ' + g.models[key].props[propKey]).join(', ')})`).join('\n');
    const enumString = Object.keys(g.models).filter(key => g.models[key].values).map(key => ` - ${key}: ${g.models[key].values.map((value: string) => '"' + value + '"').join(' | ')}`).join('\n');

    const io = ['props'].map(io => Object.keys(ngUiJSON[componentName][io] || {}).filter(key => key.trim() !== '-').map(key => `- ${key}: ${ngUiJSON[componentName][io][key]}`).join('\n'));
    this.chapters = [
      { title: 'System Overview', content: systemOverview },
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
          ## Screen behavior
          ## Input Form
          ## Error messages
          ## Model classes used (excluding use from child components)
          ## Service classes and methods used (excluding calls from child components)
          \`\`\`
        `)
      }
    ];
  }
  static genSteps() {
    const ngUiJSON = Utils.jsonParse<any>(new Step0020_ReactComponentList_to_ReactComponentJson().result.replace(/{"": ""}/g, 'null'));
    filterByComponentName(ngUiJSON);
    return Object.keys(ngUiJSON).map((componentName, index) => new Step0120_makeScreenSpec(index, componentName, ngUiJSON));
  }
}

class Step0130_makeScreenSpecJSON extends BaseStep {
  constructor(index: number, componentName: string, ngUiJSON: any) {
    super();
    this.label = `Step0130_${index}-makeScreenSpecJSON-${componentName}`;
    this.chapters = [
      { title: '', content: new Step0120_makeScreenSpec(index, componentName, ngUiJSON).result },
      {
        title: 'prompt', content: Utils.trimLines(`
          Please convert the above List of Screensn into JSON format.
          {"modelClassesUsed":[\${Model class used}], "serviceClassesUsed":[\${Service class used}]]}
          * Models and Services shall be by name only List.
          Note that this is minified JSON without newlines and spaces(Do not add extra space.).
        `)
      },
    ];
  }
  static genSteps() {
    const g: any = {};
    const ngUiJSON = Utils.jsonParse<any>(new Step0020_ReactComponentList_to_ReactComponentJson().result);
    filterByComponentName(ngUiJSON);
    const serviceListJSON = new Step0080_makeReactServiceJson().result;
    g.services = Utils.jsonParse(serviceListJSON.replace(/```/g, '').trim());
    const modelJSON = new Step0065_ReactModelList_to_Json().result;
    g.models = Utils.jsonParse(modelJSON.replace(/```/g, '').trim());
    return Object.keys(ngUiJSON).map((componentName, index) => new Step0130_makeScreenSpecJSON(index, componentName, ngUiJSON));
  }
}
function filterByComponentName(ngUiJSON: any) {
  return ['childReactComponents'].forEach((prop: string) => { Object.keys(ngUiJSON).forEach(compName => { ngUiJSON[compName][prop] = ngUiJSON[compName][prop].filter((chilName: string) => Object.keys(ngUiJSON).includes(chilName) && !['RouterOutlet', 'HTMLComponents', 'describe'].includes(chilName)); }); });
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
    this.label = `Step0140_${index}-makeScreen-${componentName}`;

    const doc = new Step0120_makeScreenSpec(index, componentName, ngUiJSON).result;
    const nameKebab = Utils.toKebabCase(componentName);
    this.nameKebab0 = nameKebab;
    this.nameCamel0 = componentName;
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
          {
            // ${Object.keys(g.models).map(modelName => modelName + ' (' + Object.keys(g.models[modelName].props).map(propName => propName + ': ' + g.models[modelName].props[propName]).join(', ')).join(')\n')}
            title: 'Model classes', content: Utils.trimLines(`
              ${Object.keys(g.models).map(modelName => modelName + (JSON.stringify(g.models[modelName][(g.models[modelName].props ? 'props' : 'values')]))).join('\n').replace(/""/g, 'null').replace(/"/g, '')}
            `)
          }
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
    fs.writeFileSync(`${this.dire}/${this.nameCamel0}.tsx.prompt.md`, prompt);
    // fs.writeFileSync(`./${this.dire}/${this.nameCamel0}.scss`, '');
    return prompt;
  }

  postProcess(result: string) {
    fs.writeFileSync(`${this.dire}/${this.nameCamel0}.tsx`, result
      .replace(/.*```.*\n/, '')
      .replace(/\n```.*/, '')
      .replace(/from ["']\.\/services\/.*["']/g, 'from \'../services\'')
      .replace(/from ["']\.\/services["']/g, 'from \'../services\'')
      .replace(/from ["']\.\/models\/.*["']/g, 'from \'../models\'')
      .replace(/from ["']\.\/models["']/g, 'from \'../models\'')
      .replace(/from ["']\.\/services\/.*["']/g, 'from \'../services\'')
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
    const ngUiJSON = Utils.jsonParse<any>(new Step0020_ReactComponentList_to_ReactComponentJson().result);
    filterByComponentName(ngUiJSON);
    const serviceListJSON = new Step0080_makeReactServiceJson().result;
    g.services = Utils.jsonParse(serviceListJSON.replace(/```/g, '').trim());
    const modelJSON = new Step0065_ReactModelList_to_Json().result;
    g.models = Utils.jsonParse(modelJSON.replace(/```/g, '').trim());
    g.classes = new RepoSyncer().loadDefs();
    // console.log(g.models);
    return Object.keys(ngUiJSON).map((componentName, index) => new Step0140_makeScreen(index, componentName, ngUiJSON, g));
  }
}

const HISTORY_DIRE = `./history`;
export async function main() {
  try { fs.mkdirSync(`./prompts`, { recursive: true }); } catch (e) { }
  try { fs.mkdirSync(`${HISTORY_DIRE}`, { recursive: true }); } catch (e) { }

  let obj;
  // obj = new Step0000_RequirementsToComponentList();
  // obj.initPrompt();
  // await obj.run();

  // obj = new Step0010_ComponentList_to_ReactComponentList();
  // obj.initPrompt();
  // await obj.run();

  // obj = new Step0020_ReactComponentList_to_ReactComponentJson();
  // obj.initPrompt();
  // await obj.run();

  obj = new Step0030_requirements_to_systemOverview();
  obj.initPrompt();
  await obj.run();


  // obj = new Step0040_makeReactService();
  // obj.initPrompt();
  // await obj.run();

  // obj = new Step0050_makeReactModel();
  // obj.initPrompt();
  // await obj.run();


  obj = new Step0060_makeReactModelSource();
  obj.initPrompt();
  await obj.run();


  obj = new Step0065_ReactModelList_to_Json();
  obj.initPrompt();
  await obj.run();

  obj = new Step0070_makeApiList();
  obj.initPrompt();
  await obj.run();

  obj = new Step0080_makeReactServiceJson();
  obj.initPrompt();
  await obj.run();

  new Step0080_makeReactServiceJson().postProcess(new Step0080_makeReactServiceJson().result);

  obj = new Step0100_ApiListJson();
  obj.initPrompt();
  await obj.run();

  obj = new MultiRunner(Step0102_createJSONdata.genSteps());
  obj.initPrompt();
  await obj.run();

  obj = new Step0105_componentList_to_Json();
  obj.initPrompt();
  await obj.run();

  obj = new MultiRunner(Step0120_makeScreenSpec.genSteps());
  obj.initPrompt();
  await obj.run();

  obj = new MultiRunner(Step0130_makeScreenSpecJSON.genSteps());
  obj.initPrompt();
  await obj.run();

  obj = new MultiRunner(Step0140_makeScreen.genSteps());
  obj.initPrompt();
  await obj.run();
  // // Step0140_makeScreen.genSteps().forEach(step => step.preProcess(fs.readFileSync(step.promptPath, 'utf-8')));
  // // Step0140_makeScreen.genSteps().forEach(step => step.postProcess(step.result));
}
// main();
