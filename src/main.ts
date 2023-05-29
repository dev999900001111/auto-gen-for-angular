const start = Date.now();
console.log('start');
import { aiApi } from './app/common/base-step';
import * as generatorAngular from './app/for-angular/task-runner';
import * as generatorReact from './app/for-react/task-runner';
import * as generatorSpring from './app/for-spring/task-runner';

type GeneratorType = 'angular' | 'react' | 'spring';

/**
 * 引数によってAngularかReactかをふりわける
 */
async function main(type: GeneratorType = 'spring') {
    try {
        switch (type) {
            case 'angular':
                await generatorAngular.main();
                break;
            case 'react':
                await generatorReact.main();
                break;
            case 'spring':
                await generatorSpring.main();
                break;
            default:
                console.log('error');
                break;
        }
    } catch (e) {
        console.log(e);
    }
    console.log(`end ${(Date.now() - start).toLocaleString()}[ms] passed.`);
    const total = aiApi.total();
    Object.keys(total).forEach(key => console.log(total[key].toString()));
}
main(process.argv[2] as GeneratorType);
