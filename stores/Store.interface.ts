import { UrlWithParsedQuery } from "url"

export type StoreExport = Required<Pick<UrlWithParsedQuery, "protocol">> &
  Partial<Pick<UrlWithParsedQuery, "host" | "pathname" | "query">>

export interface Store {
  write(buffer: Buffer): Promise<void>
  read(): Promise<Buffer | null>
  hash(): Promise<string>
  export(): Promise<StoreExport>
  // public static from(storeExport: StoreExport): Promise<Store>
}
