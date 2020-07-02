import crypto from "crypto"
import { Store } from "../stores/Store.interface"
import { inspect } from "util"
import { KeyPair, CreateKeyPairOptions } from "./KeyPair"

type CreateVaultOptions = { store: Store } & CreateKeyPairOptions

export class Vault<T = any> {
  private constructor(
    private readonly options: {
      store: Store
      keyPair: KeyPair
    }
  ) {}

  readonly store = this.options.store
  readonly keyPair = this.options.keyPair
  readonly publicKey = this.options.keyPair.publicKey
  readonly privateKey = this.options.keyPair.privateKey

  async readConfigs(): Promise<T | null> {
    const bufferEncripted = await this.store.read()
    if (!bufferEncripted) return null
    return JSON.parse(
      crypto.publicDecrypt(this.publicKey, bufferEncripted).toString()
    )
  }

  async saveConfigs(nextConfig: T) {
    if (!this.privateKey) {
      throw new Error("Cannot found private key")
    }
    const bufferEncripted = crypto.privateEncrypt(
      this.privateKey,
      Buffer.from(JSON.stringify(nextConfig))
    )
    await this.store.write(bufferEncripted)
  }

  /**
   * Return the key pair on base64 format
   */
  export(): { publicKey: string; privateKey?: string } {
    return this.keyPair.export()
  }

  _title() {
    return this.keyPair.exportPublicKey().slice(0, 25)
  }

  toJSON() {
    return {
      _title: this._title(),
      ...this.export(),
    }
  }

  [inspect.custom](depth: number, opts: any) {
    const nextDepth = depth - 1
    if (this.privateKey) {
      return `Vault ${inspect(this.export(), { ...opts, depth: nextDepth })}`
    } else {
      return `Vault [READABLE] ${inspect(this.export(), {
        ...opts,
        depth: nextDepth,
      })}`
    }
  }

  /** Create a Vault */
  static async createVault<T = any>(options: CreateVaultOptions) {
    const keyPair = await KeyPair.resolve(options)

    return new Vault<T>({
      keyPair,
      store: options.store,
    })
  }

  static async createAndReadConfigs<T = any>(options: CreateVaultOptions) {
    const vault = await this.createVault<T>(options)
    return vault.readConfigs()
  }
}
