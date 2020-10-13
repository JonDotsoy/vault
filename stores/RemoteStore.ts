import { throws } from "../lib/throws"
import { RepositoryClient } from "../repository/RepositoryClient"
import { KeyPair } from "../vault/KeyPair"
import { Store } from "./Store.interface"

type RemoteStoreOptionsBase = {
  repositoryClient?: RepositoryClient
  id: string
}

type RemoteStoreOptions = RemoteStoreOptionsBase & (
  | {
    readkey: string
  }
  | {
    publicKey: string
    privateKey?: string
  }
)

export class RemoteStore implements Store {
  constructor(private options: RemoteStoreOptions) { }

  readonly repositoryClient =
    this.options.repositoryClient ?? new RepositoryClient()
  readonly id = this.options.id
  readonly readkey = 'readkey' in this.options ? this.options.readkey : undefined
  readonly keyPair = 'publicKey' in this.options
    ? KeyPair.resolve({
      publicKey: this.options.publicKey,
      privateKey: this.options.privateKey,
    })
    : undefined
  readonly publicKey = this.keyPair?.then(k => k.publicKey)
  readonly privateKey = this.keyPair?.then(k => k.privateKey)

  async write(update: Buffer): Promise<void> {
    const updateSign = await this.getUpdateSign()
    await this.repositoryClient.update(this.id, updateSign, update)
  }

  async read(): Promise<Buffer | null> {
    const readkey = await this.getSignRead()
    const res = await this.repositoryClient.read(this.id, readkey)
    return res.vaultStore ? Buffer.from(res.vaultStore, "base64") : null
  }

  async genSign(signBody: "read" | "update" | "delete") {
    const keyPair = await this.keyPair
    return keyPair?.createSigner(signBody).sign() ?? throws(new Error('Is not posible create sign key'))
  }

  async getSignRead() {
    return this.readkey ?? await this.genSign("read")
  }

  async getUpdateSign() {
    return this.genSign("update")
  }

  async getSignDelete() {
    return this.genSign("delete")
  }

  hash(): Promise<string> {
    return Promise.resolve(this.id)
  }

  async export() {
    const keyPair = await this.keyPair

    return {
      id: this.id,
      ...keyPair?.export(),
    }
  }

  static async create(options?: Partial<RemoteStoreOptions>) {
    const repositoryClient = options?.repositoryClient ?? new RepositoryClient()

    const { id, publicKey, privateKey } = await repositoryClient.create()

    return new RemoteStore({
      id,
      publicKey,
      privateKey,
      repositoryClient,
    })
  }
}
