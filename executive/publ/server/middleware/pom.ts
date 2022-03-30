import { oak } from "../deps.ts";
import * as p from "../../publication.ts";
import * as extn from "../../../../core/std/extension.ts";
import * as pDB from "../../publication-db.ts";
import * as sqlDB from "../../../../lib/db/sql.ts"; // for window.globalSqlDbConns

export interface PublicationObjectModel {
  readonly publication: p.Publication<p.PublicationOperationalContext>;
  readonly serializedJSON: (value: unknown, options?: {
    readonly decycle?: boolean;
    readonly transformMapsToObjects?: boolean;
  }) => string;
  readonly globalSqlDbConns: Map<string, sqlDB.DatabaseConnection>;
  readonly publicationDB?: pDB.PublicationDatabase;
}

/**
 * Registers an endpoint (usually /POM/) which accepts arbitrary JS/TS and
 * executes it against the publication server's object model database.
 */
export class PublicationObjectModelMiddlewareSupplier {
  readonly extensions = new extn.CachedExtensions();
  constructor(
    readonly app: oak.Application,
    readonly router: oak.Router,
    readonly POM: PublicationObjectModel,
    readonly htmlEndpointURL: string,
  ) {
    // REMINDER: if you add any routes here, make them easily testable by adding
    // them to executive/publ/server/inspect.http

    const evalEndpoint = `${this.htmlEndpointURL}/eval/`;
    router.get(`${evalEndpoint}(.*)`, (ctx) => {
      const query = ctx.request.url.pathname.substring(evalEndpoint.length);
      ctx.response.body = this.POM.serializedJSON(eval(query), {
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
            const evaluated = value(this.POM, {
              oakCtx: ctx,
              pathInfo,
              payload,
            });
            if (typeof evaluated === "string") {
              // the default function evaluated to a string so we'll just return it as the body
              ctx.response.body = evaluated;
            } else if (evaluated) {
              // the default function evaluated to something else so let's serialize it
              ctx.response.body = this.POM.serializedJSON(evaluated, {
                decycle: true,
              });
            }
          } else if (typeof value === "string") {
            // the default value evaluated to a string so we'll just return it as the body
            ctx.response.body = value;
          } else if (value) {
            // the module default was not a function or a string so let's serialize it
            ctx.response.body = this.POM.serializedJSON(value, {
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
