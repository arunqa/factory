import { oak } from "../deps.ts";
import * as extn from "../../../../core/std/extension.ts";

export interface RuntimeExpositionSerializationSupplier {
  readonly serializedJSON: (value: unknown, options?: {
    readonly decycle?: boolean;
    readonly transformMapsToObjects?: boolean;
  }) => string;
}

export interface RuntimeExposureContext {
  readonly isRuntimeExposureContext: true;
}

/**
 * Registers an endpoint (usually /unsafe-server-runtime-proxy) which accepts arbitrary JS/TS and
 * executes it in the server's runtime.
 * WARNING: this is completely unsafe and security-unconcious code allowing arbitrary code
 *          execution. BE CAREFUL to use it wisely only in trusted contexts.
 * TODO: to increase safety, move eval into subprocess or web workers
 */
export class ServerRuntimeJsTsProxyMiddlewareSupplier<
  REContext extends RuntimeExposureContext,
> {
  readonly extensions = new extn.CachedExtensions();
  constructor(
    readonly app: oak.Application,
    readonly router: oak.Router,
    readonly serializer: RuntimeExpositionSerializationSupplier,
    readonly exposureCtx: REContext,
    readonly htmlEndpointURL: string,
  ) {
    // REMINDER: if you add any routes here, make them easily testable by adding
    // them to executive/publ/server/inspect.http

    const evalEndpoint = `${this.htmlEndpointURL}/eval/`;
    router.get(`${evalEndpoint}(.*)`, (ctx) => {
      const query = ctx.request.url.pathname.substring(evalEndpoint.length);
      ctx.response.body = this.serializer.serializedJSON(eval(query), {
        decycle: true,
      });
    });

    const extnEndpoint = `${this.htmlEndpointURL}/module`;
    router.post(`${extnEndpoint}(.*)`, async (ctx) => {
      const body = ctx.request.body();
      // API callers should use content-type: text/plain so that body.value is
      // parsed as text, not JSON or other any other format
      const payload = await body.value;
      const pathInfo = ctx.request.url.pathname.substring(extnEndpoint.length);
      const source = {
        typescript: pathInfo.endsWith(".ts.json") ? (() => payload) : undefined,
        javascript: pathInfo.endsWith(".js.json") ? (() => payload) : undefined,
      };
      if (source.javascript || source.typescript) {
        const [extn, dataURL] = await this.extensions.importDynamicScript(
          source,
        );
        if (extn && extn.isValid) {
          // deno-lint-ignore no-explicit-any
          const value = (extn.module as any).default;
          if (typeof value === "function") {
            const evaluated = value(this.exposureCtx, {
              oakCtx: ctx,
              pathInfo,
              payload,
            });
            if (typeof evaluated === "string") {
              // the default function evaluated to a string so we'll just return it as the body
              ctx.response.body = evaluated;
            } else if (evaluated) {
              // the default function evaluated to something else so let's serialize it
              ctx.response.body = this.serializer.serializedJSON(evaluated, {
                decycle: true,
              });
            }
          } else if (typeof value === "string") {
            // the default value evaluated to a string so we'll just return it as the body
            ctx.response.body = value;
          } else if (value) {
            // the module default was not a function or a string so let's serialize it
            ctx.response.body = this.serializer.serializedJSON(value, {
              decycle: true,
            });
          } else {
            ctx.response.body = JSON.stringify({
              error:
                `imported valid payload but no valid module default was found`,
              payload,
              dataURL,
              pathInfo,
            });
          }
        } else {
          ctx.response.body = JSON.stringify({
            error: `unable to import payload as data URL`,
            payload,
            dataURL,
            pathInfo,
            importError: extn?.importError,
          });
        }
      } else {
        ctx.response.body = JSON.stringify({
          error:
            `pathInfo ${pathInfo} should be either *.ts or *.js and POST body should be source`,
          payload,
          pathInfo,
        });
      }
    });
  }
}
