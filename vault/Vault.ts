import crypto from 'crypto';
import { Store } from '../store/Store.interface';
import { inspect } from 'util';

const bufferToBase64 = (bf: Buffer) => bf.toString('base64').replace(/=*$/, '');

type Configs = any;

export class Vault {
    private constructor(private readonly options: {
        store: Store;
        publicKey: crypto.KeyObject;
        privateKey?: crypto.KeyObject;
    }) { }

    private readonly store = this.options.store;

    readonly publicKey = this.options.publicKey;
    readonly privateKey = this.options.privateKey;

    export() {
        if (this.privateKey) {
            return {
                publicKey: bufferToBase64(this.publicKey.export({ type: 'pkcs1', format: 'der' })),
                privateKey: bufferToBase64(this.privateKey.export({ type: 'pkcs1', format: 'der' })),
            };
        } else {
            return {
                publicKey: bufferToBase64(this.publicKey.export({ type: 'pkcs1', format: 'der' })),
            };
        }
    }

    toJSON() {
        return this.export();
    }

    async readConfig() {
        const bufferEncripted = await this.store.read();
        return JSON.parse(crypto.publicDecrypt(this.publicKey, bufferEncripted).toString());
    }

    async saveConfigs(nextConfig: Configs) {
        if (!this.privateKey) {
            throw new Error('Cannot found private key');
        }
        const bufferEncripted = crypto.privateEncrypt(this.privateKey, Buffer.from(JSON.stringify(nextConfig)))
        await this.store.write(bufferEncripted);
    }

    [inspect.custom](depth: number, opts: any) {
        const nextDepth = depth - 1;
        if (this.privateKey) {
            return `Vault ${inspect(this.export(), { ...opts, depth: nextDepth })}`;
        } else {
            return `Vault [READABLE] ${inspect(this.export(), { ...opts, depth: nextDepth })}`;
        }
    }

    static async create(options:
        | {
            store: Store;
            publicKey: string;
            privateKey?: string;
        }
        | {
            store: Store;
            modulusLength: 512 | 1024 | 2048 | 4096;
        }
    ) {
        let publicKey: crypto.KeyObject;
        let privateKey: crypto.KeyObject | undefined;

        if ('publicKey' in options && options.publicKey) {
            publicKey = crypto.createPublicKey({
                key: Buffer.from(options.publicKey, 'base64'),
                format: 'der',
                type: 'pkcs1',
            });
            if (options.privateKey) {
                privateKey = crypto.createPrivateKey({
                    key: Buffer.from(options.privateKey, 'base64'),
                    format: 'der',
                    type: 'pkcs1',
                });
            }
        } else if ('modulusLength' in options && options.modulusLength) {
            const keyPair = crypto.generateKeyPairSync('rsa', {
                modulusLength: options?.modulusLength ?? 512,
            });
            publicKey = keyPair.publicKey;
            privateKey = keyPair.privateKey;
        } else {
            throw new Error('Please define the public key to read configs');
        }

        return new Vault({
            publicKey,
            privateKey,
            store: options.store,
        });
    }
}
