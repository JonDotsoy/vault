import { existsSync, readFileSync, writeFileSync } from "fs"
import { homedir } from "os"
import { RemoteStore } from "../stores/RemoteStore"
import { Store, StoreExport } from "../stores/Store.interface"
import { Vault, VaultExport } from "../vault/Vault"
import url from "url"

export interface VaultElement {
  publicKey: string
  privateKey?: string
}

interface VaultItem {
  store: StoreExport
  vault: VaultExport
  createdAt: string
}

interface VaultStore {
  vaults?: VaultItem[]
}

export class LocalVaultStore {
  constructor(readonly pathstore = `${homedir()}/.vault`) {}

  read(): VaultStore {
    if (!existsSync(this.pathstore)) return {}
    return JSON.parse(readFileSync(this.pathstore, "utf8"))
  }

  save(d: VaultStore) {
    writeFileSync(this.pathstore, JSON.stringify(d, null, 2))
  }

  pushVault = async (vault: Vault) => {
    const b = this.read()

    const nextVaultStore: VaultItem = {
      vault: vault.export(),
      store: await vault.store.export(),
      createdAt: new Date().toJSON(),
    }

    this.save({
      ...b,
      vaults: [...(b.vaults ?? []), nextVaultStore],
    })
  }

  listVaults() {
    return this.read().vaults ?? []
  }

  getVaultByStartId = (vaultId: any) => {
    const vaults = this.read()

    return vaults.vaults?.find((v) => v.vault.publicKey.startsWith(vaultId))
  }
}
