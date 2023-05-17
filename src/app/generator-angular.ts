import * as  fs from 'fs';
import { Utils } from './utils';
import { BaseStep, MultiRunner } from "./base-step";
import { RepoSyncer } from './repo-syncer';
import { GenModuleFiles, genIndex } from './gen-angular-modules';

class Step000_RequirementsToComponentList extends BaseStep {
  model = 'gpt-4';
  constructor() {
    super();
    this.chapters = [
      { title: 'requirements', content: fs.readFileSync(`./000-requirements.md`, 'utf-8') },
      {
        title: 'prompt', content: Utils.trimLines(`
          - As a UI/UX designer, design a list of screens based on a good understanding of the requirements definition.
          - Place headers, footers, menus, etc. as appropriate.
          - If multiple patterns of design are possible, please select the simplest pattern.
          - The list should be reviewed by professionals such as UI/UX designers, security specialists, business analysts, database specialists, strict consistency checker, etc., and an improved version should be presented with their input.(the strict consistency checker checks in detail whether the requirements definition is consistent with the list of screens.)
          Only the system overview and the completed list of screens and their components should be output.
          Output the list of completed screens and their components as a list.
          For each screen, please specify the data to be handled, the screen transition destination, and the dialogs to be used.
        `)
      },
    ];
  }
}

class Step001_componentList_to_angularComponentList extends BaseStep {
  model = 'gpt-4';
  constructor() {
    super();
    this.chapters = [
      { title: 'componentList', content: fs.readFileSync(new Step000_RequirementsToComponentList().resultPath, 'utf-8') },
      {
        title: 'prompt', content: Utils.trimLines(`
          After familiarizing yourself with the instructions up to this point, list all the Angular components you will need for this system.
          - Please use AngularMaterial.
          - Please classify the components into page, parts, and dialog.
          - If multiple patterns of design are possible, please select the simplest pattern.
          - For pages, please set the path.
          - Please also clearly indicate the I/O of components such as @Input, @Output, and MAT_DIALOG_DATA(parameter of dialogs). Don't forget to write the type, and generic type.
          - The output should be in tabular form, with the component name, type (page, parts, dialog), path (for page only), @Input, @Output, MAT_DIALOG_DATA, Child Angular Components,Dialog Angular Components, HTML Components, describe.
          - The component list should be reviewed by professionals such as UI/UX designers, security specialists, business analysts, strict consistency checker,  etc., and an improved version should be presented with their input (strict consistency checkers should strictly check for consistency between the screen list and component list).
          Output only the Improved Angular components List(after review).
        `)
      },
    ];
  }
}

class Step002_angularComponentList_to_angularComponentJson extends BaseStep {
  constructor() {
    super();
    this.chapters = [
      { title: 'angularComponentList', content: fs.readFileSync(new Step001_componentList_to_angularComponentList().resultPath, 'utf-8') },
      {
        title: 'prompt', content: Utils.trimLines(`
          Please convert the above design of Angular components to the following format. 
          {"\${ComponentName}": {"type": "page, parts, dialog","path":"\${path}","@Input": {{"\${varName}": "\${varType}"},,},"@Output": {{"\${varName}": "EventEmitter<\${genericType}>"},,},"MAT_DIALOG_DATA": {{"\${varName}": "\${varType}"},,},"childAngularComponents":["\${childComponentName}"], "dialogAngularComponents":["\${dialogComponentName}"], "HTMLComponents": ["\${htmlComponentName}}"], "describe":"describe"}}
          Be careful to convert all components to JSON correctly.
          Note that it is minified JSON without line breaks and spaces.
        `)
      },
    ];
  }
}

class Step003_requirements_to_systemOverview extends BaseStep {
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

class Step004_makeAngularService extends BaseStep {
  model = 'gpt-4';
  constructor() {
    super();
    this.chapters = [
      // { title: 'System Overview', content: fs.readFileSync(new Step003_requirements_to_systemOverview().resultPath, 'utf-8') },
      { title: 'Component List', content: fs.readFileSync(new Step000_RequirementsToComponentList().resultPath, 'utf-8') },
      { title: 'Angular Component List', content: fs.readFileSync(new Step001_componentList_to_angularComponentList().resultPath, 'utf-8') },
      {
        title: 'prompt', content: Utils.trimLines(`
          After familiarizing yourself with the instructions up to this point, list all the Angular service classes you will need for this system.
          - List the method names, arguments, and return values.
          - If multiple patterns are possible, choose the simpler design.
          - The service list should be reviewed by professionals such as UI/UX designers, security specialists, business analysts, strict consistency checker,  etc., and an improved version should be presented with their input.(The consistency checker will strictly check that your service list reflects all previous requirements.)
          Only output the Improved Angular service classes(and method) List.
        `)
      },
    ];
  }
}
class Step005_makeAngularModel extends BaseStep {
  model = 'gpt-4';
  constructor() {
    super();
    this.chapters = [
      // { title: 'Component List', content: fs.readFileSync(new Step000_RequirementsToComponentList().resultPath, 'utf-8') },
      { title: 'Angular Component List', content: fs.readFileSync(new Step001_componentList_to_angularComponentList().resultPath, 'utf-8') },
      { title: 'Angular Service List', content: fs.readFileSync(new Step004_makeAngularService().resultPath, 'utf-8') },
      {
        title: 'prompt', content: Utils.trimLines(`
          Design the Model Classes based on the above design document.
          - Please include all items that will be needed in addition to those used on the screen.
          - Define enums as appropriate.
          - The Model Classes should be reviewed by experts such as UI/UX designers, security specialists, business analysts, consistency checkers, etc., and an improved version should be presented that incorporates their input (consistency checkers strictly check whether the Model Classes reflects all previous designs).
          Only the list of improved Model classes (tabular format) is output.
        `)
      },
    ];
  }
}
class Step006_makeAngularModelSource extends BaseStep {
  constructor() {
    super();
    this.chapters = [
      { title: 'Angular Model List', content: fs.readFileSync(new Step005_makeAngularModel().resultPath, 'utf-8') },
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
          }\`\`\`
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
class Step007_makeApiList extends BaseStep {
  constructor() {
    super();
    this.chapters = [
      // { title: 'Angular Component List', content: fs.readFileSync(new Step001_componentList_to_angularComponentList().resultPath, 'utf-8') },
      { title: 'Angular Service List', content: fs.readFileSync(new Step004_makeAngularService().resultPath, 'utf-8') },
      { title: 'Angular Model List', content: fs.readFileSync(new Step005_makeAngularModel().resultPath, 'utf-8') },
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
Above is a screen-side design document created assuming Angular.
Based on this design document, please create an appropriate APIs list.
- Please make the API list in a tabular format. The only columns should be "Method", "Path", "RequestBody", and "ResponseBody".
- For login-related APIs, be sure to include a token in the ResponseBody. Even if the token is not specified in the output item of the service class, it must be returned from the API as a hidden item.
- It is not necessary to implement all the methods of the service class. Select functions that should be processed on the server side appropriately and make them into APIs.
- The API list should be reviewed by experts such as UI/UX designers, security specialists, business analysts, and strict consistency checkers, and an improved version should be presented with their input. (Strict consistency checkers will rigorously check that all features that should be implemented on the server are reflected in the API list).
Only output the Improved APIs List.`;
  }
}
class Step008_makeAngularServiceJson extends BaseStep {
  constructor() {
    super();
    this.chapters = [
      // { title: 'Angular Component List', content: fs.readFileSync(new Step001_componentList_to_angularComponentList().resultPath, 'utf-8') },
      { title: 'Angular Service List', content: fs.readFileSync(new Step004_makeAngularService().resultPath, 'utf-8') },
      // { title: 'Angular Model List', content: fs.readFileSync(new Step005_makeAngularModel().resultPath, 'utf-8') },
      {
        title: 'prompt', content: Utils.trimLines(`
          Please convert the above service class list into JSON format.
          The format is as follows.
          {"ServiceName",{"path":". /src/app/services/service-name.service.ts", "models":["modelClassName"],"methods":[{"name":"methodName","params":[{"name":"type"}],"return":"returnType<genericType>"}]},,,}
          Note that it is minified JSON without line breaks and spaces.
        `)
      },
    ];
  }
}
class Step009_makeAngularServiceSrouce extends BaseStep {
  constructor(
    private serviceName: string,
    private index: number,
    private g: any,
    private apiList: string,
    private defs: any,
  ) {
    super();
    this.serviceName = serviceName;
    this.index = index;
    this.label = `Step009-${index}-makeAngularServiceSrouce-${serviceName}`;

    console.log(g.services[serviceName].models.map((modelName: string) => modelName));
    // console.log(Object.keys(defs));
    const modelsString = g.services[serviceName].models.map((modelName: string) => defs[modelName].src).join('\n');
    this.chapters = [
      {
        title: "Reference", content: '', children: [
          { title: "All HTTP API List", content: apiList },
          // { title: "All Model Classes", content: Object.keys(g.models).map(key => ` - ${key}(${Object.keys(g.models[key].props).map(propKey => propKey + ': ' + g.models[key].props[propKey]).join(', ')})`).join('\n') },
          { title: "All Model Classes", content: modelsString },
        ]
      },
      { title: "Service Class Name", content: serviceName },
      { title: "Service Class Definition", content: JSON.stringify(g.services[serviceName]) },
      {
        title: 'prompt', content: Utils.trimLines(`
          Please create an ${serviceName} as Angular Service class.
          Add functions that are not in the service class definition as needed.
          step by step:
          - import all required libraries.
          - Authentication tokens for request headers should be get from the authService.getToken.
          - Write all implementations.
          - Pay close attention to the difference between the HTTP API's ResponseBody Type and the service's Return Type. Even if they are almost the same, they are often slightly different, so use pipe(map()) or other methods to adjust them.
          - ResponseBody is returned as String type even if it is written as Date. As a function of the Service class, it must be converted to the Date type according to the model class type.
          Only output the source code.
        `)
      },
      // - Authentication tokens for request headers should be get from the service responsible for authService by getToken.
      // - HTTP APIのResponseBody TypeとサービスのReturn Typeの違いには、十分に注意をしてください。ほとんど同じでも若干違うことが多いので、pipe(map())等で調整してください。
      // - HTTP ResponseBody の型にDate型がある場合はStringで連携されるため、pipe(map())等でDate型に変換してください。専用の関数を定義してもよいです。
    ];
  }

  preProcess(prompt: string): string {
    fs.writeFileSync(`./gen/src/app/services/${Utils.toKebabCase(this.serviceName).replace(/-service/, '.service')}.ts.prompt.md`, this.prompt);
    return prompt;
  }

  postProcess(text: string): string {
    text = text
      .replace(/```.*/g, '')
      .replace(/\`\`\`typescript[\r]?\n/g, '')
      // .replace(/from '\.\.\/services\/.*'/g, 'from \'./\'')
      .replace(/from '\.\.\/models\/.*'/g, 'from \'../models\'')
      .trim();
    if (text.indexOf(' map(') === -1 || /import { .*map[,]*.*} from 'rxjs';/g.test(text) || /import { .*map[,]*.*} from 'rxjs\/operators';/g.test(text)) {
    } else {
      text = `import { map } from 'rxjs';\n` + text;
    }
    fs.writeFileSync(`./gen/src/app/services/${Utils.toKebabCase(this.serviceName).replace(/-service/, '.service')}.ts`, text);
    genIndex(); // TODO 本当は全部終わってから一発でやった方がいいけど、とりあえず。
    return text;
  }

  static genSteps() {
    const defs = new RepoSyncer().loadDefs(["./gen/src/app/models.ts"]);
    // const compListText = fs.readFileSync(`./prompts/001-ComponentListToAngularComponentList.prompt.md.answer.md`, 'utf-8');
    const serviceListJSON = fs.readFileSync(new Step008_makeAngularServiceJson().resultPath, 'utf-8');
    const g: any = {};
    g.services = Utils.jsonParse(serviceListJSON.replace(/```/g, '').trim());
    const apiList = fs.readFileSync(new Step007_makeApiList().resultPath, 'utf-8');
    fs.mkdirSync(`./gen/src/app/services`, { recursive: true });
    // const res = Promise.all(promiseList).then((values) => {
    //   console.log(`step009_makeAngularServiceSrouce-fine`);
    //   genIndex();
    // });
    return Object.keys(g.services).map((serviceName, index) => new Step009_makeAngularServiceSrouce(serviceName, index, g, apiList, defs));
  }
}
class Step010_ApiListJson extends BaseStep {
  constructor() {
    super();
    this.chapters = [
      { title: 'APIs List', content: fs.readFileSync(new Step007_makeApiList().resultPath, 'utf-8') },
      {
        title: 'prompt', content: Utils.trimLines(`
          Please convert APIs List table to minified JSON format, like below.
          [{"method":"POST","path":"/api/auth/login","requestBody":"{ username, password }","responseBody":"{ token, user: User }","description":"Authenticates user and returns a token and user object"},{"method":"POST","path":"/api/auth/login","requestBody":"{ username, password }","responseBody":"{ token, user: User }","description":"Authenticates user and returns a token and user object" },,]
          Output Json only.
        `)
      },
    ];
  }
}
class Step010_createJSONdata extends BaseStep {
  constructor(chunkArray: any[], idx: number, modelList: string,) {
    super();
    this.label = `Step010-createJSONdata-${idx}`;
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
          Please output only JSON data.
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
    const modelList = fs.readFileSync(new Step005_makeAngularModel().resultPath, 'utf-8');
    const apiList = Utils.jsonParse(fs.readFileSync(new Step010_ApiListJson().resultPath, 'utf-8')) as any[];
    return Utils.toChunkArray(apiList, 3).map((chunkArray: any, idx: number) => new Step010_createJSONdata(chunkArray, idx, modelList));
  }
}
class Step010_componentList_to_Json extends BaseStep {
  constructor() {
    super();
    this.chapters = [
      { title: 'Component List', content: fs.readFileSync(new Step000_RequirementsToComponentList().resultPath, 'utf-8') },
      {
        title: 'prompt', content: Utils.trimLines(`
          Please convert the above List of Screensn into JSON format.
          {"ScreenName":{"desc": "A brief description of the screen", "uiList"["UI component",,]},,}
          Note that this is minified JSON without newlines and spaces.
        `)
      },
    ];
  }
}
class Step011_AngularModelList_to_Json extends BaseStep {
  constructor() {
    super();
    this.chapters = [
      { title: 'Angular Model List', content: fs.readFileSync(new Step005_makeAngularModel().resultPath, 'utf-8') },
      {
        title: 'prompt', content: Utils.trimLines(`
          Please convert the above List of Screensn into JSON format.
          {"ModelClassName":{"desc": "A brief description of the Model", "props"{{"name":"type<generic>"},,}},,}
          Note that this is minified JSON without newlines and spaces.
        `)
      },
    ];
  }
}

class Step012_makeScreenSpec extends BaseStep {
  // model = 'gpt-4';
  constructor(index: number, componentName: string, ngUiJSON: any) {
    super();
    this.label = `Step012-${index}-makeScreenSpec-${componentName}`;
    // console.log([...ngUiJSON[componentName].childAngularComponents, ...ngUiJSON[componentName].dialogAngularComponents]);
    // console.log(Object.keys(ngUiJSON));
    // console.log(this.label);

    const g: any = {};
    const ngUiList = Utils.spaceNormalize(fs.readFileSync(new Step001_componentList_to_angularComponentList().resultPath, 'utf-8'));
    const systemOverview = fs.readFileSync(new Step003_requirements_to_systemOverview().resultPath, 'utf-8');
    const serviceListJSON = fs.readFileSync(new Step008_makeAngularServiceJson().resultPath, 'utf-8');
    g.services = Utils.jsonParse(serviceListJSON.replace(/```/g, '').trim());
    const serviceString = Object.keys(g.services).map(key => ` - ${key}: ${g.services[key].methods.map((method: any) => method.name + '(' + method.params.map((kv: { name: string, type: string }) => kv.name + ': ' + kv.type).join(', ') + '): ' + method.return).join(', ')}`).join('\n');
    const modelJSON = fs.readFileSync(new Step011_AngularModelList_to_Json().resultPath, 'utf-8');
    g.models = Utils.jsonParse(modelJSON.replace(/```/g, '').trim());
    // console.log(g.models);
    const modelString = Object.keys(g.models).filter(key => g.models[key].props).map(key => ` - ${key}(${Object.keys(g.models[key].props).map(propKey => propKey + ': ' + g.models[key].props[propKey]).join(', ')})`).join('\n');
    const enumString = Object.keys(g.models).filter(key => g.models[key].values).map(key => ` - ${key}: ${g.models[key].values.map((value: string) => '"' + value + '"').join(' | ')}`).join('\n');

    const io = ['@Input', '@Output'].map(io => Object.keys(ngUiJSON[componentName][io] || {}).filter(key => key.trim() !== '-').map(key => `- ${key}: ${ngUiJSON[componentName][io][key]}`).join('\n'));
    this.chapters = [
      { title: 'System Overview', content: systemOverview },
      { title: 'All Angular Components', content: ngUiList },
      { title: 'All Model Classes', content: modelString },
      { title: 'All Enums', content: enumString },
      { title: 'All Service Classes', content: serviceString },
      {
        title: 'prompt', content: Utils.trimLines(`
          Based on the above design, prepare a detailed screen design document for ${componentName}.
          > Please think step-by-step when creating the design document.
          > First, carefully read the System Overview to understand the purpose of this system.
          > Next, look at the Angular Component List carefully to understand the position of the ${componentName} within the overall system.
          > Then, think about the elements and functions you need for the ${componentName}.
          > Then select from All Service Classes which service (and model) will be used to provide the required information for the component.
          - Do not include information that will be implemented by child components.
          The chapter structure should be as follows.
          \`\`\`markdown
          # Detailed Screen Design Document
          ## Screen name
          ## Description
          ## Elements to be used
          ### Angular elements
          ${(ngUiJSON[componentName].childAngularComponents || []).map((chilName: string) => '- ' + chilName + '(' + ['@Input', '@Output'].map(io => io + ':{' + Object.keys(ngUiJSON[chilName][io] || {}).filter(key => key.trim() !== '-').map(key => key + ': ' + ngUiJSON[chilName][io][key]).join(',') + '}').join(', ') + ')').join('\n') || 'None'}
          ### Angular dialogs
          ${(ngUiJSON[componentName].dialogAngularComponents || []).map((chilName: string) => '- ' + chilName + '(' + ['MAT_DIALOG_DATA'].map(io => io + ':{' + Object.keys(ngUiJSON[chilName][io] || {}).filter(key => key.trim() !== '-').map(key => key + ': ' + ngUiJSON[chilName][io][key]).join(',') + '}').join(', ') + ')').join('\n') || 'None'}
          ### HTML components
          ${(ngUiJSON[componentName].HTMLComponents || []).map((name: string) => '- ' + name).join(', ') || 'None'}
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
    const ngUiJSON = Utils.jsonParse<any>(fs.readFileSync(new Step002_angularComponentList_to_angularComponentJson().resultPath, 'utf-8').replace(/{"": ""}/g, 'null'));
    ['childAngularComponents', 'dialogAngularComponents'].forEach((prop: string) => { Object.keys(ngUiJSON).forEach(componentName => { ngUiJSON[componentName][prop] = Object.keys(ngUiJSON).filter(name => ngUiJSON[name][prop] !== 'RouterOutlet' && ngUiJSON[name][prop].find((chilName: string) => Object.keys(ngUiJSON).indexOf(chilName) !== -1)); }); });
    return Object.keys(ngUiJSON).map((componentName, index) => new Step012_makeScreenSpec(index, componentName, ngUiJSON));
  }
}

class Step013_makeScreenSpecJSON extends BaseStep {
  constructor(index: number, componentName: string, ngUiJSON: any) {
    super();
    this.label = `Step013-${index}-makeScreenSpecJSON-${componentName}`;
    this.chapters = [
      { title: '', content: fs.readFileSync(new Step012_makeScreenSpec(index, componentName, ngUiJSON).resultPath, 'utf-8') },
      {
        title: 'prompt', content: Utils.trimLines(`
          Please convert the above List of Screensn into JSON format.
          {"modelClassesUsed":[\${Model class used}], "serviceClassesUsed":[\${Service class used}]]}
          * Models and Services shall be by name only List.
          Note that this is minified JSON without newlines and spaces.
        `)
      },
    ];
  }
  static genSteps() {
    const g: any = {};
    const ngUiJSON = Utils.jsonParse<any>(fs.readFileSync(new Step002_angularComponentList_to_angularComponentJson().resultPath, 'utf-8'));
    ['childAngularComponents', 'dialogAngularComponents'].forEach((prop: string) => { Object.keys(ngUiJSON).forEach(componentName => { ngUiJSON[componentName][prop] = Object.keys(ngUiJSON).filter(name => ngUiJSON[name][prop] !== 'RouterOutlet' && ngUiJSON[name][prop].find((chilName: string) => Object.keys(ngUiJSON).indexOf(chilName) !== -1)); }); });
    const serviceListJSON = fs.readFileSync(new Step008_makeAngularServiceJson().resultPath, 'utf-8');
    g.services = Utils.jsonParse(serviceListJSON.replace(/```/g, '').trim());
    const modelJSON = fs.readFileSync(new Step011_AngularModelList_to_Json().resultPath, 'utf-8');
    g.models = Utils.jsonParse(modelJSON.replace(/```/g, '').trim());
    return Object.keys(ngUiJSON).map((componentName, index) => new Step013_makeScreenSpecJSON(index, componentName, ngUiJSON));
  }
}

class Step014_makeScreenHtml extends BaseStep {
  // model = 'gpt-4';
  private dire: string;
  private nameKebab0: string;
  constructor(
    private index: number,
    private componentName: string,
    private ngUiJSON: any,
    private g: any,) {
    super();
    this.label = `Step014-${index}-makeScreenHtml-${componentName}`;

    const doc = fs.readFileSync(new Step012_makeScreenSpec(index, componentName, ngUiJSON).resultPath, 'utf-8');
    const nameKebab = Utils.toKebabCase(componentName);
    this.nameKebab0 = nameKebab.replace(/-component$/, '');
    const nameCamel0 = componentName.replace(/Component$/, '');
    const io = ['@Input', '@Output', 'MAT_DIALOG_DATA'].map(io => Object.keys(ngUiJSON[componentName][io] || {}).filter(key => key.trim() !== '-').map(key => `- ${key}: ${ngUiJSON[componentName][io][key]}`).join('\n'));

    this.chapters = [
      {
        title: '', content: doc, children: [
          { title: '@Input (as Angular element)', content: io[0] },
          { title: '@Output (as Angular element)', content: io[1] },
          { title: 'MAT_DIALOG_DATA (as Angular dialog)', content: io[2] },
        ]
      },
      {
        title: 'Reference', content: '', children: [
          {
            title: 'Model and Service classes', content: Utils.trimLines(`
              \`\`\`typescript
              ${Object.keys(g.classes).map(key => g.classes[key].src).join('\n')}
              \`\`\``)
          }
        ]
      },
      {
        title: 'prompt', content: Utils.trimLines(` 
          Please carefully review the design information up to this point and create the html for the ${componentName}, keeping in mind the division of roles according to the screen list.
          Please be sure to inspect the following points before submitting your work.
          - Please use AngularMaterial to create a polished design.
          - Calibrate the screen with only the given components.
          - Do not use name specified for @Output.
          - screen should be for Japanese.
          - Note the component names (especially the suffixes).
          Please respond only to ${this.nameKebab0}.component.html.
        `)
      },
    ];

    ////////////////// 
    this.dire = `./gen/src/app/${ngUiJSON[componentName].type.toLowerCase().replace(/s$/g, '')}s/${this.nameKebab0}/`;
    if (fs.existsSync(this.dire)) {
    } else {
      fs.mkdirSync(this.dire, { recursive: true });
      console.log(`Directory ${this.dire} created.`);
    }
  }

  preProcess(prompt: string): string {
    fs.writeFileSync(`./${this.dire}/${this.nameKebab0}.component.html.prompt.md`, prompt);
    fs.writeFileSync(`./${this.dire}/${this.nameKebab0}.component.scss`, '');
    return prompt;
  }

  postProcess(result: string) {
    fs.writeFileSync(`./${this.dire}/${this.nameKebab0}.component.html`, result
      .replace(/.*```.*\n/, '')
      .replace(/\n```.*/, '')
      .replace('$event.target.value', `$event.target['value']`)
      .replace(/\.controls\.([a-zA-Z0-9_$]*)\./g, `.controls['$1']?.`)
      .replace(/(\.controls[a-zA-Z0-9_$\[\]"']*\.errors)\.([a-zA-Z0-9_$]*)/g, `$1['$2']`));
    return result;
  }

  static genSteps() {
    const g: any = {};
    const ngUiJSON = Utils.jsonParse<any>(fs.readFileSync(new Step002_angularComponentList_to_angularComponentJson().resultPath, 'utf-8'));
    ['childAngularComponents', 'dialogAngularComponents'].forEach((prop: string) => { Object.keys(ngUiJSON).forEach(componentName => { ngUiJSON[componentName][prop] = Object.keys(ngUiJSON).filter(name => ngUiJSON[name][prop] !== 'RouterOutlet' && ngUiJSON[name][prop].find((chilName: string) => Object.keys(ngUiJSON).indexOf(chilName) !== -1)); }); });
    const serviceListJSON = fs.readFileSync(new Step008_makeAngularServiceJson().resultPath, 'utf-8');
    g.services = Utils.jsonParse(serviceListJSON.replace(/```/g, '').trim());
    const modelJSON = fs.readFileSync(new Step011_AngularModelList_to_Json().resultPath, 'utf-8');
    g.models = Utils.jsonParse(modelJSON.replace(/```/g, '').trim());
    g.classes = new RepoSyncer().loadDefs();
    return Object.keys(ngUiJSON).map((componentName, index) => new Step014_makeScreenHtml(index, componentName, ngUiJSON, g));
  }
}

class Step015_ScreenProp extends BaseStep {
  dire: string;
  nameKebab0: string;
  constructor(
    private index: number,
    private componentName: string,
    private ngUiJSON: any,) {
    super();
    this.label = `Step015-${index}-ScreenProp-${componentName}`;
    const nameKebab = Utils.toKebabCase(componentName);
    this.nameKebab0 = nameKebab.replace(/-component$/, '');
    const nameCamel0 = componentName.replace(/Component$/, '');

    this.dire = `./gen/src/app/${ngUiJSON[componentName].type.toLowerCase().replace(/s$/g, '')}s/${this.nameKebab0}/`;

    const htmlString = fs.readFileSync(`./${this.dire}/${this.nameKebab0}.component.html`, 'utf-8');

    this.chapters = [
      { title: 'html', content: `\`\`\`html\n${htmlString}\n\`\`\`` },
      {
        title: 'prompt', content: Utils.trimLines(`
          The above html is an Angular template.
          Please list all "variables", "constants", "ViewChild", and "functions" needed to create the ts. mat-table's column names are also "constants".
          The format should be name, type, description.`)
      },
    ];
  }
  postProcess(result: string): string {
    fs.writeFileSync(`./${this.dire}/${this.nameKebab0}.component.prop`, result);
    return result;
  }
  static genSteps() {
    const g: any = {};
    const ngUiJSON = Utils.jsonParse<any>(fs.readFileSync(new Step002_angularComponentList_to_angularComponentJson().resultPath, 'utf-8'));
    ['childAngularComponents', 'dialogAngularComponents'].forEach((prop: string) => { Object.keys(ngUiJSON).forEach(componentName => { ngUiJSON[componentName][prop] = Object.keys(ngUiJSON).filter(name => ngUiJSON[name][prop] !== 'RouterOutlet' && ngUiJSON[name][prop].find((chilName: string) => Object.keys(ngUiJSON).indexOf(chilName) !== -1)); }); });
    const serviceListJSON = fs.readFileSync(new Step008_makeAngularServiceJson().resultPath, 'utf-8');
    g.services = Utils.jsonParse(serviceListJSON.replace(/```/g, '').trim());
    const modelJSON = fs.readFileSync(new Step011_AngularModelList_to_Json().resultPath, 'utf-8');
    g.models = Utils.jsonParse(modelJSON.replace(/```/g, '').trim());
    g.classes = new RepoSyncer().loadDefs();
    return Object.keys(ngUiJSON).map((componentName, index) => new Step015_ScreenProp(index, componentName, ngUiJSON));
  }
}

class Step015_ScreenPropJSON extends BaseStep {
  dire: string;
  nameKebab0: string;
  constructor(
    private index: number,
    private componentName: string,
    private ngUiJSON: any,) {
    super();
    this.label = `Step015-${index}-ScreenPropJSON-${componentName}`;

    const nameKebab = Utils.toKebabCase(componentName);
    this.nameKebab0 = nameKebab.replace(/-component$/, '');

    this.dire = `./gen/src/app/${ngUiJSON[componentName].type.toLowerCase().replace(/s$/g, '')}s/${this.nameKebab0}/`;

    const htmlString = fs.readFileSync(`./${this.dire}/${this.nameKebab0}.component.prop`, 'utf-8');

    this.chapters = [
      { title: '', content: htmlString },
      {
        title: 'prompt', content: Utils.trimLines(`
          Please put the above data into JSON format.
          {"Variables":{"\${name}":{"type":"\${type}","description":"\${description}"},},}  
        `)
      },
    ];
  }
  static genSteps() {
    const ngUiJSON = Utils.jsonParse<any>(fs.readFileSync(new Step002_angularComponentList_to_angularComponentJson().resultPath, 'utf-8'));
    ['childAngularComponents', 'dialogAngularComponents'].forEach((prop: string) => { Object.keys(ngUiJSON).forEach(componentName => { ngUiJSON[componentName][prop] = Object.keys(ngUiJSON).filter(name => ngUiJSON[name][prop] !== 'RouterOutlet' && ngUiJSON[name][prop].find((chilName: string) => Object.keys(ngUiJSON).indexOf(chilName) !== -1)); }); });
    return Object.keys(ngUiJSON).map((componentName, index) => new Step015_ScreenPropJSON(index, componentName, ngUiJSON));
  }
}



class Step016_AngularTypescript extends BaseStep {
  // model = 'gpt-4';
  dire;
  nameKebab0;
  constructor(index: number, componentName: string, ngUiJSON: any, g: any,) {
    super();
    this.label = `Step016-${index}-AngularTypescript-${componentName}`;

    const doc = fs.readFileSync(new Step012_makeScreenSpec(index, componentName, ngUiJSON).resultPath, 'utf-8')
      .split('\n').map(line => {
        if (line.match(/^#+/)) {
          return `#${line}`;
        } else {
          return line;
        }
      }).join('\n');
    const specJSON = Utils.jsonParse<any>(fs.readFileSync(new Step013_makeScreenSpecJSON(index, componentName, ngUiJSON).resultPath, 'utf-8'));
    const nameKebab = Utils.toKebabCase(componentName);
    this.nameKebab0 = nameKebab.replace(/-component$/, '');
    const nameCamel0 = componentName.replace(/Component$/, '');

    this.dire = `./gen/src/app/${ngUiJSON[componentName].type.toLowerCase().replace(/s$/g, '')}s/${this.nameKebab0}/`;

    let htmlProps = fs.readFileSync(`./${this.dire}/${this.nameKebab0}.component.prop`, 'utf-8')
      .split('\n').map((line) => {
        if (line.match(/^[A-Za-z0-9].*:$/)) {
          return `### ${line}`;
        } else {
          return line;
        }
      }).join('\n');

    const propJSON: { [key: string]: any } = Utils.jsonParse(fs.readFileSync(new Step015_ScreenPropJSON(index, componentName, ngUiJSON).resultPath, 'utf-8'));
    Object.keys(propJSON).forEach(key => {
      const val = propJSON[key];
      Object.keys(val).forEach(key => {
        if (['none', 'n/a'].indexOf(key.toLowerCase()) !== -1) {
          delete val[key];
        } else {
          // 
        }
      });
      delete propJSON[key];
      propJSON[key.replace(/@/g, '').toLocaleLowerCase().split(' ')[0]] = val;
    });

    const propString = ['variables', 'constants',].map(key => {
      return Object.keys(propJSON[key] || {}).map(prop => {
        return `    // ${propJSON[key][prop].description}\n    ${prop}: ${propJSON[key][prop].type};`;
      }).join('\n\n');
    }).join('\n\n\n');
    // 'viewchild', 'functions'

    const viewChildString = Object.keys(propJSON['viewchild'] || {}).map(viewChildName => {
      return `    // ${propJSON['viewchild'][viewChildName].description}\n    @ViewChild('${viewChildName}') ${viewChildName}: ${propJSON['viewchild'][viewChildName].type};`;
    }).join('\n\n');

    const funcString = Object.keys(propJSON['functions'] || {}).map(funcName => {
      const funcObj = propJSON['functions'][funcName];
      if (funcName.endsWith(')')) {
      } else {
        funcName += '()';
      }
      return `    /**\n     * ${funcObj.description}\n     */\n    ${funcName}: ${funcObj.type || 'void'} {\n        // TODO implement\n    }`;
    }).join('\n\n');

    let ioString = '';
    for (const io of ['@Input', '@Output']) {
      for (const key of Object.keys(ngUiJSON[componentName][io] || {})) {
        ioString += `    ${io}() ${key}: ${ngUiJSON[componentName][io][key]};\n`;
      }
    }
    // TODO Angular Elementsに書かれてるからChilは不要では？
    let chilString = '';
    // console.log(specJSON);
    let diString = (specJSON.serviceClassUsed || specJSON.serviceClassesUsed).map((s: string) => `private ${Utils.toCamelCase(s)}: ${s}`).join(', ');

    const io = ['@Input', '@Output', 'MAT_DIALOG_DATA'].map(io => Object.keys(ngUiJSON[componentName][io] || {}).filter(key => key.trim() !== '-').map(key => `- ${key}: ${ngUiJSON[componentName][io][key]}`).join('\n'));

    this.chapters = [
      {
        title: 'Reference', content: '', children: [{
          title: 'Model and Service classes', content: Utils.trimLines(`
            \`\`\`typescript
            ${Object.keys(g.classes).map(key => g.classes[key].src).join('\n')}
            \`\`\`
          `)
        }, {
          title: 'Directory structure sample', content: Utils.trimLines(`
            src/app/dialogs/sample-dialog.component/
            src/app/pages/sample-page.component/
            src/app/parts/sample-part.component/
            src/app/services/sample.service.ts
            src/app/models.ts
          `)
        }]
      },
      {
        title: componentName, content: doc, children: [{
          children: [ // docの中の##の下のレイヤーにつなげて接続したいので二重に階層化しておく。
            { title: '@Input (as Angular element)', content: io[0] },
            { title: '@Output (as Angular element)', content: io[1] },
            { title: 'MAT_DIALOG_DATA (as Angular dialog)', content: io[2] },
          ]
        },
        { title: '', content: htmlProps }, /// htmlPropsは既にマークダウンになっているので、そのまま入れる。
        { title: '', content: chilString },
        {
          title: 'typescript template', content: Utils.trimLines(`
            \`\`\`typescript
            // src/app/${ngUiJSON[componentName].type.toLowerCase().replace(/s$/g, '')}s/${this.nameKebab0}.component.ts
            import { Component, OnInit } from '@angular/core';
            import { ${(specJSON.modelClassUsed || specJSON.modelClassesUsed).join(', ')} } from '../../models';
            import { ${(specJSON.serviceClassUsed || specJSON.serviceClassesUsed).join(', ')} } from '../../services';
            
            @Component({
                selector: 'app-${this.nameKebab0}',
                templateUrl: './${this.nameKebab0}.component.html',
                styleUrls: ['./${this.nameKebab0}.component.scss']
            })
            class  ${nameCamel0}Component implements OnInit {

            ${propString}


            ${ioString}

            ${viewChildString}

                constructor(${diString}) {
                }
            
                ngOnInit(): void {
                }

            ${funcString}

            }
            \`\`\`
          `)
        }]
      },
      {
        title: 'prompt', content: Utils.trimLines(`
          Please carefully review the design information up to this point and add any missing features to COMPONENT.
          Be sure to inspect the following points yourself before submitting.
          - Please use AngularMaterial to create a polished design.
          - Pay attention to the types and variable names (especially the difference between camel case and snake case).
          - The argument and return type of the service class name must be correct.
          - The @Input and @Output specifications are often forgotten. Please do not forget to check them.
          - screen should be for Japanese.
          - Replace all TODOs with implementation.
          - Import statements and DI statements will be inspected.
          Please write ${this.nameKebab0}.component.ts, as no explanation is needed.
        `)
      },
    ];
  }
  preProcess(prompt: string): string {
    fs.writeFileSync(`./${this.dire}/${this.nameKebab0}.component.ts.prompt.md`, this.prompt);
    return prompt;
  }
  postProcess(result: string): string {
    result = Utils.convertCodeBlocks(result)
      .replace(/from '\.\.\/services\/.*'/g, 'from \'../../services\'')
      .replace(/from '\.\.\/services'/g, 'from \'../../services\'')
      .replace(/from '\.\.\/models\/.*'/g, 'from \'../../models\'')
      .replace(/from '\.\.\/models'/g, 'from \'../../models\'')
      .replace(/from '\.\.\/\.\.\/services\/.*'/g, 'from \'../../services\'')
      .replace(/from '\.\.\/\.\.\/models\/.*'/g, 'from \'../models\'')
      .replace(/from '\.\.\/dialogs\//g, 'from \'../../dialogs/')
      .replace(/from '\.\.\/pages\//g, 'from \'../../pages/')
      .replace(/from '\.\.\/parts\//g, 'from \'../../parts/')
      .replace('$event.target.value', `$event.target['value']`)
      .replace(/\.controls\.([a-zA-Z0-9_$]*)\./g, `.controls['$1']?.`)
      .replace(/(\.controls[a-zA-Z0-9_$\[\]"']*\.errors)\.([a-zA-Z0-9_$]*)/g, `$1['$2']`)
      // TODO @InputとVariablesの二重定義
      // TODO categoryサービスちゃんと呼ばれない問題が起きてる。->丁寧に書くと解決する。
      // TODO CommonDialog系はあった方が良さそう。Success/Error/Message/Confirm。（GTP-4だとそんなことは無かった。）
      // TODO 複数コンポーネントのファイルもあるので、モジュール作るときにパースしないとダメかも。
      // TODO 組み合わせが苦手。二つのモデルを組み合わせて、一つのモデルを作るとか。
      // TODO serviceのDateはstringになってるので、Dateにする。（結構大変？）
      // TODO グラフは結構変。ライブラリとバージョンを指定した方がよいかも。
      // TODO dialogの渡し方、オブジェクトそのものを渡しているのにidで受け取ってると勘違いしてる。
      .trim();
    fs.writeFileSync(`./${this.dire}/${this.nameKebab0}.component.ts`, result);
    return result;
  }

  static genSteps() {
    const ngUiJSON = Utils.jsonParse<any>(fs.readFileSync(new Step002_angularComponentList_to_angularComponentJson().resultPath, 'utf-8'));
    ['childAngularComponents', 'dialogAngularComponents'].forEach((prop: string) => { Object.keys(ngUiJSON).forEach(componentName => { ngUiJSON[componentName][prop] = Object.keys(ngUiJSON).filter(name => ngUiJSON[name][prop] !== 'RouterOutlet' && ngUiJSON[name][prop].find((chilName: string) => Object.keys(ngUiJSON).indexOf(chilName) !== -1)); }); });
    const serviceListJSON = fs.readFileSync(new Step008_makeAngularServiceJson().resultPath, 'utf-8');
    const g: any = {};
    g.services = Utils.jsonParse(serviceListJSON.replace(/```/g, '').trim());
    const modelJSON = fs.readFileSync(new Step011_AngularModelList_to_Json().resultPath, 'utf-8');
    g.models = Utils.jsonParse(modelJSON.replace(/```/g, '').trim());
    g.classes = new RepoSyncer().loadDefs();
    return Object.keys(ngUiJSON).map((componentName, index) => new Step016_AngularTypescript(index, componentName, ngUiJSON, g));
  }
}

const HISTORY_DIRE = `./history`;
export async function main() {
  try { fs.mkdirSync(`./prompts`, { recursive: true }); } catch (e) { }
  try { fs.mkdirSync(`${HISTORY_DIRE}`, { recursive: true }); } catch (e) { }

  let obj;
  obj = new Step000_RequirementsToComponentList();
  obj.initPrompt();
  await obj.run();

  obj = new Step001_componentList_to_angularComponentList();
  obj.initPrompt();
  await obj.run();

  obj = new Step002_angularComponentList_to_angularComponentJson();
  obj.initPrompt();
  await obj.run();

  obj = new Step003_requirements_to_systemOverview();
  obj.initPrompt();
  await obj.run();

  obj = new Step004_makeAngularService();
  obj.initPrompt();
  await obj.run();

  obj = new Step005_makeAngularModel();
  obj.initPrompt();
  await obj.run();


  obj = new Step006_makeAngularModelSource();
  obj.initPrompt();
  await obj.run();


  obj = new Step011_AngularModelList_to_Json();
  obj.initPrompt();
  await obj.run();

  obj = new Step007_makeApiList();
  obj.initPrompt();
  await obj.run();

  obj = new Step008_makeAngularServiceJson();
  obj.initPrompt();
  await obj.run();


  obj = new MultiRunner(Step009_makeAngularServiceSrouce.genSteps());
  obj.initPrompt();
  await obj.run();


  obj = new Step010_ApiListJson();
  obj.initPrompt();
  await obj.run();

  obj = new MultiRunner(Step010_createJSONdata.genSteps());
  obj.initPrompt();
  await obj.run();

  obj = new Step010_componentList_to_Json();
  obj.initPrompt();
  await obj.run();

  obj = new MultiRunner(Step012_makeScreenSpec.genSteps());
  obj.initPrompt();
  await obj.run();

  obj = new MultiRunner(Step013_makeScreenSpecJSON.genSteps());
  obj.initPrompt();
  await obj.run();

  obj = new MultiRunner(Step014_makeScreenHtml.genSteps());
  obj.initPrompt();
  await obj.run();

  obj = new MultiRunner(Step015_ScreenProp.genSteps());
  obj.initPrompt();
  await obj.run();


  obj = new MultiRunner(Step015_ScreenPropJSON.genSteps());
  obj.initPrompt();
  await obj.run();


  obj = new MultiRunner(Step016_AngularTypescript.genSteps());
  obj.initPrompt();
  await obj.run();
  new GenModuleFiles().exec();
}
// main();
