import { RepositoryClient } from "../repository/RepositoryClient"
import { KeyPair } from "../vault/KeyPair"
import { Store } from "./Store.interface"

interface RemoteStoreOptions {
  repositoryClient?: RepositoryClient
  id: string
  publicKey: string
  privateKey?: string
}

export class RemoteStore implements Store {
  constructor(private options: RemoteStoreOptions) {}

  readonly repositoryClient =
    this.options.repositoryClient ?? new RepositoryClient()
  readonly id = this.options.id
  readonly publicKey = this.options.publicKey
  readonly privateKey = this.options.privateKey
  readonly keyPair = KeyPair.resolve({
    publicKey: this.publicKey,
    privateKey: this.privateKey,
  })

  async write(update: Buffer): Promise<void> {
    const updateSign = await this.getUpdateSign()
    await this.repositoryClient.update(this.id, updateSign, update)
  }

  async read(): Promise<Buffer | null> {
    const readkey = await this.getSignRead()
    const res = await this.repositoryClient.read(this.id, readkey)
    return res.vaultStore ? Buffer.from(res.vaultStore, "base64") : null
  }

  async getSign(signBody: "read" | "update" | "delete") {
    const keyPair = await this.keyPair
    const readkey = await keyPair.createSigner(signBody).sign()
    return readkey
  }

  async getSignRead() {
    return this.getSign("read")
  }

  async getUpdateSign() {
    return this.getSign("update")
  }

  async getSignDelete() {
    return this.getSign("delete")
  }

  hash(): Promise<string> {
    return Promise.resolve(this.id)
  }

  async export() {
    const keyPair = await this.keyPair

    return {
      id: this.id,
      ...keyPair.export(),
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
