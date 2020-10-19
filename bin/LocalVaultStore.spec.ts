import { RemoteStore } from "../stores/RemoteStore"
import { once } from "./once"
import { KeyPair } from "../vault/KeyPair"
import { Vault } from "../vault/Vault"
import { FileStore } from "../stores/FileStore"
import { expect } from "chai"
import { unlinkSync } from "fs"

const pathtmptolocalstorage = `${__dirname}/.vault.json`

describe("LocalVaultStore", () => {
  const getLocalVaultStore = once(async () => {
    const { LocalVaultStore } = await import("./LocalVaultStore")
    return new LocalVaultStore(pathtmptolocalstorage)
  })

  after(() => unlinkSync(pathtmptolocalstorage))

  it("hip", async () => {
    const localVaultStore = await getLocalVaultStore()

    console.log(localVaultStore.listVaults())
  })

  it("Push vault remove store", async () => {
    const store = new RemoteStore({
      id: "fakevault",
      ...(
        await KeyPair.resolve({
          modulusLength: 512,
        })
      ).export(),
    })

    const vault = await Vault.createVault({
      store,
      ...(
        await KeyPair.resolve({
          modulusLength: 512,
        })
      ).export(),
    })

    const localVaultStore = await getLocalVaultStore()

    const presize = localVaultStore.listVaults().length

    await localVaultStore.pushVault(vault)

    expect(localVaultStore.listVaults().length).is.eql(presize + 1)
  })

  it("Push vault filestore", async () => {
    const store = new FileStore({
      pathStore: `${__dirname}/.file`,
    })

    const vault = await Vault.createVault({
      store,
      ...(
        await KeyPair.resolve({
          modulusLength: 512,
        })
      ).export(),
    })

    const localVaultStore = await getLocalVaultStore()

    await vault.saveConfigs({})

    const presize = localVaultStore.listVaults().length

    await localVaultStore.pushVault(vault)

    expect(localVaultStore.listVaults().length).is.eql(presize + 1)
  })
})
