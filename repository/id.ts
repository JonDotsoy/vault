import { randomBytes } from "crypto"
import { inspect, CustomInspectFunction } from "util"

export type IDLike = string | Buffer | ID

export class ID {
  private constructor(private readonly _buf = ID.generateBufferId()) {}

  toString() {
    return this._buf.toString("hex")
  }
  toJSON() {
    return this.toString()
  }
  toBuffer() {
    return this._buf
  }
  valueOf() {
    return this.toString()
  }

  [inspect.custom]: CustomInspectFunction = (_, option) =>
    `ID(${option.stylize(this.toString(), "string")})`

  static from(id?: IDLike | null) {
    if (id === undefined || id === null) return new ID()
    if (id instanceof ID) return id
    if (id instanceof Buffer) return new ID(id)
    if (typeof id === "string") return new ID(Buffer.from(id, "hex"))

    throw new TypeError("ID is not valid format")
  }

  private static n = 0
  private static generateBufferId() {
    this.n += 1
    return Buffer.concat([
      randomBytes(12),
      Buffer.from("\n"),
      Buffer.from(this.n.toString(36)),
      Buffer.from("\n"),
      Buffer.from(Date.now().toString(36)),
    ])
  }
}
