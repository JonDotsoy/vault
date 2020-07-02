import http from "http"
import { UrlWithParsedQuery, UrlWithStringQuery } from "url"

export interface resFetch {
  req: http.ClientRequest
  res: http.IncomingMessage
  body: Buffer
}

export class ErrorFetch extends Error implements resFetch {
  constructor(private options: { message: string } & resFetch) {
    super(options.message)
  }

  readonly res = this.options.res
  readonly req = this.options.req
  readonly body = this.options.body
}

interface fetchOptions {
  method: "POST" | "GET" | "PUT"
  url: UrlWithStringQuery | UrlWithParsedQuery
  body?: Buffer
  headers?: {
    [k: string]: string | number | string[]
  }
  statusCode?: number
}

export const fetch = (options: fetchOptions) =>
  new Promise<resFetch>((resolve, reject) => {
    const expectStatusCode = options.statusCode ?? 200
    const { method, url, body, headers } = options
    const req = http.request(
      {
        method,
        ...url,
      },
      (res) => {
        const bodyChunks: Buffer[] = []
        res
          .on("error", (err) => reject(err))
          .on("data", (data) => bodyChunks.push(data))
          .on("end", () => {
            const body = Buffer.concat(bodyChunks)

            if (res.statusCode !== expectStatusCode) {
              const messageError =
                res.headers?.["x-err-message"] ?? body.toString()

              return reject(
                new ErrorFetch({
                  message: `${req.method} ${options.url.pathname}: status ${res.statusCode} ${messageError}`,
                  req,
                  res,
                  body,
                })
              )
            }

            resolve({ req, res, body })
          })
      }
    )

    req.on("error", (err) => reject(err))

    if (headers) {
      for (const [hk, hv] of Object.entries(headers)) {
        req.setHeader(hk, hv)
      }
    }

    if (body) {
      req.write(body)
    }

    req.end()
  })
