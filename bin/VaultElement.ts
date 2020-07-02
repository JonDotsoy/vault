import { existsSync, readFileSync, writeFileSync } from "fs"
import { homedir } from "os"
import { RemoteStore } from "../stores/RemoteStore"
import { Vault } from "../vault/Vault"

export interface VaultElement {
  publicKey: string
  privateKey?: string
}

interface VaultItem {
  remoteStore?: {
    id: string
    publicKey: string
    privateKey?: string
  }
  vault: ReturnType<Vault["export"]>
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
    this.save({
      ...b,
      vaults: [
        ...(b.vaults ?? []),
        {
          vault: vault.export(),
          remoteStore:
            vault.store instanceof RemoteStore
              ? await vault.store.export()
              : undefined,
          createdAt: new Date().toJSON(),
        },
      ],
    })
  }

  getVaultByStartId = (vaultId: any) => {
    const vaults = this.read()

    return vaults.vaults?.find((v) => v.vault.publicKey.startsWith(vaultId))
  }
}
