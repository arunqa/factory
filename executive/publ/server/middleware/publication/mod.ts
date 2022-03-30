import { oak } from "../../deps.ts";
import * as p from "../../../publication.ts";
import * as extn from "../../../../../core/std/extension.ts";
import * as rJSON from "../../../../../core/content/routes.json.ts";
import * as pDB from "../../../publication-db.ts";
import * as rflPath from "../../../../../lib/path/mod.ts";
import "../../../../../lib/db/sql.ts"; // for window.globalSqlDbConns

const _modulePath = rflPath.pathRelativeToModuleCWD(import.meta.url);

export class PublicationMiddlewareSupplier {
  readonly extensions = new extn.CachedExtensions();
  constructor(
    readonly app: oak.Application,
    readonly router: oak.Router,
    readonly publication: p.Publication<p.PublicationOperationalContext>,
    readonly serverStateDB: pDB.PublicationDatabase | undefined,
    readonly htmlEndpointURL: string,
    readonly registerTsJsRoute: (
      endpointWithoutExtn: string,
      tsSrcRootSpecifier: string,
    ) => void,
  ) {
    // REMINDER: if you add any routes here, make them easily testable by adding
    // them to executive/publ/server/inspect.http

    const pomEndpoint = `${this.htmlEndpointURL}/pom`;
    const evalEndpoint = `${pomEndpoint}/eval/`;
    const extnEndpoint = `${pomEndpoint}/module`;

    router.get(`${evalEndpoint}(.*)`, (ctx) => {
      const query = ctx.request.url.pathname.substring(evalEndpoint.length);
      ctx.response.body = rJSON.typicalSerializedJSON(eval(query), {
        decycle: true,
      });
    });

    router.post(`${extnEndpoint}(.*)`, async (ctx) => {
      const body = ctx.request.body();
      const payload = await body.value;
      const pathInfo = ctx.request.url.pathname.substring(extnEndpoint.length);
      const source = {
        typescript: pathInfo.endsWith(".ts") ? (() => payload) : undefined,
        javascript: pathInfo.endsWith(".js") ? (() => payload) : undefined,
      };
      if (source.javascript || source.typescript) {
        const [extn, dataURL] = await this.extensions.importDynamicScript(
          source,
        );
        if (extn && extn.isValid) {
          // deno-lint-ignore no-explicit-any
          const value = (extn.module as any).default;
          if (typeof value === "function") {
            const evaluated = value({ publication }, {
              oakCtx: ctx,
              pathInfo,
              payload,
            });
            if (typeof evaluated === "string") {
              // the default function evaluated to a string so we'll just return it as the body
              ctx.response.body = evaluated;
            } else if (evaluated) {
              // the default function evaluated to something else so let's serialize it
              ctx.response.body = rJSON.typicalSerializedJSON(evaluated, {
                decycle: true,
              });
            }
          } else if (typeof value === "string") {
            // the default value evaluated to a string so we'll just return it as the body
            ctx.response.body = value;
          } else if (value) {
            // the module default was not a function or a string so let's serialize it
            ctx.response.body = rJSON.typicalSerializedJSON(value, {
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

    router.get(`${this.htmlEndpointURL}/inspect/design-system.json`, (ctx) => {
      ctx.response.body = JSON.stringify(publication.ds.designSystem);
    });

    router.get(`${this.htmlEndpointURL}/inspect/renderers.json`, (ctx) => {
      const renderers = [];
      for (
        const layout of publication.ds.designSystem.layoutStrategies.layouts
          .values()
      ) {
        renderers.push(layout);
      }
      ctx.response.body = JSON.stringify(renderers);
    });

    router.get(
      `${this.htmlEndpointURL}/inspect/routes.json`,
      (ctx) => {
        ctx.response.body = rJSON.typicalSerializedJSON(
          this.publication.routes,
          { decycle: true, transformMapsToObjects: true },
        );
      },
    );

    router.get(
      `${this.htmlEndpointURL}/inspect/databases/content.json`,
      (ctx) => {
        const dbAccesses = window.globalSqlDbConns
          ? Array.from(window.globalSqlDbConns.entries())
          : [];

        ctx.response.body = JSON.stringify(
          dbAccesses,
          (_key, value) => typeof value === "bigint" ? value.toString() : value, // return everything else unchanged
        );
      },
    );

    router.get(
      `${this.htmlEndpointURL}/inspect/databases/server.json`,
      (ctx) => {
        ctx.response.body = JSON.stringify({
          sqliteFileName: this.serverStateDB
            ? this.serverStateDB.dbStoreFsPath
            : `this.serverStateDB not provided`,
        });
      },
    );
  }
}
