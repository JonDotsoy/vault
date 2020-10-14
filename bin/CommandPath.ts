import { EOL } from "os"
import { LocalStoreVaultConfigs } from "./LocalStoreVaultConfigs"
import { LocalVaultStore } from "./VaultElement"

type CommandPath = string | { label: string }

const arrStartWith = (
  arr: string[],
  startsWith: CommandPath[]
): { valid: boolean; options: {} } => {
  const options: { [k: string]: string } = {}

  for (let i = 0; i < startsWith.length; i += 1) {
    const ela = arr[i]
    const elb = startsWith[i]

    if (typeof elb === "string" && ela !== elb) return { valid: false, options }
    if (typeof elb === "object" && !!ela) {
      options[elb.label] = ela
    }
  }
  return { valid: true, options }
}

export class CommandCore {
  commandOptions: { [k: string]: string | true }
  commands: string[]
  commandsHandlers: {
    routeCommand: CommandPath[]
    description: string
    commandHandler: (
      commands: string[],
      commandOptions: { [k: string]: string | true }
    ) => void
  }[] = []

  constructor(
    readonly argv = process.argv.splice(2),
    readonly localStoreVaultConfigs = new LocalStoreVaultConfigs(),
    readonly localVaultStore = new LocalVaultStore()
  ) {
    const { commandOptions, commands } = this.argv.reduce(
      (a, p) => {
        if (p.startsWith("--")) {
          const symbolEqual = p.indexOf("=")
          const value = symbolEqual !== -1 ? p.slice(symbolEqual + 1) : true
          const option = (symbolEqual !== -1
            ? p.slice(0, symbolEqual)
            : p
          ).replace(/^-{2}/, "")
          a.commandOptions[option] = value
        } else {
          a.commands.push(p)
        }
        return a
      },
      {
        commandOptions: {} as { [k: string]: string | true },
        commands: [] as string[],
      }
    )

    this.commandOptions = commandOptions
    this.commands = commands
  }

  prepareCommand = (
    routeCommand: CommandPath[],
    description: string,
    commandHandler: (
      commands: string[],
      commandOptions: { [k: string]: string | true }
    ) => void
  ) => {
    this.commandsHandlers.push({ routeCommand, description, commandHandler })
    return { routeCommand, commandHandler }
  }

  runCommands = async () => {
    for (const { routeCommand, commandHandler } of this.commandsHandlers) {
      const resultEvaltion = arrStartWith(this.commands, routeCommand)
      if (resultEvaltion.valid) {
        await commandHandler(this.commands.slice(routeCommand.length), {
          ...this.commandOptions,
          ...resultEvaltion.options,
        })
        return
      }
    }

    await this.commandHelp.commandHandler([], {})
  }

  commandHelp = this.prepareCommand(["help"], "Show this help", () => {
    const c = this.commandsHandlers.map(({ routeCommand, description }) => ({
      command: routeCommand
        .map((e) => (typeof e === "string" ? e : `<${e.label}>`))
        .join(" "),
      description,
    }))

    const pe = c.reduce(
      (a, { command }) => (command.length > a ? command.length : a),
      0
    )

    const dialogHelp: string[] = [
      "Command:",
      ...c.map(
        ({ command, description }) =>
          `  ${command.padEnd(pe, " ")}  ${description}`
      ),
    ]

    console.log(dialogHelp.join(EOL))
  })
}
