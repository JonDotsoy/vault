import { existsSync, readFileSync, writeFileSync } from "fs"
import { Store } from "./Store.interface"
import { createHash } from "crypto"

export class FileStore implements Store {
  constructor(
    private options: {
      pathStore: string
    }
  ) {}

  async write(bf: Buffer) {
    writeFileSync(this.options.pathStore, bf)
  }

  async read() {
    if (existsSync(this.options.pathStore)) {
      return readFileSync(this.options.pathStore)
    }
    return null
  }

  async hash() {
    return createHash("md5")
      .update(readFileSync(this.options.pathStore))
      .digest("hex")
  }
}
