import fs, { existsSync } from "fs"
import { homedir, tmpdir } from "os"
import { promisify, types } from "util"
import path, { basename, sep } from "path"
import { strict } from "assert"
import { ID, IDLike } from "./id"
import { KeyPair } from "../vault/KeyPair"
import { count } from "console"

const readDir = promisify(fs.readdir)
const readfile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const unLink = promisify(fs.unlink)

/**
 * Make dir if is not exists
 */
export const resolveDir = (pathlike: string) => {
  const pathLikeNormalized = path.normalize(pathlike)

  if (!fs.existsSync(pathLikeNormalized)) {
    fs.mkdirSync(pathLikeNormalized, { recursive: true, mode: 0o700 })
  }

  return pathLikeNormalized
}

type MethodsAsserts<T> =
  | { $eq: T }
  | { $lt: T }
  | { $gt: T }
  | { $lte: T }
  | { $gte: T }

type QueryChunk = {
  [K in KeysValues]?: MethodsAsserts<Registry[K]>
}

export type Query = QueryChunk[]

type KeysValues = "id" | "createdAt"

const selectExpresion = <K extends KeysValues>(
  query: Query | undefined,
  path: K
): { exp: string; value: Registry[K] } | undefined => {
  const q = query?.find((q) => path in q)?.[path] as MethodsAsserts<Registry[K]>

  if (q) {
    if ("$eq" in q) return { exp: "$eq", value: q.$eq }
    if ("$lt" in q) return { exp: "$lt", value: q.$lt }
    if ("$gt" in q) return { exp: "$gt", value: q.$gt }
    if ("$lte" in q) return { exp: "$lte", value: q.$lte }
    if ("$gte" in q) return { exp: "$gte", value: q.$gte }
  }

  return undefined
}

const toAssertExpresion = <T extends KeysValues>(
  query: Query | undefined,
  path: T
) => {
  const cond = selectExpresion(query, path)

  if (cond) {
    switch (cond.exp) {
      case "$eq":
        return (field: any) => {
          console.log(
            `field:${field} === value:${cond.value}`,
            field === cond.value
          )
          return field === cond.value
        }
      case "$lt":
        return (field: any) => {
          console.log(
            `field:${field} < value:${cond.value}`,
            field < cond.value
          )
          return field < cond.value
        }
      case "$gt":
        return (field: any) => {
          console.log(
            `field:${field} > value:${cond.value}`,
            field > cond.value
          )
          return field > cond.value
        }
      case "$lte":
        return (field: any) => {
          console.log(
            `field:${field} <= value:${cond.value}`,
            field <= cond.value
          )
          return field <= cond.value
        }
      case "$gte":
        return (field: any) => {
          console.log(
            `field:${field} >= value:${cond.value}`,
            field >= cond.value
          )
          return field >= cond.value
        }
    }
  }
}

type KeysDocs = "vaultStore"

type MutationsChunk<T extends RegistryStored = RegistryStored> =
  | {
      [k in KeysDocs]: T[k]
    }
  | {
      [k in KeysDocs]: { $set: T[k] }
    }
  | {
      [k in KeysDocs]: { $push: T[k] }
    }
  | {
      [k in KeysDocs]: { $sum: T[k] }
    }

type Mutations = MutationsChunk[]

const toMutationFuntion = (mutations: Mutations) =>
  mutations.map((mutation) => {
    const [[prop, transform]] = Object.entries(mutation)

    if ("$set" in transform)
      return (v: any) => {
        v[prop] = transform.$set
      }
    if ("$push" in transform)
      return (v: any) => {
        if (Array.isArray(v[prop])) {
          v[prop].push(transform.$push)
        }
      }
    if ("$sum" in transform)
      return (v: any) => {
        v[prop] += transform.$sum
      }
    return (v: any) => {
      v[prop] = transform
    }
  })

export type RegistryStored = Pick<Registry, Exclude<keyof Registry, "toJSON">>

type PropAny<T extends object> = {
  [k in keyof T]: any
}

export class Registry {
  private constructor(
    public id: ID,
    public vaultStore: string,
    public createdAt: Date,
    public publicKey: string
  ) {}

  toJSON(options?: { fullVisible: boolean }) {
    return {
      id: this.id,
      vaultStore: this.vaultStore,
      createdAt: this.createdAt,
      publicKey: options?.fullVisible ? this.publicKey : undefined,
    }
  }

  static parse(
    from: Pick<PropAny<Registry>, Exclude<keyof Registry, "toJSON">>
  ) {
    const nextRegistry = new Registry(
      ID.from(from.id),
      from.vaultStore,
      new Date(from.createdAt),
      from.publicKey
    )
    return nextRegistry
  }
}

export class VaultRepositoryDB {
  constructor(
    private options?: {
      cwdRegistries: string
    }
  ) {}

  private readonly cwdRegistries = resolveDir(
    this.options?.cwdRegistries ?? `${homedir()}/._vault/vault_registries`
  )

  private toPathStoredById(id: ID) {
    return path.resolve(`${this.cwdRegistries}/${id.toString()}.json`)
  }

  async existsDocById(id: ID) {
    if (!id) return false
    const pathend = this.toPathStoredById(id)
    return fs.existsSync(pathend)
  }

  async create(
    body: Pick<RegistryStored, "vaultStore" | "publicKey"> &
      Partial<Pick<RegistryStored, "id">>
  ) {
    const id = ID.from(body.id)
    const pathend = this.toPathStoredById(id)
    const registry = Registry.parse({
      id,
      createdAt: new Date(),
      publicKey: body.publicKey,
      vaultStore: body.vaultStore,
    })
    await writeFile(
      pathend,
      JSON.stringify(registry.toJSON({ fullVisible: true }))
    )
    return { id }
  }

  private async infoDoc(query: Query) {
    const idFound = selectExpresion(query, "id")?.value
    if (!idFound) return null
    const id = ID.from(idFound)
    const pathend = this.toPathStoredById(id)
    if (!existsSync(pathend)) return null

    return {
      id,
      pathend,
      read: async () =>
        Registry.parse(JSON.parse((await readfile(pathend)).toString())),
    }
  }

  async findOne(query: Query) {
    const infoDoc = await this.infoDoc(query)
    if (!infoDoc) return null
    const { pathend, read } = infoDoc
    if (!existsSync(pathend)) return null
    return read()
  }

  async deleteOne(query: Query) {
    const infoDoc = await this.infoDoc(query)
    if (!infoDoc) return null
    const { pathend } = infoDoc
    if (!existsSync(pathend)) return null
    await unLink(pathend)
  }

  async *find(query?: Query) {
    const ids = await (await readDir(this.cwdRegistries))
      .filter((pathlike) => !pathlike.startsWith("."))
      .map((f) => basename(f, ".json"))

    const filterById = toAssertExpresion(query, "id")

    for (const id of ids) {
      if (filterById && !filterById(id)) continue

      const infoDoc = await this.infoDoc([
        {
          id: {
            $eq: ID.from(id),
          },
        },
        {
          createdAt: {
            $eq: new Date(),
          },
        },
      ])
      const reg = infoDoc?.read()
      yield reg
    }

    // const id = toQueryLikeId(query)
    // if (id) filters.push(({ pathlike }) => id === pathlike)

    // const filter = (b: Prop) => filters.map(f => f(b))

    // // const createdAtLt = toQueryLikeCreatedAtLt(query)
    // // if (createdAtLt) filters.push()

    // return namefiles
    //   .map((pathlike) => path.basename(pathlike, ".json"))
    //   .filter((pathlike) => filters.map((f) => f(pathlike)).every(Boolean))
  }

  async updateOne(query: Query, mutations: Mutations) {
    const infoDoc = await this.infoDoc(query)
    if (!infoDoc) return null
    const doc = await infoDoc.read()
    const transformations = toMutationFuntion(mutations)
    for (const transformation of transformations) {
      transformation(doc)
    }
    await writeFile(
      infoDoc.pathend,
      JSON.stringify(doc.toJSON({ fullVisible: true }))
    )
  }
}
