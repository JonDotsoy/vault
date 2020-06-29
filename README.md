# 📦🔐Vault

Protect your data with a json crypto storage.

## How to use (API)

```ts
const vault = await Vault.create({
    store: new FileStore({ pathStore: 'FILEPATH' }),
    publicKey: publicKey,
});

const configs = await vault.readConfig(); // [MyConfigs]
```

### Create a Vault

```ts
const vault = await Vault.create({
    store: new FileStore({ pathStore: 'FILEPATH' }),
    modulusLength: 512,
});

const {publicKey, privateKey} = vault.export(); // MEgCQQC8QHhm1a3TEOO502VTldRTrI9UQ...

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

await vault.readConfig(); // [MyConfigs]
```

