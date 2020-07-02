import { create } from "domain"
import { homedir } from "os"
import { ID } from "./id"
import { resolveDir, VaultRepositoryDB } from "./VaultRepositoryDB"

const once = <T>(f: () => T, m?: T) => () => ((m = m ?? f()), m)

describe("VaultRepositoryDB", () => {
  it("resolveDir", () => {
    resolveDir(`${__dirname}/._tmp_dir/./dira/dirb/dirc`)
  })

  describe("instance", () => {
    const toVaultRepositoryDB = once(
      () =>
        new VaultRepositoryDB({
          cwdRegistries: `${__dirname}/._registries`,
        })
    )

    it.skip("create", async () => {
      const vaultRepositoryDB = toVaultRepositoryDB()

      await vaultRepositoryDB.create({ vaultStore: "a", publicKey: "" })
    })

    it.skip("find", async () => {
      const vaultRepositoryDB = toVaultRepositoryDB()

      console.log(await vaultRepositoryDB.find())
    })

    it.skip("find by id", async () => {
      const vaultRepositoryDB = toVaultRepositoryDB()

      console.log(
        await vaultRepositoryDB.find([
          {
            id: {
              $eq: ID.from("84e08f2e250d6f3b67d555ed0a310a6b66767035396475"),
            },
          },
        ])
      )
    })

    it.skip("delete", async () => {
      const vaultRepositoryDB = toVaultRepositoryDB()

      const { id } = await vaultRepositoryDB.create({
        vaultStore: "a",
        publicKey: "",
      })

      console.log(await vaultRepositoryDB.findOne([{ id: { $eq: id } }]))

      await vaultRepositoryDB.deleteOne([{ id: { $eq: id } }])

      console.log(await vaultRepositoryDB.findOne([{ id: { $eq: id } }]))
    })
  })
})
