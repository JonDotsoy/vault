import { Assertion } from "chai"
import assert from "assert"
import { existsSync, readFileSync } from "fs"
import { inspect } from "util"
import { KeyPair } from "../vault/KeyPair"

const once = <T>(f: () => T, m?: T) => () => ((m = m ?? f()), m)

describe("VaultRepository", () => {
  const toVaultRepository = once(
    async () => new (await import("./VaultRepository")).VaultRepository()
  )

  it("publish new vault repository", async () => {
    const vaultRepository = await toVaultRepository()

    const published = await vaultRepository.publish({
      vaultStore: "asd",
    })
  })

  it("read vault repository", async () => {
    const vaultRepository = await toVaultRepository()

    const published = await vaultRepository.publish({
      vaultStore: "asd asd",
    })

    const keyPair = await KeyPair.resolve({
      publicKey: published.publicKey,
      privateKey: published.privateKey,
    })

    const readSign = await keyPair.createSigner("read").sign()

    const bodyResult = await vaultRepository.read({
      id: published.id,
      readSign: readSign,
    })

    // console.log(bodyResult)
  })

  it("delete vault repository", async () => {
    const vaultRepository = await toVaultRepository()

    const published = await vaultRepository.publish({
      vaultStore: "asd asd",
    })

    const keyPair = await KeyPair.resolve({
      publicKey: published.publicKey,
      privateKey: published.privateKey,
    })

    const db = vaultRepository["db"]

    const pathid = db["toPathStoredById"](published.id)

    assert.ok(existsSync(pathid), "Not exists file")

    await vaultRepository.delete({
      id: published.id,
      deleteSign: await keyPair.createSigner("delete").sign(),
    })

    assert.ok(!existsSync(pathid), "Not deleted")
  })

  it("update vault repository", async () => {
    const vaultRepository = await toVaultRepository()

    const published = await vaultRepository.publish({
      vaultStore: "asd asd",
    })

    const db = vaultRepository["db"]
    const pathid = db["toPathStoredById"](published.id)

    console.log(readFileSync(pathid, "utf8"))

    const keyPair = await KeyPair.resolve({
      publicKey: published.publicKey,
      privateKey: published.privateKey,
    })

    await vaultRepository.update({
      id: published.id,
      updateSign: await keyPair.createSigner("update").sign(),
      vaultStore: "bbbb",
    })

    console.log(readFileSync(pathid, "utf8"))
  })
})
