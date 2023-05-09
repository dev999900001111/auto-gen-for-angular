console.log('start');
import * as generator from './app/generator';

async function main () {
    try {
        await generator.main();
    } catch(e){
        console.log(e);
    }
    console.log('end');
}
main();
