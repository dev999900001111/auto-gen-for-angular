const start = Date.now();
console.log('start');
import { aiApi } from './app/base-step';
import * as generatorAngular from './app/generator';
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
    console.log(`end ${(Date.now() - start).toLocaleString()}ms passed. Cost:\$${aiApi.totalCost.toFixed(2)}`);
}
main(process.argv[2] as 'angular' | 'react');
