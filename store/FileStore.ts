import { readFileSync, writeFileSync } from 'fs';
import { Store } from './Store.interface';
import { createHash } from 'crypto';

export class FileStore implements Store {
    constructor(private options: {
        pathStore: string;
    }) { }

    async write(bf: Buffer) {
        writeFileSync(this.options.pathStore, bf);
    }

    async read() {
        return readFileSync(this.options.pathStore);
    }

    async hash() {
        return createHash('md5').update(readFileSync(this.options.pathStore)).digest('hex');
    }
}
