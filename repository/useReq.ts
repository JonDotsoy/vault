import http from "http"
import url, { UrlWithParsedQuery } from "url"

export const useBodyBuffer = (
  req: http.IncomingMessage,
  res: http.ServerResponse
) =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    req
      .on("error", (err) => {
        reject(err)
      })
      .on("data", (chunk) => {
        chunks.push(chunk)
      })
      .on("end", () => {
        const body = Buffer.concat(chunks)
        resolve(body)
      })
  })

export const useBodyJSON = async (
  req: http.IncomingMessage,
  res: http.ServerResponse
) => {
  const buffer = await useBodyBuffer(req, res)
  const contentType = req.headers["content-type"]?.toLowerCase()

  const isJSON = contentType?.match("application/json") ? true : false

  if (!isJSON) {
    throw new TypeError("Require JSON body")
  }

  return JSON.parse(buffer.toString())
}

export const useQuery = async (
  req: http.IncomingMessage,
  res: http.ServerResponse
) => (req.url ? url.parse(req.url, true, true).query : {})

export const useUrl = (req: http.IncomingMessage, res: http.ServerResponse) =>
  useUrl.parseUrlParsed(req, res)

useUrl.symbol = Symbol("useUrl.symbol")

useUrl.parseUrlParsed = (
  req: http.IncomingMessage,
  _res: http.ServerResponse
) => {
  const descriptor = Object.getOwnPropertyDescriptor(req, useUrl.symbol)
  if (descriptor) return descriptor.value as UrlWithParsedQuery
  const urlParsed = url.parse(req.url ?? "/", true, true)
  Object.defineProperty(req, useUrl.symbol, {
    writable: true,
    value: urlParsed,
  })
  return urlParsed
}

export const useUrlRegExpExec = (
  req: http.IncomingMessage,
  _res: http.ServerResponse
): RegExpExecArray =>
  Object.getOwnPropertyDescriptor(req, useUrlRegExpExec.symbolUrlRegExpExec)
    ?.value

useUrlRegExpExec.symbolUrlRegExpExec = Symbol("useParams.symbolUrlExp")

useUrlRegExpExec.setUrlRegExpExec = (
  req: http.IncomingMessage,
  _res: http.ServerResponse,
  urlExp: RegExpExecArray
) => {
  Object.defineProperty(req, useUrlRegExpExec.symbolUrlRegExpExec, {
    writable: false,
    value: urlExp,
  })
}
