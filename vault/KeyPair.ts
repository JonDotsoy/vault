import crypto, { randomBytes } from "crypto"
import { inspect, promisify } from "util"
import { bufferToBase64 } from "./bufferToBase64"
import { Hashes, Signer } from "./Signer"

const generateKeyPair = promisify(crypto.generateKeyPair)

type SecondArgs<F> = F extends (buf: string, enc: infer R) => unknown
  ? R
  : never

type CreateKeyPairOptionsKeyGenerator = {
  modulusLength: 512 | 1024 | 2048 | 4096
}

type CreateKeyPairOptionsKeyPair = {
  publicKey: string
  privateKey?: string
}

export type CreateKeyPairOptions =
  | CreateKeyPairOptionsKeyPair
  | CreateKeyPairOptionsKeyGenerator

const isKeyPairOptions = (
  o: CreateKeyPairOptions
): o is CreateKeyPairOptionsKeyPair => Boolean("publicKey" in o && o.publicKey)
const isKeyGeneratorOptions = (
  o: CreateKeyPairOptions
): o is CreateKeyPairOptionsKeyGenerator =>
  Boolean("modulusLength" in o && o.modulusLength)

export class KeyPair {
  private constructor(
    private readonly options: {
      publicKey: crypto.KeyObject
      privateKey?: crypto.KeyObject
    }
  ) {}

  readonly publicKey = this.options.publicKey
  readonly privateKey = this.options.privateKey

  /**
   * Return the key pair on base64 format
   */
  export(): { publicKey: string; privateKey?: string } {
    return {
      publicKey: this.exportPublicKey(),
      privateKey: this.exportPrivateKey(),
    }
  }

  exportPublicKey() {
    return bufferToBase64(
      this.publicKey.export({ type: "pkcs1", format: "der" })
    )
  }
  exportPrivateKey() {
    return this.privateKey
      ? bufferToBase64(this.privateKey.export({ type: "pkcs1", format: "der" }))
      : undefined
  }

  toJSON() {
    return this.export()
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

  createSigner(buf: string | Buffer, enc?: SecondArgs<typeof Buffer.from>) {
    return new Signer({
      keyPair: this,
      buf: buf instanceof Buffer ? Buffer.from(buf) : Buffer.from(buf, enc),
      hash: Hashes["RSA-SHA1"],
    })
  }

  static resolve = async (options: CreateKeyPairOptions) => {
    const keyPair = await KeyPair.resolveKeyPair(options)
    return new KeyPair({
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    })
  }

  private static async resolveKeyPair(options: CreateKeyPairOptions) {
    let publicKey: crypto.KeyObject
    let privateKey: crypto.KeyObject | undefined

    if (isKeyPairOptions(options)) {
      publicKey = KeyPair.optionsToPublicKey(options)
      privateKey = KeyPair.optionsToPrivateKey(options)
    } else if (isKeyGeneratorOptions(options)) {
      const keyPair = await KeyPair.optionsToKeyPair(options)
      publicKey = keyPair.publicKey
      privateKey = keyPair.privateKey
    } else {
      throw new Error("Please define the public key to read configs")
    }

    return {
      publicKey,
      privateKey,
    }
  }

  private static optionsToKeyPair(options: CreateKeyPairOptionsKeyGenerator) {
    return generateKeyPair("rsa", {
      modulusLength: options?.modulusLength ?? 512,
    })
  }

  private static optionsToPublicKey(options: CreateKeyPairOptionsKeyPair) {
    return crypto.createPublicKey({
      key: Buffer.from(options.publicKey, "base64"),
      format: "der",
      type: "pkcs1",
    })
  }

  private static optionsToPrivateKey(options: CreateKeyPairOptionsKeyPair) {
    if ("privateKey" in options && options.privateKey) {
      return crypto.createPrivateKey({
        key: Buffer.from(options.privateKey, "base64"),
        format: "der",
        type: "pkcs1",
      })
    }
  }
}
