export interface Store {
  write(buffer: Buffer): Promise<void>
  read(): Promise<Buffer | null>
  hash(): Promise<string>
}
