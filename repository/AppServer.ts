import http from "http"
import url from "url"
import { AddressInfo } from "net"
import { useUrl, useUrlRegExpExec } from "./useReq"
import { isPromise } from "../lib/isPromise"
import { App } from "./app"

const notFound = () => {
  throw Object.assign(new Error("Cannot found"), {
    statusCode: 404,
    expose: false,
  })
}

const sendError = (
  ex: any,
  req: http.IncomingMessage,
  res: http.ServerResponse
) => {
  const { method, url } = req
  const expose = ex.expose ?? true
  const message = ex.message ?? ex ?? "Error"
  const meta = ex.meta ?? undefined
  const statusCode = ex.statusCode ?? 500
  const codeError = ex.codeError ?? statusCode

  if (expose) {
    console.error(
      Object.assign(ex, {
        method,
        url,
        message: message,
        meta: meta,
        codeError: codeError,
        statusCode: statusCode,
      })
    )
  }

  res.statusCode = statusCode ?? 500
  res.setHeader("X-Err-Message", message)
  res.setHeader("Content-Type", "application/json")
  res.write(
    JSON.stringify({
      error: {
        message: message,
        meta: meta,
        codeError: codeError,
        statusCode: statusCode,
      },
    })
  )
  res.end()
}

export class AppServer {
  constructor(
    readonly app = new App(),
    readonly options?: {
      port?: number
    }
  ) {}

  serve = http.createServer((req, res) => {
    try {
      if (!req.method || !req.url) return notFound()

      const routerMatch = this.app.router.match({
        mathod: req.method,
        urlParsed: useUrl(req, res),
      })

      if (routerMatch) {
        useUrlRegExpExec.setUrlRegExpExec(req, res, routerMatch.urlRegExpExec)

        const m = routerMatch.handler(req, res)
        if (isPromise(m)) {
          m.catch((ex) => sendError(ex, req, res))
        }
      } else {
        notFound()
      }
    } catch (ex) {
      sendError(ex, req, res)
    }
  })

  listen = (options?: { port?: number }) => {
    const port =
      this.options?.port ??
      options?.port ??
      (process.env.PORT && /^\d+$/.test(process.env.PORT)
        ? Number(process.env.PORT)
        : undefined) ??
      4874 // Transform phone number vault => 82858 / 17 => 4874

    return this.serve.listen(port, () => {
      const address = this.serve.address()

      const isAddressInfo = (v: any): v is AddressInfo => "port" in v

      if (isAddressInfo(address)) {
        console.log(
          `Server ready ${url.format({
            protocol: "http",
            slashes: true,
            hostname: address.address,
            port: address.port,
          })}`
        )
      } else {
        console.log(`Server ready ${address}`)
      }
    })
  }
}
