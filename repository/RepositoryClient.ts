import { LocalStoreVaultConfigs } from "../bin/LocalStoreVaultConfigs"
import { fetch } from "../lib/fetch"
import { throws } from "../lib/throws"
import url from "url"
import querystring from "querystring"

export class RepositoryClient {
  constructor(
    private options?: {
      url?: string
      driverLocalConfig?: LocalStoreVaultConfigs
    }
  ) {}

  private driverLocalConfig =
    this.options?.driverLocalConfig ?? new LocalStoreVaultConfigs()
  private localConfigs = this.driverLocalConfig.configs()

  readonly url = this.options?.url ?? this.localConfigs.url

  async create() {
    const res = await fetch({
      method: "POST",
      url: url.parse(`${this.url}/vault`),
      body: Buffer.from(JSON.stringify({})),
      headers: { "Content-Type": "application/json" },
    })

    return JSON.parse(res.body.toString()) as {
      id: string
      publicKey: string
      privateKey: string
    }
  }

  async read(vaultId: string, readkey: string) {
    const res = await fetch({
      method: "GET",
      url: url.parse(
        `${this.url}/vault/${vaultId}?key=${querystring.escape(readkey)}`
      ),
    })

    return JSON.parse(res.body.toString()) as {
      id: string
      createdAt: string
      vaultStore: string
    }
  }

  async update(id: string, updateSign: string, update: Buffer) {
    await fetch({
      method: "PUT",
      url: url.parse(
        `${this.url}/vault/${id}?key=${querystring.escape(updateSign)}`
      ),
      headers: {
        // "Content-Type": "application/json",
      },
      body: update,
    })
  }
}
