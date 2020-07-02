import http from "http"
import { UrlWithParsedQuery } from "url"

type Route = {
  mathod: string
  url: RegExp
  handler: (
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) => Promise<void> | void
}

export class Router {
  routes: Route[] = []

  addRoute(route: Route) {
    this.routes.push(route)
  }

  match(
    requestRoute: Pick<Route, "mathod"> & { urlParsed: UrlWithParsedQuery }
  ) {
    for (const route of this.routes) {
      const regExpExecArray = route.url.exec(
        requestRoute.urlParsed.pathname ?? ""
      )

      if (route.mathod === requestRoute.mathod && !!regExpExecArray) {
        return {
          ...route,
          urlRegExpExec: regExpExecArray,
        }
      }
    }
  }
}
