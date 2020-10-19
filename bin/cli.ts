#!/usr/bin/env node

import { EOL, homedir, tmpdir } from "os"
import { CommandCore } from "./CommandPath"
import { spawnSync } from "child_process"
import { randomBytes } from "crypto"
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs"
import { Vault } from "../vault/Vault"
import { RemoteStore } from "../stores/RemoteStore"
import { promisify } from "util"
import { vaultrcPath, vaultSchemaPath } from "./LocalStoreVaultConfigs"
import path from "path"
import { AppServer } from "../repository/AppServer"
import { factoryStore } from "../stores/factoryStore"
import url from "url"

const argvVaultId = { label: "vault-id" }

class CommandMenu extends CommandCore {
  cmdInfo = this.prepareCommand(
    ["info"],
    "Show info about the local vault",
    async () => {
      const dialog: string[] = []

      dialog.push(`Configs:`)

      for (const [p, v] of Object.entries(
        this.localStoreVaultConfigs.configs()
      )) {
        if (typeof v === "string") {
          dialog.push(` - ${p}:`, `   ${v}`)
        }
        if (typeof v === "object") {
          dialog.push(` - ${p}:`, `   ${JSON.stringify(v)}`)
        }
      }

      console.log(dialog.join(EOL))
    }
  )

  commandNewVault = this.prepareCommand(
    ["vault", "create"],
    "Create a vault",
    async () => {
      const store = await RemoteStore.create()

      const vault = await Vault.createVault({
        store: store,
        modulusLength: 512,
      })

      await this.localVaultStore.pushVault(vault)

      console.log(`vault ${vault._title()} stored`)
    }
  )

  listVaults = this.prepareCommand(
    ["vault", "list"],
    "List local vaults",
    async () => {
      const dialog: string[] = [
        "Vaults:",
        ...(this.localVaultStore
          .read()
          .vaults?.map(
            (vault) =>
              `  - ${vault.vault.publicKey.slice(0, 25)} (${vault.createdAt})`
          ) ?? []),
        "",
      ]

      console.log(dialog.join(EOL))
    }
  )

  infoVault = this.prepareCommand(
    ["vault", "info", argvVaultId],
    "Show info vault",
    async (cmds, options) => {
      const vault = this.localVaultStore.getVaultByStartId(options["vault-id"])

      if (!vault) return

      const dialogs: string[] = [
        `Vault Public Key:`,
        `  ${vault.vault.publicKey}`,
        ``,
      ]

      if (vault.store.protocol === "vaultremotestore") {
        const remoteStore = await RemoteStore.from(vault.store)
        const readkey = await remoteStore.getSignRead()
        const { id, publicKey, privateKey, ...moreOptionsQ } =
          vault.store.query ?? {}
        dialogs.push(
          `Remote Store ID:`,
          `  ${remoteStore.id}`,
          `Restore Public Key:`,
          `  ${remoteStore.publicKey}`,
          `Remote Read Sign:`,
          `  ${readkey}`,
          `Store URI:`,
          `  ${url.format({
            slashes: true,
            ...vault.store,
            query: {
              id,
              readkey,
              ...moreOptionsQ,
            },
          })}`,
          ``
        )
      }

      dialogs.push(`Created At:`, `  ${vault.createdAt}`)

      console.log(dialogs.join("\n"))
    }
  )

  demoEditor = this.prepareCommand(
    ["vault", "editor", argvVaultId],
    "Edit vault",
    async (cmds, options) => {
      const vaultstored = this.localVaultStore.getVaultByStartId(
        options["vault-id"]
      )
      if (!vaultstored) return

      console.log(
        `# Downloading vault ${vaultstored.vault.publicKey.slice(0, 25)}...`
      )

      const vault = await Vault.createVault({
        store: await factoryStore(vaultstored.store),
        ...vaultstored.vault,
      })

      const tmpfileedition = `${tmpdir()}/.${randomBytes(30).toString(
        "hex"
      )}.json`
      const preConfigs = await vault.readConfigs()

      writeFileSync(
        tmpfileedition,
        preConfigs
          ? JSON.stringify(preConfigs, null, 2)
          : '{\n  "": "Remove this line and write your json configuration below"\n}\n'
      )

      const [
        command,
        ...commandArgs
      ] = this.localStoreVaultConfigs.configs().editor

      const flowEdit = async () => {
        while (true) {
          try {
            console.log(`Open editor ${command}`)
            spawnSync(command, [tmpfileedition, ...commandArgs], {
              stdio: "inherit",
            })
            return JSON.parse(readFileSync(tmpfileedition, "utf8"))
          } catch (ex) {
            console.log(
              `Error format file: ${ex.message}\nWait 5 seconds to reopen file or cancel with Ctrl+C`
            )
            await promisify(setTimeout)(5_000)
          }
        }
      }

      const nextConfigs = await flowEdit()

      console.log("Save new configurations")
      await vault.saveConfigs(nextConfigs)

      unlinkSync(tmpfileedition)

      // this.localStoreVaultConfigs

      // console.log(readFileSync(tmpfileedition, 'utf8'))
    }
  )

  initVaultRC = this.prepareCommand(
    ["init", "vaultrc"],
    "Init vaultrc file",
    () => {
      if (existsSync(vaultrcPath)) {
        console.log(`Skipped. Already exists file ${vaultrcPath}`)
        return
      }
      writeFileSync(
        path.resolve(`${homedir()}/.vaultrc`),
        JSON.stringify({ $schema: vaultSchemaPath }, null, 2)
      )
    }
  )

  serve = this.prepareCommand(["server"], "Open the server registry", () => {
    new AppServer().listen()
  })
}

new CommandMenu(process.argv.splice(2)).runCommands()
