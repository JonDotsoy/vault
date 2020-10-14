import { types } from "util"

export const isPromise = (v: any): v is Promise<any> => types.isPromise(v)
