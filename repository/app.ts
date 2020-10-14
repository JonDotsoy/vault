import { Router } from "./Route"
import { useBodyJSON, useUrl, useUrlRegExpExec, useBodyBuffer } from "./useReq"
import { VaultRepository } from "./VaultRepository"

export class App {
  constructor(
    readonly router = new Router(),
    readonly vaultRepository = new VaultRepository()
  ) {}

  handlerListVaults = this.router.addRoute({
    mathod: "GET",
    url: /^\/vault$/,
    handler: async (req, res) => {
      const query = useUrl(req, res).query

      const queryLimit = query.limit
      if (queryLimit && !/^\d+$/.test(queryLimit.toString()))
        throw new TypeError('Query "limit" is not a number')

      const limit = Number(queryLimit ?? 100)

      const items = await this.vaultRepository.list({
        limit,
        continueToken: query.continueToken?.toString(),
      })

      res.setHeader("Content-Type", "application/json")
      res.write(JSON.stringify(items))
      res.end()
    },
  })

  handlerPublishVault = this.router.addRoute({
    mathod: "POST",
    url: /^\/vault$/,
    handler: async (req, res) => {
      const body = await useBodyJSON(req, res)

      const vaultPublished = await this.vaultRepository.publish({
        vaultStore: body.vaultStore,
        publicKey: body.publicKey,
        modulusLength: body.modulusLength,
      })

      res.setHeader("Content-Type", "application/json")
      res.write(JSON.stringify(vaultPublished))
      res.end()
    },
  })

  handlerReadVault = this.router.addRoute({
    mathod: "GET",
    url: /^\/vault\/(?<vaultId>\w+)$/,
    handler: async (req, res) => {
      const vaultId = useUrlRegExpExec(req, res).groups?.vaultId
      const readSign = useUrl(req, res).query.key

      if (!vaultId) throw new Error("Cannot found vault")
      if (typeof readSign !== "string")
        throw new Error("Requiere key parameter on query")

      const value = await this.vaultRepository.read({
        id: vaultId,
        readSign: readSign,
      })

      if (!value) throw new Error("Cannot found vault")

      res.write(JSON.stringify(value))
      res.end()
    },
  })

  handlerUpdateVault = this.router.addRoute({
    mathod: "PUT",
    url: /^\/vault\/(?<vaultId>\w+)$/,
    handler: async (req, res) => {
      const vaultId = useUrlRegExpExec(req, res).groups?.vaultId
      if (!vaultId) throw new Error("Cannot found vault")
      const updateSign = useUrl(req, res).query.key
      if (typeof updateSign !== "string")
        throw new Error("Requiere key parameter on query")

      const body = await useBodyBuffer(req, res)

      await this.vaultRepository.update({
        id: vaultId,
        updateSign,
        vaultStore: body.toString("base64"),
      })

      res.setHeader("Content-Type", "application/json")
      res.write(JSON.stringify({}))
      res.end()
      return
    },
  })
}
