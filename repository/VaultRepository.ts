import { KeyPair } from "../vault/KeyPair"
import { Query, Registry, VaultRepositoryDB } from "./VaultRepositoryDB"
import crypto from "crypto"
import { promisify } from "util"
import { Hashes, Signer } from "../vault/Signer"
import { ID, IDLike } from "./id"

interface PublishOption {
  vaultStore: string
  modulusLength?: 512 | 1024 | 2048 | 4096
  publicKey?: string
}

interface ReadOption {
  id: IDLike
  readSign: string
}

interface DeleteOption {
  id: IDLike
  deleteSign: string
}

interface UpdateOption {
  id: IDLike
  updateSign: string
  vaultStore: string
}

interface ListOption {
  limit?: number
  continueToken?: string
}

export class VaultRepository {
  constructor(private options?: {}, private db = new VaultRepositoryDB()) {}

  async list(listOption?: ListOption) {
    const query: Query = []

    if (listOption?.continueToken) {
      query.push({ id: { $gt: ID.from(listOption?.continueToken) } })
    }

    const items = this.db.find(query)
    const result: Registry[] = []

    let c = 0
    for await (const item of items) {
      c += 1
      if (c > (listOption?.limit ?? 100)) break
      if (item) {
        result.push(item)
      }
    }

    return {
      result,
      continueToken: result[result.length - 1]?.id,
    }
  }

  async publish(publishOption: PublishOption) {
    const id = ID.from()

    const keyPairPublication = await KeyPair.resolve({
      modulusLength: publishOption.modulusLength ?? 512,
      publicKey: publishOption.publicKey,
    })

    await this.db.create({
      id,
      vaultStore: publishOption.vaultStore,
      publicKey: keyPairPublication.exportPublicKey(),
    })

    return {
      id,
      ...keyPairPublication.export(),
    }
  }

  async read(readOption: ReadOption) {
    const id = ID.from(readOption.id)
    const registry = await this.db.findOne([{ id: { $eq: id } }])
    if (!registry) return null

    const keyPairPublication = await KeyPair.resolve({
      publicKey: registry.publicKey,
    })

    const signer = keyPairPublication.createSigner("read")

    const verified = await signer.verify(readOption.readSign)

    if (!verified) {
      throw new Error("Error verify sign")
    }

    return registry
  }

  async delete(deleteOption: DeleteOption) {
    const id = ID.from(deleteOption.id)
    const registry = await this.db.findOne([{ id: { $eq: id } }])
    if (!registry) return null
    const keyPairPublication = await KeyPair.resolve({
      publicKey: registry.publicKey,
    })
    const signer = keyPairPublication.createSigner("delete")

    const verified = await signer.verify(deleteOption.deleteSign)

    if (!verified) {
      throw new Error("Error verify sign")
    }

    await this.db.deleteOne([{ id: { $eq: id } }])
  }

  async update(updateOption: UpdateOption) {
    const id = ID.from(updateOption.id)
    const registry = await this.db.findOne([{ id: { $eq: id } }])
    if (!registry) return null
    const keyPairPublication = await KeyPair.resolve({
      publicKey: registry.publicKey,
    })
    const signer = keyPairPublication.createSigner("update")

    const verified = await signer.verify(updateOption.updateSign)

    if (!verified) {
      throw new Error("Error verify sign")
    }

    await this.db.updateOne(
      [
        {
          id: { $eq: id },
        },
      ],
      [
        {
          vaultStore: { $set: updateOption.vaultStore },
        },
      ]
    )
  }
}
