# 📦🔐Vault

[![Try @jondotsoy/vault on RunKit](https://badge.runkitcdn.com/@jondotsoy/vault.svg)](https://npm.runkit.com/@jondotsoy/vault)

Protect your data with a json crypto storage.

## How to use (API)

**Install with npm**

```sh
npm i @jondotsoy/vault
```

and require the vault

```ts
import { Vault, FileStore } from '@jondotsoy/vault';
```

```ts
const vault = await Vault.create({
    store: new FileStore({ pathStore: 'FILEPATH' }),
    publicKey: publicKey,
});

const configs = await vault.readConfigs(); // [MyConfigs]
```

### Create a Vault

```ts
const vault = await Vault.create({
    store: new FileStore({ pathStore: 'FILEPATH' }),
    modulusLength: 512,
});

const {publicKey, privateKey} = vault.export();

publicKey; // MEgCQQC8QHhm1a3TEOO502VTldRTrI9UQ...
privateKey; // MIIBOwIBAAJBALxAeGbVrdMQ47nTZVOV1FOsj1RDuKCnud...

await vault.saveConfigs(MyConfigs);

// $ cat FILEPATH
// lWM4ZtHZE...
```

### Use a Vault

```ts
const vault = await Vault.create({
    store: new FileStore({ pathStore: 'FILEPATH' }),
    publicKey: publicKey,
});

await vault.readConfigs(); // [MyConfigs]
```

