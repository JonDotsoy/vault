#!/usr/bin/env node

import { EOL, homedir, tmpdir } from "os"
import { CommandCore } from "./CommandPath"
import { spawnSync } from "child_process"
import { randomBytes } from "crypto"
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs"
import { Vault } from "../vault/Vault"
import { RemoteStore } from "../stores/RemoteStore"
import { inspect, promisify } from "util"
import { vaultrcPath, vaultSchemaPath } from "./LocalStoreVaultConfigs"
import path from "path"
import { AppServer } from "../repository/AppServer"
import { factoryStore } from "../stores/factoryStore"
import url from "url"

const throws = <T extends Error>(err: T) => {
  throw err
}

const argvVaultId = { label: "vault-id" }

class CommandMenu extends CommandCore {
  "info" = this.prepareCommand(
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

  "vault create" = this.prepareCommand(
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

  "vault list" = this.prepareCommand(
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

  "vault export <vaultid>" = this.prepareCommand(
    ["vault", "export", argvVaultId],
    "export configs vault",
    async (_, options) => {
      const out = options.out

      const vault =
        this.localVaultStore.getVaultByStartId(options["vault-id"]) ??
        throws(new Error("Cannot found vault"))
      const remoteStore = await RemoteStore.from(vault.store)

      const readkey = await remoteStore.getSignRead()
      const { id, readkey: _readkey, publicKey, privateKey, ...moreOptionsQ } =
        vault.store.query ?? {}

      const storeUrl = url.format({
        slashes: true,
        ...vault.store,
        query: {
          id,
          readkey,
          ...moreOptionsQ,
        },
      })

      const obj = {
        PublicKey: vault.vault.publicKey,
        Store: storeUrl,
      }

      if (typeof out === "string") {
        const pathout = path.resolve(`${process.cwd()}/${out}`)
        console.log(`# file stored on ${pathout}`)
        writeFileSync(pathout, JSON.stringify(obj, null, 2))
      } else {
        console.log(`# Use param \`--out={path}\` to save config`)
      }

      console.log(JSON.stringify(obj, null, 2))
    }
  )

  "vault info <vaultid>" = this.prepareCommand(
    ["vault", "info", argvVaultId],
    "Show info vault",
    async (cmds, options) => {
      const outputjson = options.json ?? false

      const vault = this.localVaultStore.getVaultByStartId(options["vault-id"])

      if (!vault) return

      const els: { [k: string]: any } = {
        "Vault Public Key": vault.vault.publicKey,
      }

      if (vault.store.protocol === "vaultremotestore") {
        const remoteStore = await RemoteStore.from(vault.store)
        const readkey = await remoteStore.getSignRead()
        const { id, publicKey, privateKey, ...moreOptionsQ } =
          vault.store.query ?? {}

        els["Remote Store ID"] = remoteStore.id
        els["Remote Public Key"] = (
          await remoteStore.keyPair
        )?.exportPublicKey()
        els["Remote Private Key"] = (
          await remoteStore.keyPair
        )?.exportPrivateKey()
        els["Remote Read Sign"] = readkey
        els["Remote Store URI"] = url.format({
          slashes: true,
          ...vault.store,
          query: {
            id,
            readkey,
            ...moreOptionsQ,
          },
        })
      }

      els["Created At"] = vault.createdAt

      if (outputjson) {
        const e = Object.entries(els).reduce((acum, [k, v]) => {
          acum[k.replace(/\s+([A-Z])/g, "$1")] = v
          return acum
        }, {} as any)
        console.log(JSON.stringify(e, null, 4))
      } else {
        Object.entries(els).forEach(([k, v]) => {
          console.log(`${k.padEnd(20, " ")} = ${v}`)
        })
      }
    }
  )

  "vault editor <vaultid>" = this.prepareCommand(
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

  "init vaultrc" = this.prepareCommand(
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

  "server" = this.prepareCommand(["server"], "Open the server registry", () => {
    new AppServer().listen()
  })
}

new CommandMenu(process.argv.splice(2)).runCommands()
