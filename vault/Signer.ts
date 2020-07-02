import crypto from "crypto"
import { bufferToBase64 } from "./bufferToBase64"
import { KeyPair } from "./KeyPair"

export enum Hashes {
  "RSA-MD4" = "RSA-MD4",
  "RSA-MD5" = "RSA-MD5",
  "RSA-MDC2" = "RSA-MDC2",
  "RSA-RIPEMD160" = "RSA-RIPEMD160",
  "RSA-SHA1" = "RSA-SHA1",
  "RSA-SHA1-2" = "RSA-SHA1-2",
  "RSA-SHA224" = "RSA-SHA224",
  "RSA-SHA256" = "RSA-SHA256",
  "RSA-SHA3-224" = "RSA-SHA3-224",
  "RSA-SHA3-256" = "RSA-SHA3-256",
  "RSA-SHA3-384" = "RSA-SHA3-384",
  "RSA-SHA3-512" = "RSA-SHA3-512",
  "RSA-SHA384" = "RSA-SHA384",
  "RSA-SHA512" = "RSA-SHA512",
  "RSA-SHA512/224" = "RSA-SHA512/224",
  "RSA-SHA512/256" = "RSA-SHA512/256",
  "RSA-SM3" = "RSA-SM3",
}

export class Signer {
  constructor(
    private options: {
      keyPair: KeyPair
      buf: Buffer
      hash: Hashes
    }
  ) {}

  readonly hash = this.options.hash
  readonly buf = this.options.buf
  readonly keyPair = this.options.keyPair

  async sign() {
    const privateKey = this.keyPair.privateKey

    if (!privateKey) throw new Error("Require private key")
    const s = crypto.createSign(this.hash)
    s.update(this.buf)
    s.end()
    return bufferToBase64(s.sign(privateKey))
  }

  async verify(signature: string) {
    const v = crypto.createVerify(this.hash)
    v.update(this.buf)
    v.end()
    return v.verify(this.keyPair.publicKey, Buffer.from(signature, "base64"))
  }
}
