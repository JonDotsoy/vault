import { Vault } from "./Vault"
import { FileStore } from "../stores/FileStore"
import crypto from "crypto"
import chai, { expect } from "chai"
import { writeFileSync } from "fs"

const p = (p: string, ext: string = ".vault") => `${__dirname}/${p}${ext}`

const publicKey =
  "MEgCQQC8QHhm1a3TEOO502VTldRTrI9UQ7igp7nSkXVFtOdSj35lWkXSan93DMqVHiKaCeYKwWzyI+KDHOyyhU5NeSnDAgMBAAE"
const privateKey =
  "MIIBOwIBAAJBALxAeGbVrdMQ47nTZVOV1FOsj1RDuKCnudKRdUW051KPfmVaRdJqf3cMypUeIpoJ5grBbPIj4oMc7LKFTk15KcMCAwEAAQJANNpk83pKs1eqmCGh8TW/xz5Lf30D+RceNOBh7JA94g+reu+28URDrhNzoGJWqnMk3CAD5Xr3xPWe9nNPqinZAQIhAPYD7Oc7xzOzZspCk96JBt97F+kkDl4JXEhTwUWg1EsVAiEAw+RjU3HAY40ClTG7zz3XoGTafQzgITFw5MI9fj8193cCIQCeMbv+nQPlDPGGEfW/3WEcB61Cb7sFYQOERsc7HMYmWQIgeWoZViLvB8TikO5eZbkC6NsZwOA2Gty2CFOMIa+0F0kCIQDGHwUnBZ7oaOW/r/l/GRrmq04a4SRhKlSQW7HTnISaGg"

describe("Vault", () => {
  it("should auto generate keys (modulusLength: 512)", async () => {
    const vault = await Vault.createVault({
      store: new FileStore({ pathStore: p(".test1") }),
      modulusLength: 512,
    })

    writeFileSync(p(".k1", ".json"), JSON.stringify(vault, null, 2))

    chai.expect(vault).property("privateKey").is.instanceOf(crypto.KeyObject)
    chai.expect(vault).property("publicKey").is.instanceOf(crypto.KeyObject)
  })

  it("should auto generate keys (modulusLength: 1024)", async () => {
    const vault = await Vault.createVault({
      store: new FileStore({ pathStore: p(".test1") }),
      modulusLength: 1024,
    })

    writeFileSync(p(".k2", ".json"), JSON.stringify(vault, null, 2))

    chai.expect(vault).property("privateKey").is.instanceOf(crypto.KeyObject)
    chai.expect(vault).property("publicKey").is.instanceOf(crypto.KeyObject)
  })

  it("should auto generate keys (modulusLength: 2048)", async () => {
    const vault = await Vault.createVault({
      store: new FileStore({ pathStore: p(".test1") }),
      modulusLength: 2048,
    })

    writeFileSync(p(".k3", ".json"), JSON.stringify(vault, null, 2))

    chai.expect(vault).property("privateKey").is.instanceOf(crypto.KeyObject)
    chai.expect(vault).property("publicKey").is.instanceOf(crypto.KeyObject)
  })

  it("should auto generate keys (modulusLength: 4096)", async () => {
    const vault = await Vault.createVault({
      store: new FileStore({ pathStore: p(".test1") }),
      modulusLength: 4096,
    })

    writeFileSync(p(".k4", ".json"), JSON.stringify(vault, null, 2))

    chai.expect(vault).property("privateKey").is.instanceOf(crypto.KeyObject)
    chai.expect(vault).property("publicKey").is.instanceOf(crypto.KeyObject)
  })

  it("should create a vault only read", async () => {
    const vault = await Vault.createVault({
      store: new FileStore({ pathStore: p(".test2") }),
      publicKey: publicKey,
    })

    chai.expect(vault).property("privateKey").is.undefined
    chai.expect(vault).property("publicKey").is.instanceOf(crypto.KeyObject)
  })

  it("should create a vault manager", async () => {
    const vault = await Vault.createVault({
      store: new FileStore({ pathStore: p(".test3") }),
      publicKey: publicKey,
      privateKey: privateKey,
    })

    chai.expect(vault).property("privateKey").is.instanceOf(crypto.KeyObject)
    chai.expect(vault).property("publicKey").is.instanceOf(crypto.KeyObject)
  })

  it("should write options without problems", async () => {
    const vault = await Vault.createVault({
      store: new FileStore({ pathStore: p(".test4") }),
      publicKey: publicKey,
      privateKey: privateKey,
    })

    await vault.saveConfigs({
      option: "string",
      asd: {
        sdf: "asd",
      },
    })
  })

  it.skip("should read options with only public key", async () => {
    const vault = await Vault.createVault({
      store: new FileStore({ pathStore: p(".test5") }),
      publicKey: publicKey,
    })

    expect(await vault.readConfigs())
      .property("option")
      .is.a("string")
  })
})
