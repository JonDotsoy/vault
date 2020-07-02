import { readFileSync } from "fs"

const once = <T>(f: () => T, m?: T) => () => ((m = m ?? f()), m)

const importDdefaultCredentials = (): {
  publicKey: string
  privateKey: string
} => JSON.parse(readFileSync(`${__dirname}/.demo.keys.json`, "utf-8"))

/**
 * Get the default credentials
 */
export const read = once(importDdefaultCredentials)
