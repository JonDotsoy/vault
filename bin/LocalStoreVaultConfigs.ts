import { existsSync, readFileSync } from "fs"
import { homedir } from "os"
import { once } from "./once"
import path from "path"

export const vaultrcPath = `${homedir()}/.vaultrc`
export const vaultSchemaPath = path.resolve(
  `${__dirname}/../vaultrc.schema.json`
)

function parseOptionEditor(option: string | string[]) {
  if (Array.isArray(option)) return option
  switch (option) {
    case "vscode":
      return ["code", "--wait", "--new-window"]
    default:
      return ["vim"]
  }
}

export class LocalStoreVaultConfigs {
  constructor(
    readonly defconfigs = LocalStoreVaultConfigs.defaultConfigs as Partial<
      typeof LocalStoreVaultConfigs.defaultConfigs
    >
  ) {}

  static defaultConfigs = {
    vaultrcPath: vaultrcPath,
    url: "http://localhost:4874",
    editor: parseOptionEditor("vim"),
  }

  sconfigs: typeof LocalStoreVaultConfigs.defaultConfigs = Object.assign(
    {},
    LocalStoreVaultConfigs.defaultConfigs,
    this.defconfigs
  )

  configs = once(() => {
    const conf = this.readConfigs()
    return conf
  })

  private readConfigs() {
    const defaultConfigs = this.sconfigs

    type DefaultConfigs = typeof defaultConfigs
    type defaultConfigsChunkParts<
      T extends keyof DefaultConfigs = keyof DefaultConfigs
    > = [T, DefaultConfigs[T]]

    if (!existsSync(this.sconfigs.vaultrcPath)) return defaultConfigs

    try {
      const vaultrcConfigs: Partial<DefaultConfigs> = JSON.parse(
        readFileSync(this.sconfigs.vaultrcPath, "utf8")
      )

      return Object.entries(defaultConfigs).reduce((a, part) => {
        const [propertyValue, defaultValue] = part as defaultConfigsChunkParts
        switch (propertyValue) {
          case "editor": {
            a[propertyValue] = parseOptionEditor(
              vaultrcConfigs[propertyValue] ?? defaultValue
            )
            break
          }
          default: {
            // @ts-ignore
            a[propertyValue] = vaultrcConfigs[propertyValue] ?? defaultValue
            break
          }
        }
        return a
      }, {} as DefaultConfigs)
    } catch {
      return defaultConfigs
    }
  }
}
