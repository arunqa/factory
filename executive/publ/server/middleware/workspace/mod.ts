import { colors, events, path } from "../../../../../core/deps.ts";
import { oak } from "../../deps.ts";
import * as wfs from "../../../../../lib/fs/watch.ts";
import * as ws from "../../../../../lib/workspace/mod.ts";
import * as s from "../static.ts";

import "./ua-editable.ts"; // for type-checking only ("UA" is for user agent TS -> JS compile)

export interface WorkspaceTunnelConnection {
  readonly userAgentID: string;
  readonly sseTarget: oak.ServerSentEventTarget;
}

export class WorkspaceTunnel<
  Connection extends WorkspaceTunnelConnection = WorkspaceTunnelConnection,
  ConnectionContext extends {
    // deno-lint-ignore no-explicit-any
    readonly oakCtx: oak.Context<any>;
    readonly userAgentIdSupplier: (ctx: oak.Context) => string;
  } = {
    // deno-lint-ignore no-explicit-any
    readonly oakCtx: oak.Context<any>;
    readonly userAgentIdSupplier: (ctx: oak.Context) => string;
  },
> extends events.EventEmitter<{
  sseHealthRequest(ctx: ConnectionContext): void;
  sseConnected(conn: Connection, ctx: ConnectionContext): void;
  sseInvalidRequest(ctx: ConnectionContext): void;
  serverFileImpact(fsAbsPathAndFileName: string, url?: string): void;
}> {
  #connections: Connection[] = [];
  #onlyOpen: ((value: Connection) => boolean) = (c) =>
    c.sseTarget.closed ? false : true;

  constructor(
    readonly sseHealthEndpointURL: string,
    readonly sseEndpointURL: string,
    readonly factory: (
      userAgentID: string,
      ctx: ConnectionContext,
    ) => Connection,
  ) {
    super();
    // this.on("sseConnected", (conn, ctx) => {
    //   console.log(
    //     `[${this.#connections.length}] WorkspaceTunnelConnection ${conn.userAgentID}, ${ctx.oakCtx.request.url}`,
    //   );
    // });
    this.on("serverFileImpact", (fsAbsPathAndFileNameImpacted, url) => {
      this.cleanConnections().forEach((c) =>
        c.sseTarget.dispatchEvent(
          new oak.ServerSentEvent(
            "server-resource-impact",
            {
              nature: "fs-resource-modified",
              fsAbsPathAndFileNameImpacted,
              url,
            },
          ),
        )
      );
    });
  }

  get connections(): Connection[] {
    return this.#connections;
  }

  protected cleanConnections(): Connection[] {
    this.#connections = this.#connections.filter(this.#onlyOpen);
    return this.#connections;
  }

  connect(ctx: ConnectionContext): Connection {
    const userAgentID = ctx.userAgentIdSupplier(ctx.oakCtx);
    this.cleanConnections();
    const foundConnIndex = this.#connections.findIndex((c) =>
      c.userAgentID == userAgentID
    );
    if (foundConnIndex != -1) {
      const foundConn = this.#connections[foundConnIndex];
      foundConn.sseTarget.close();
    }
    const connection = this.factory(userAgentID, ctx);
    if (foundConnIndex != -1) {
      this.#connections[foundConnIndex] = connection;
    } else {
      this.#connections.push(connection);
    }
    this.emit("sseConnected", connection, ctx);
    return connection;
  }

  // deno-lint-ignore require-await
  async cleanup() {
    this.cleanConnections().forEach((c) => c.sseTarget.close());
  }
}

export interface WorkspaceMiddlewareSupplierOptions {
  readonly tunnel: WorkspaceTunnel;
  readonly htmlEndpointURL: string;
  readonly staticIndex: "index.html" | string;
}

export class WorkspaceMiddlewareSupplier {
  readonly tunnel: WorkspaceTunnel;
  readonly htmlEndpointURL: string;
  readonly wsEndpointsContentHome = path.join(
    path.dirname(import.meta.url).substring(
      "file://".length,
    ),
    "public",
  );
  readonly wsEndpointsStaticIndex: "index.html" | string;

  constructor(
    readonly config: {
      readonly contentRootPath: string;
      readonly fsEntryPublicationURL: (
        fsAbsPathAndFileName: string,
      ) => string | undefined;
      readonly publicURL: (path?: string) => string;
      readonly wsEditorResolver?: ws.WorkspaceEditorTargetResolver<
        ws.WorkspaceEditorTarget
      >;
      readonly userAgentIdSupplier: (ctx: oak.Context) => string;
    },
    readonly app: oak.Application,
    readonly router: oak.Router,
    readonly staticEE: s.StaticEventEmitter,
    options?: Partial<WorkspaceMiddlewareSupplierOptions>,
  ) {
    // REMINDER: if you add any routes here, make them easily testable by adding
    // them to executive/publ/server/inspect.http

    this.htmlEndpointURL = options?.htmlEndpointURL ?? "/workspace";
    this.wsEndpointsStaticIndex = "index.html";
    this.tunnel = options?.tunnel ??
      new WorkspaceTunnel(
        `${this.htmlEndpointURL}/sse/ping`,
        `${this.htmlEndpointURL}/sse/tunnel`,
        (userAgentID, ctx) => ({
          userAgentID,
          sseTarget: ctx.oakCtx.sendEvents(),
        }),
      );

    router.get(this.tunnel.sseHealthEndpointURL, (ctx) => {
      ctx.response.body =
        `SSE endpoint ${this.tunnel.sseEndpointURL} available`;
      this.tunnel.emit("sseHealthRequest", {
        oakCtx: ctx,
        userAgentIdSupplier: this.config.userAgentIdSupplier,
      });
    });

    router.get(this.tunnel.sseEndpointURL, (ctx) => {
      if (ctx.request.accepts("text/event-stream")) {
        this.tunnel.connect({
          oakCtx: ctx,
          userAgentIdSupplier: this.config.userAgentIdSupplier,
        });
      } else {
        this.tunnel.emit("sseInvalidRequest", {
          oakCtx: ctx,
          userAgentIdSupplier: this.config.userAgentIdSupplier,
        });
      }
    });

    router.get(`${this.htmlEndpointURL}/inspect/env-vars.json`, (ctx) => {
      ctx.response.body = JSON.stringify(Deno.env.toObject());
    });

    // setup the following routes:
    // * /workspace/editor-resolver/factory/**/* to get JSON for where a RF source file can be found
    // * /workspace/editor-redirect/factory/**/* to redirect to an RF source file (e.g. opens VSCode)
    // * /workspace/editor-resolver/publication/**/* to get JSON for where a publication source file can be found
    // * /workspace/editor-redirect/publication/**/* to redirect to a publication source file (e.g. opens VSCode)
    // * /workspace/editor-resolver/abs/**/* to get JSON for where an arbitrary server (abs path) file can be found
    // * /workspace/editor-redirect/abs/**/* to redirect to and arbitrary server file can be found (e.g. opens VSCode)
    [{
      scope: "/factory",
      srcFileRequested: (ctx: oak.Context, endpoint: string) =>
        ctx.request.url.pathname.substring(
          endpoint.length + 1, // skip the leading slash
        ),
      srcFileMapper: (candidate: string) =>
        path.resolve(
          path.fromFileUrl(import.meta.url),
          "../../..",
          candidate,
        ),
    }, {
      scope: "/publication",
      srcFileRequested: (ctx: oak.Context, endpoint: string) =>
        ctx.request.url.pathname.substring(
          endpoint.length + 1, // skip the leading slash
        ),
      srcFileMapper: (candidate: string) => path.resolve(Deno.cwd(), candidate),
    }, {
      scope: "/abs",
      srcFileRequested: (ctx: oak.Context, endpoint: string) =>
        ctx.request.url.pathname.substring(
          endpoint.length, // keep the leading slash
        ),
      srcFileMapper: (candidate: string) => candidate,
    }].forEach((endpoint) => {
      const resolverEndpoint =
        `${this.htmlEndpointURL}/editor-resolver${endpoint.scope}`;
      router.get(`${resolverEndpoint}/(.*)`, (ctx) => {
        const req = endpoint.srcFileRequested(ctx, resolverEndpoint);
        const mapped = endpoint.srcFileMapper(req);
        ctx.response.body = JSON.stringify(
          {
            ...this.config.wsEditorResolver?.(mapped),
            srcFileNameRequested: req,
            srcFileNameMapped: mapped,
          },
        );
      });

      const editorRedirectEndpoint =
        `${this.htmlEndpointURL}/editor-redirect${endpoint.scope}`;
      router.get(`${editorRedirectEndpoint}/(.*)`, (ctx) => {
        const req = endpoint.srcFileRequested(ctx, resolverEndpoint);
        const mapped = endpoint.srcFileMapper(req);
        const resolved = this.config.wsEditorResolver?.(mapped);
        if (resolved) {
          ctx.response.redirect(resolved.editableTargetURI);
        } else {
          ctx.response.body = `${req} (${mapped}) not editable.`;
        }
      });
    });

    // setup the following routes:
    // * /workspace/proxy/factory/**/* to serve RF source code
    [{
      endpoint: `${this.htmlEndpointURL}/proxy/factory`,
      home: () =>
        path.resolve(
          path.fromFileUrl(import.meta.url),
          "../../../../../..",
        ),
    }].forEach((proxy) => {
      router.get(
        `${proxy.endpoint}/(.*)`,
        s.staticContentMiddleware(
          {
            staticAssetsHome: proxy.home(),
          },
          this.staticEE,
          this.wsEndpointsStaticIndex,
          (requestUrlPath) => requestUrlPath.substring(proxy.endpoint.length),
        ),
      );
    });

    const pathInfoRegEx = /(.+?\.html)(\/.*)/;
    router.get(
      `${this.htmlEndpointURL}/(.*)`,
      s.staticContentMiddleware(
        { staticAssetsHome: this.wsEndpointsContentHome },
        this.staticEE,
        this.wsEndpointsStaticIndex,
        (requestUrlPath) => {
          const path = requestUrlPath.substring(this.htmlEndpointURL.length);
          const matchedPI = path.match(pathInfoRegEx);
          return matchedPI ? [matchedPI[1], matchedPI[2]] : path;
        },
      ),
    );
  }

  *watchableFileSysPaths(): Generator<wfs.WatchableFileSysPath> {
    const contentRootPathEE = new wfs.WatchableFileSysEventEmitter();
    const contentRootPath = path.isAbsolute(this.config.contentRootPath)
      ? this.config.contentRootPath
      : path.resolve(Deno.cwd(), this.config.contentRootPath);
    const relWatchPath = (target: string) =>
      path.relative(
        contentRootPath,
        target,
      );
    contentRootPathEE.on(
      "modify",
      // deno-lint-ignore require-await
      async ({ path: modified, pathIndex, fsEventIndex }) => {
        if (modified.endsWith(".ts")) {
          console.info(
            colors.magenta(
              `*** ${
                colors.yellow(relWatchPath(modified))
              } script file change detected (${pathIndex}:${fsEventIndex}) ***`,
            ),
            colors.yellow(
              colors.underline(
                "pubctl.ts (hot reload) server restart required",
              ),
            ),
          );
          return;
        }
        this.tunnel.emitSync(
          "serverFileImpact",
          modified,
          this.config.fsEntryPublicationURL(modified) ??
            this.config.publicURL(),
        );

        // deno-fmt-ignore
        console.info(colors.magenta(`*** ${colors.yellow(relWatchPath(modified))} file change detected (${pathIndex}:${fsEventIndex}) *** ${colors.gray(`${this.tunnel.connections.length || 0} browser tab refresh requests sent`)}`));
      },
    );
    // deno-lint-ignore require-await
    contentRootPathEE.on("create", async (created) => {
      console.log(
        colors.magenta(`*** ${relWatchPath(created.path)} created ***`),
        colors.yellow(
          colors.underline("pubctl.ts (hot reload) server restart required"),
        ),
      );
    });
    // deno-lint-ignore require-await
    contentRootPathEE.on("remove", async (deleted) => {
      console.log(
        colors.magenta(`*** ${relWatchPath(deleted.path)} deleted ***`),
        colors.yellow(
          colors.underline("pubctl.ts (hot reload) server restart required"),
        ),
      );
    });
    yield wfs.typicalWatchableFS(contentRootPath, contentRootPathEE);
  }
}
