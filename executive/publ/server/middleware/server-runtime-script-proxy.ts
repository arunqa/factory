import { oak } from "../deps.ts";
import * as extn from "../../../../lib/module/mod.ts";
import * as rme from "../../../../lib/module/remote/executive.ts";
import * as s from "./workspace/inventory/server-runtime-scripts.ts";

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
  readonly inventory = s.typicalScriptsInventory();
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
    router.get(`${extnEndpoint}(.*)`, async (ctx) => {
      const foreignCodeIdentity = ctx.request.url.pathname.substring(
        extnEndpoint.length + 1, // +1 is because we don't want a leading /
      );
      await this.executeForeignCode({
        foreignCodeIdentity,
        foreignCodeExecArgs: ctx.request.url.searchParams,
      }, ctx);
    });

    router.post(`${extnEndpoint}(.*)`, async (ctx) => {
      // API callers should use content-type: text/plain so that body.value is
      // parsed as text, not JSON or other any other format
      const body = ctx.request.body();

      const pathInfo = ctx.request.url.pathname.substring(extnEndpoint.length);
      await this.executeForeignCode({
        foreignModule: {
          foreignCode: await body.value,
          foreignCodeLanguage: pathInfo.endsWith(".ts.json") ? "ts" : "js",
        },
        foreignCodeExecArgs: ctx.request.url.searchParams,
      }, ctx);
    });
  }

  async executeForeignCode(
    payload: rme.ForeignCodePayload,
    oakCtx: oak.Context,
  ) {
    try {
      const efcResult = await rme.executeForeignCode({
        payload,
        extensions: this.extensions,
        inventory: this.inventory,
        callModuleDefaultFn: (fn) => {
          return fn(
            { ...this.exposureCtx, args: payload.foreignCodeExecArgs },
            { oakCtx, request: oakCtx.request, payload },
          );
        },
      });
      if (oakCtx.request.url.searchParams.has("diagnose")) {
        // if diagnostics are requested we just return the payload and full result
        oakCtx.response.body = JSON.stringify({
          payload,
          efcResult,
        });
        return;
      }
      if (efcResult.error) {
        oakCtx.response.body = JSON.stringify({
          payload,
          inventory: this.inventory.scriptIdentities(),
          efcResult,
        });
      } else {
        if (typeof efcResult.value === "string") {
          // the default function evaluated to a string so we'll just return it as the body;
          // this is a special feature which allows modules to compute their own JSON;
          oakCtx.response.body = efcResult.value;
        } else if (efcResult.value) {
          // the default function evaluated to something else so let's serialize it
          oakCtx.response.body = this.serializer.serializedJSON(
            efcResult.value,
            {
              decycle: true,
            },
          );
        }
      }
    } catch (error) {
      oakCtx.response.body = JSON.stringify({
        payload: payload,
        inventory: this.inventory.scriptIdentities(),
        error: JSON.stringify(error),
        message: error.toString(),
      });
    }
  }
}
