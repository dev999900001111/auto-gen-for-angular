const start = Date.now();
console.log('start');
import { aiApi } from './app/common/base-step';
import * as generatorAngular from './app/for-angular/generator-angular';
import * as generatorReact from './app/for-react/generator-react';
import * as generatorSpring from './app/for-spring/generator-spring';

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
