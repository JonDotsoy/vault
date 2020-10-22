import { throws } from "../lib/throws"
import { RepositoryClient } from "../repository/RepositoryClient"
import { KeyPair } from "../vault/KeyPair"
import { Store, StoreExport } from "./Store.interface"
import url from "url"
import { LocalStoreVaultConfigs } from "../bin/LocalStoreVaultConfigs"

type RemoteStoreOptions = {
  id: string
  repositoryClient?: RepositoryClient
  readkey?: string
  publicKey?: string
  privateKey?: string
}

export class RemoteStore implements Store {
  constructor(private options: RemoteStoreOptions) {}

  readonly repositoryClient =
    this.options.repositoryClient ?? new RepositoryClient()
  readonly id = this.options.id
  readonly readkey =
    "readkey" in this.options ? this.options.readkey : undefined
  readonly keyPair = this.options.publicKey
    ? KeyPair.resolve({
        publicKey: this.options.publicKey,
        privateKey: this.options.privateKey,
      })
    : undefined
  readonly publicKey = this.keyPair?.then((k) => k.publicKey)
  readonly privateKey = this.keyPair?.then((k) => k.privateKey)

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
    return (
      keyPair?.createSigner(signBody).sign() ??
      throws(new Error("Is not posible create sign key"))
    )
  }

  async getSignRead() {
    return this.readkey ?? (await this.genSign("read"))
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

  static readonly protocol = "vaultremotestore"

  async export(): Promise<StoreExport> {
    const keyPair = await this.keyPair

    const { host, pathname, query, protocol } = url.parse(
      this.repositoryClient.url,
      true,
      true
    )

    query.id = this.id

    if (protocol?.startsWith("https")) {
      query.ssl = "true"
    }

    if (this.readkey) {
      query.readkey = this.readkey
    }

    if (keyPair) {
      const { publicKey, privateKey } = keyPair.export()
      query.publicKey = publicKey
      if (privateKey) {
        query.privateKey = privateKey
      }
    }

    return {
      protocol: RemoteStore.protocol,
      host,
      pathname,
      query,
    }
  }

  static async from(a: StoreExport): Promise<RemoteStore> {
    const queryCaptureString = (
      query: url.UrlWithParsedQuery["query"] | undefined,
      path: string
    ) => {
      const e = query?.[path]
      if (!e) throw new Error(`Store without ${path}`)
      if (Array.isArray(e)) throw new Error(``)
      return e
    }

    const queryCaptureStringOrUndefined = (
      query: url.UrlWithParsedQuery["query"] | undefined,
      path: string
    ) => {
      const e = query?.[path]
      if (!e) return undefined
      if (Array.isArray(e)) throw new Error(``)
      return e
    }

    const { id, readkey, publicKey, privateKey, ssl, ...q } = a.query ?? {}

    return new RemoteStore({
      id: queryCaptureString(a.query, "id"),
      readkey: queryCaptureStringOrUndefined(a.query, "readkey"),
      publicKey: queryCaptureStringOrUndefined(a.query, "publicKey"),
      privateKey: queryCaptureStringOrUndefined(a.query, "privateKey"),
      repositoryClient: new RepositoryClient({
        url: url.format({
          protocol: ssl === "true" ? "https:" : "http:",
          slashes: true,
          hostname: a.pathname,
          pathname: a.pathname,
          query: q,
        }),
      }),
    })
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
