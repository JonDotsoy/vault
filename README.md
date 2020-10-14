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
})

const configs = await vault.readConfigs()

const mongoUri = configs.db.uri
// ...
```

## Quick starter

You can start using vault in 2 steps.

1. Create your first vault using `npx @jondotsoy/vault vault create` in your terminal. This command configures and creates the vault in your machine, accessible from `$HOME/.vault`.
2. Configure the vault in your project installing vault using `npm i @jondotsoy/vault` and copy the next code in your source.

```ts
import { Vault, RemoteStore } from "@jondotsoy/vault"

const vaultPublicKey = process.env.VAULT_PUBLICKEY
const vaultRemoteId = process.env.VAULT_REMOTE_ID
const vaultRemoteReadKey = process.env.VAULT_REMOTE_READKEY

const vaultPromise = Vault.create({
  store: new RemoteStore({
    id: vaultRemoteId,
    readkey: vaultRemoteReadKey,
  }),
  publicKey: vaultPublicKey,
})

export const getVault = () => vaultPromise
```

You can obtain the environment values with `npx @jondotsoy/vault vault info`. While you be are the manager vault, you will use that command without problems.

> Remember this is only a sample that uses a singleton instance to read the vault. You can use your own implementation for your project.

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
