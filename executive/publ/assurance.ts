import { events } from "../../core/deps.ts";
import { oak } from "./deps.ts";

export interface AssuranceSyntheticTunnelConnection {
  readonly sseTarget: oak.ServerSentEventTarget;
}

export class AssuranceSyntheticTunnel<
  Connection extends AssuranceSyntheticTunnelConnection =
    AssuranceSyntheticTunnelConnection,
  // deno-lint-ignore no-explicit-any
  ConnectionContext extends { oakCtx: oak.Context<any> } = {
    // deno-lint-ignore no-explicit-any
    oakCtx: oak.Context<any>;
  },
> extends events.EventEmitter<{
  sseHealthRequest(ctx: ConnectionContext): void;
  sseConnected(conn: Connection, ctx: ConnectionContext): void;
  sseInvalidRequest(ctx: ConnectionContext): void;
  ping(): void;
}> {
  #connections: Connection[] = [];
  #onlyOpen: ((value: Connection) => boolean) = (c) =>
    c.sseTarget.closed ? false : true;

  constructor(
    readonly sseHealthEndpointURL: string,
    readonly sseEndpointURL: string,
    readonly factory: (ctx: ConnectionContext) => Connection,
  ) {
    super();
    this.on("ping", () => {
      this.cleanConnections().forEach((c) =>
        c.sseTarget.dispatchEvent(
          // we use "__message" as the type so that Service Bus can use
          // raw EventSource.onmessage instead of requiring EventSource.addEventListener
          // on the client side
          new oak.ServerSentEvent("__message", {
            payloadIdentity: "ping",
            at: new Date(),
          }),
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

  connect(ctx: ConnectionContext, pingOnConnect = true): Connection {
    const connection = this.factory(ctx);
    this.cleanConnections().push(this.factory(ctx));
    this.emit("sseConnected", connection, ctx);
    if (pingOnConnect) {
      this.emit("ping");
    }
    return connection;
  }

  // deno-lint-ignore require-await
  async cleanup() {
    this.cleanConnections().forEach((c) => c.sseTarget.close());
  }
}

export interface AssuranceMiddlewareSupplierOptions {
  readonly tunnel: AssuranceSyntheticTunnel;
  readonly htmlEndpointURL: string;
  readonly staticIndex: "index.html" | string;
}

export class AssuranceMiddlewareSupplier {
  readonly tunnel: AssuranceSyntheticTunnel;
  readonly htmlEndpointURL: string;

  constructor(
    readonly config: {
      readonly contentRootPath: string;
      readonly fsEntryPublicationURL: (
        fsAbsPathAndFileName: string,
      ) => string | undefined;
      readonly publicURL: (path?: string) => string;
    },
    readonly app: oak.Application,
    readonly router: oak.Router,
    options?: Partial<AssuranceMiddlewareSupplierOptions>,
  ) {
    this.htmlEndpointURL = options?.htmlEndpointURL ?? "/assurance-synthetic";
    this.tunnel = options?.tunnel ??
      new AssuranceSyntheticTunnel(
        `${this.htmlEndpointURL}/sse/ping`,
        `${this.htmlEndpointURL}/sse/tunnel`,
        (ctx) => ({ sseTarget: ctx.oakCtx.sendEvents() }),
      );

    router.get(this.tunnel.sseHealthEndpointURL, (ctx) => {
      ctx.response.body =
        `SSE endpoint ${this.tunnel.sseEndpointURL} available`;
      this.tunnel.emit("sseHealthRequest", { oakCtx: ctx });
    });

    router.get(this.tunnel.sseEndpointURL, (ctx) => {
      if (ctx.request.accepts("text/event-stream")) {
        this.tunnel.connect({ oakCtx: ctx });
      } else {
        this.tunnel.emit("sseInvalidRequest", { oakCtx: ctx });
      }
    });

    // this route just mirrors what was sent with a little extra context so
    // that unit testing will work
    router.post(`${this.htmlEndpointURL}/service-bus/mirror`, async (ctx) => {
      const body = ctx.request.body();
      const message = JSON.parse(await body.value);
      ctx.response.body = JSON.stringify({
        ...message,
        serviceBusServerFetchHandler: {
          provenance: import.meta.url,
          endpoint: ctx.request.url,
          method: ctx.request.method,
        },
      });
    });
  }
}
