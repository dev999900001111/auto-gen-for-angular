const start = Date.now();
console.log('start');
import { aiApi } from './app/base-step';
import * as generatorAngular from './app/generator-angular';
import * as generatorReact from './app/generator-react';


/**
 * 引数によってAngularかReactかをふりわける
 */
async function main(type: 'angular' | 'react' = 'angular') {
    try {
        if (type === 'react') {
            await generatorReact.main();
        } else {
            await generatorAngular.main();
        }
    } catch (e) {
        console.log(e);
    }
    console.log(`end ${(Date.now() - start).toLocaleString()}[ms] passed.`);
    const total = aiApi.total();
    Object.keys(total).forEach(key => console.log(total[key].toString()));
}
main(process.argv[2] as 'angular' | 'react');
