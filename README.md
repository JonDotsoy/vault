# 📦🔐Vault

[![Try @jondotsoy/vault on RunKit](https://badge.runkitcdn.com/@jondotsoy/vault.svg)](https://npm.runkit.com/@jondotsoy/vault)

Protect your data with a json crypto storage. This is a opensource solution to shared configurations on cloud.

**Sample**

```ts
import { Vault, RemoteStore } from "@jondotsoy/vault"

const vaultPublicKey = process.env.VAULT_PUBLICKEY
const vaultRemoteId = process.env.VAULT_REMOTE_ID
const vaultRemoteReadKey = process.env.VAULT_REMOTE_READKEY

const vault = await Vault.create<{ db: { uri: string } }>({
  store: new RemoteStore({
    id: vaultRemoteId,
    readkey: vaultRemoteReadKey,
  }),
  publicKey: vaultPublicKey,
});

const configs = await vault.readConfigs();

const mongoUri = configs.db.uri;
// ...
```

## How to use (API)

**Install with npm**

```sh
npm i @jondotsoy/vault
```

and require the vault

```ts
import { Vault, FileStore } from "@jondotsoy/vault"
```

```ts
const vault = await Vault.create({
  store: new FileStore({ pathStore: "FILEPATH" }),
  publicKey: publicKey,
})

const configs = await vault.readConfigs() // [MyConfigs]
```

### Create a Vault

```ts
const vault = await Vault.create({
  store: new FileStore({ pathStore: "FILEPATH" }),
  modulusLength: 512,
})

const { publicKey, privateKey } = vault.export()

publicKey // MEgCQQC8QHhm1a3TEOO502VTldRTrI9UQ...
privateKey // MIIBOwIBAAJBALxAeGbVrdMQ47nTZVOV1FOsj1RDuKCnud...

await vault.saveConfigs(MyConfigs)

// $ cat FILEPATH
// lWM4ZtHZE...
```

### Use a Vault

```ts
const vault = await Vault.create({
  store: new FileStore({ pathStore: "FILEPATH" }),
  publicKey: publicKey,
})

await vault.readConfigs() // [MyConfigs]
```

## Remote Store

Create, share
