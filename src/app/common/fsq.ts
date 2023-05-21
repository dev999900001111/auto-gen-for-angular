import * as  fs from 'fs';
import { PathOrFileDescriptor, WriteFileOptions, NoParamCallback } from 'fs';

class FsQueueImpl {
    constructor() { }

    private qMap: { [key: string]: { lock: boolean, q: FsQueueParam[] } } = {};

    /**
     * ファイルに書き込むコールバックを作成する。
     * パスをパラメータとしたコールバックを作成するので直接の関数ではなくFactoryとしている。
     * @param path 
     * @returns 
     */
    private callbackFactory = (path: string, callback?: NoParamCallback): NoParamCallback => {
        // console.log(`callbackFactory:   ${JSON.stringify(callback)}`);
        return (err: NodeJS.ErrnoException | null) => {
            // ロック解除
            this.qMap[path].lock = false;
            // console.log(`CallBack:     ${callback}`);
            // コールバックを呼び出す
            (callback || (() => { }))(err);
            if (err) {
                console.log(err);
            } else {
                // キューがあれば書き込み
                const param = this.qMap[path].q.shift();
                if (param) {
                    this.qMap[path].lock = true;
                    if (param.type === 'writeFile') {
                        fs.writeFile(path, param.data as string | NodeJS.ArrayBufferView, this.callbackFactory(path, param.callback));
                    } else if (param.type === 'appendFile') {
                        fs.appendFile(path, param.data as string | Uint8Array, this.callbackFactory(path, param.callback));
                    } else {
                        console.log('error');
                    }
                } else {
                    // キューがなければ何もしない
                }
            }
        };
    };

    addQ = (type: 'writeFile' | 'appendFile', file: PathOrFileDescriptor, data: string | NodeJS.ArrayBufferView | Uint8Array, options?: WriteFileOptions | NoParamCallback, callback?: NoParamCallback): void => {
        const path = file.toString();
        // console.log(`addQ:${callback}`);
        // qMapの初期化
        if (!this.qMap[path]) {
            this.qMap[path] = { lock: false, q: [] };
        } else { }

        // キューに追加
        if (callback) {
            this.qMap[path].q.push({ type, file, data, options, callback });
        } else {
            this.qMap[path].q.push({ type, file, data, callback: options as NoParamCallback });
        }

        // ロックされているかどうか
        if (this.qMap[path].lock) {
        } else {
            // ロックされていない場合は書き込み
            this.callbackFactory(path, callback)(null);
        }
    }
    writeFile = (file: PathOrFileDescriptor, data: string | NodeJS.ArrayBufferView, options: WriteFileOptions | NoParamCallback, callback?: NoParamCallback): void => {
        this.addQ('writeFile', file, data, options, callback);
    }
    appendFile = (file: PathOrFileDescriptor, data: string | Uint8Array, options: WriteFileOptions | NoParamCallback, callback?: NoParamCallback): void => {
        this.addQ('appendFile', file, data, options, callback);
    }
}

interface FsQueueParam {
    type: 'writeFile' | 'appendFile';
    file: PathOrFileDescriptor;
    data: string | NodeJS.ArrayBufferView | Uint8Array;
    options?: WriteFileOptions | NoParamCallback;
    callback?: NoParamCallback;
}

interface FsQueue {
    writeFile(file: PathOrFileDescriptor, data: string | NodeJS.ArrayBufferView, options: WriteFileOptions, callback: NoParamCallback): void;
    writeFile(path: PathOrFileDescriptor, data: string | NodeJS.ArrayBufferView, callback: NoParamCallback): void;

    appendFile(path: PathOrFileDescriptor, data: string | Uint8Array, options: WriteFileOptions, callback: NoParamCallback): void;
    appendFile(file: PathOrFileDescriptor, data: string | Uint8Array, callback: NoParamCallback): void;
}

export default new FsQueueImpl() as FsQueue;