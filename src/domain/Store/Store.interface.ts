export interface Store {
    write(buffer: Buffer): Promise<void>;
    read(): Promise<Buffer>;
    hash(): Promise<string>;
}
