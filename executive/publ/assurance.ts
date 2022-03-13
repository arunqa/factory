import { events } from "../../core/deps.ts";
import { oak } from "./deps.ts";
import * as ping from "../../lib/service-bus/service/ping.ts";

export interface AssuranceSyntheticEventSrcTunnelConnection {
  readonly userAgentID: string;
  readonly sseTarget: oak.ServerSentEventTarget;
}

export class AssuranceSyntheticEventSrcTunnel<
  Connection extends AssuranceSyntheticEventSrcTunnelConnection =
    AssuranceSyntheticEventSrcTunnelConnection,
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
    //     `[${this.#connections.length}] AssuranceSyntheticEventSrcTunnelConnection ${conn.userAgentID}, ${ctx.oakCtx.request.url}`,
    //   );
    // });
  }

  get connections(): Connection[] {
    return this.#connections;
  }

  protected cleanConnections(): Connection[] {
    this.#connections = this.#connections.filter(this.#onlyOpen);
    return this.#connections;
  }

  connect(ctx: ConnectionContext, pingOnConnect = true): Connection {
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
    if (pingOnConnect) {
      connection.sseTarget.dispatchMessage(ping.pingPayload());
    }
    return connection;
  }

  // deno-lint-ignore require-await
  async cleanup() {
    this.cleanConnections().forEach((c) => c.sseTarget.close());
  }
}

export interface AssuranceSyntheticWebSocketTunnelConnection {
  readonly webSocket: WebSocket;
}

export class AssuranceSyntheticWebSocketTunnel<
  Connection extends AssuranceSyntheticWebSocketTunnelConnection =
    AssuranceSyntheticWebSocketTunnelConnection,
  // deno-lint-ignore no-explicit-any
  ConnectionContext extends { oakCtx: oak.Context<any> } = {
    // deno-lint-ignore no-explicit-any
    oakCtx: oak.Context<any>;
  },
> extends events.EventEmitter<{
  wsHealthRequest(ctx: ConnectionContext): void;
  wsConnected(conn: Connection, ctx: ConnectionContext): void;
  wsInvalidRequest(ctx: ConnectionContext): void;
  ping(): void;
}> {
  #connections: Connection[] = [];

  constructor(
    readonly wsHealthEndpointURL: string,
    readonly wsEndpointURL: string,
    readonly factory: (ctx: ConnectionContext) => Connection,
  ) {
    super();
    this.on(ping.pingPayloadIdentity, () => {
      this.selectConnections().forEach((c) =>
        c.webSocket.send(ping.pingWebSocketSendPayload())
      );
    });
  }

  get connections(): Connection[] {
    return this.#connections;
  }

  protected selectConnections(
    filter?: (value: Connection) => boolean,
  ): Connection[] {
    this.#connections = filter
      ? this.#connections.filter(filter)
      : this.#connections;
    return this.#connections;
  }

  // deno-lint-ignore require-await
  async connect(
    ctx: ConnectionContext,
    pingOnConnect = true,
  ): Promise<Connection> {
    const connection = this.factory(ctx);
    const ws = connection.webSocket;
    ws.onopen = () => {
      if (pingOnConnect) {
        this.emit("ping");
      }
    };
    ws.onmessage = (event) => {
      console.log("TODO ws message", ws.url, event);
    };
    ws.onclose = () => {
      const index = this.#connections.findIndex((conn) =>
        conn.webSocket === ws
      );
      if (index >= 0) this.#connections.splice(index, 1);
    };
    this.emit("wsConnected", connection, ctx);
    return connection;
  }

  // deno-lint-ignore require-await
  async cleanup() {
    this.selectConnections().forEach((c) => c.webSocket.close());
  }
}

export interface AssuranceMiddlewareSupplierOptions {
  readonly esTunnel: AssuranceSyntheticEventSrcTunnel;
  readonly wsTunnel: AssuranceSyntheticWebSocketTunnel;
  readonly htmlEndpointURL: string;
  readonly staticIndex: "index.html" | string;
}

export class AssuranceMiddlewareSupplier {
  readonly esTunnel: AssuranceSyntheticEventSrcTunnel;
  readonly wsTunnel: AssuranceSyntheticWebSocketTunnel;
  readonly htmlEndpointURL: string;

  constructor(
    readonly config: {
      readonly contentRootPath: string;
      readonly fsEntryPublicationURL: (
        fsAbsPathAndFileName: string,
      ) => string | undefined;
      readonly publicURL: (path?: string) => string;
      readonly userAgentIdSupplier: (ctx: oak.Context) => string;
    },
    readonly app: oak.Application,
    readonly router: oak.Router,
    options?: Partial<AssuranceMiddlewareSupplierOptions>,
  ) {
    this.htmlEndpointURL = options?.htmlEndpointURL ?? "/assurance-synthetic";
    this.esTunnel = options?.esTunnel ??
      new AssuranceSyntheticEventSrcTunnel(
        `${this.htmlEndpointURL}/sse/ping`,
        `${this.htmlEndpointURL}/sse/tunnel`,
        (userAgentID, ctx) => ({
          userAgentID,
          sseTarget: ctx.oakCtx.sendEvents(),
        }),
      );

    router.get(this.esTunnel.sseHealthEndpointURL, (ctx) => {
      ctx.response.body =
        `SSE endpoint ${this.esTunnel.sseEndpointURL} available`;
      this.esTunnel.emit("sseHealthRequest", {
        oakCtx: ctx,
        userAgentIdSupplier: this.config.userAgentIdSupplier,
      });
    });

    router.get(this.esTunnel.sseEndpointURL, (ctx) => {
      if (ctx.request.accepts("text/event-stream")) {
        this.esTunnel.connect({
          oakCtx: ctx,
          userAgentIdSupplier: this.config.userAgentIdSupplier,
        });
      } else {
        this.esTunnel.emit("sseInvalidRequest", {
          oakCtx: ctx,
          userAgentIdSupplier: this.config.userAgentIdSupplier,
        });
      }
    });

    this.wsTunnel = options?.wsTunnel ??
      new AssuranceSyntheticWebSocketTunnel(
        `${this.htmlEndpointURL}/ws/ping`,
        `${this.htmlEndpointURL}/ws/tunnel`,
        (ctx) => {
          return { webSocket: ctx.oakCtx.upgrade() };
        },
      );

    router.get(this.wsTunnel.wsHealthEndpointURL, (ctx) => {
      ctx.response.body =
        `WebSocket endpoint ${this.wsTunnel.wsEndpointURL} available`;
      this.wsTunnel.emit("wsHealthRequest", { oakCtx: ctx });
    });

    router.get(this.wsTunnel.wsEndpointURL, (ctx) => {
      if (ctx.isUpgradable) {
        this.wsTunnel.connect({ oakCtx: ctx });
      } else {
        this.wsTunnel.emit("wsInvalidRequest", { oakCtx: ctx });
      }
    });

    // this route just mirrors what was sent with a little extra context so
    // that unit testing will work
    router.post(`${this.htmlEndpointURL}/service-bus/mirror`, async (ctx) => {
      const body = ctx.request.body();
      const message = JSON.parse(await body.value);
      ctx.response.body = JSON.stringify({
        ...message,
        isAssurance: true,
        isSyntheticMirror: true,
        serviceBusServerFetchHandler: {
          provenance: import.meta.url,
          endpoint: ctx.request.url,
          method: ctx.request.method,
        },
      });
    });
  }
}
