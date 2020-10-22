import { existsSync, readFileSync, writeFileSync, constants } from "fs"
import { Store, StoreExport } from "./Store.interface"
import { createHash } from "crypto"

export class FileStore implements Store {
  constructor(
    private options: {
      pathStore: string
    }
  ) {}

  async write(bf: Buffer) {
    writeFileSync(this.options.pathStore, bf, {
      mode: constants.S_IWUSR + constants.S_IRUSR,
    })
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

  static readonly protocol = "vaultfilestore"

  async export(): Promise<StoreExport> {
    return {
      protocol: FileStore.protocol,
      pathname: this.options.pathStore,
    }
  }

  static async from(storeExport: StoreExport): Promise<FileStore> {
    if (!storeExport.pathname) {
      throw new TypeError("Store pathname is undefined")
    }

    return new FileStore({
      pathStore: storeExport.pathname,
    })
  }
}
