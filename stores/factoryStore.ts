import { throws } from "../lib/throws"
import { FileStore } from "./FileStore"
import { RemoteStore } from "./RemoteStore"
import { StoreExport } from "./Store.interface"

export const factoryStore = async (storeExport: StoreExport) => {
  switch (storeExport.protocol) {
    case "fs":
      return await FileStore.from(storeExport)
    case "rs":
      return await RemoteStore.from(storeExport)
    default:
      throw new Error("Protocol store is not supported")
  }
}
