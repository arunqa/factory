import * as c from "./connection.ts";
import * as safety from "../../safety/mod.ts";

export interface WebSocketConnectionState {
  readonly isConnectionState: true;
  readonly isHealthy?: boolean;
}

export interface WebSocketConnectionHealthy extends WebSocketConnectionState {
  readonly isHealthy: true;
  readonly connEstablishedOn: Date;
  readonly endpointURL: string;
  readonly pingURL: string;
}

export const isWebSocketConnectionHealthy = safety.typeGuard<
  WebSocketConnectionHealthy
>("isHealthy", "connEstablishedOn");

export interface WebSocketConnectionUnhealthy extends WebSocketConnectionState {
  readonly isHealthy: false;
  readonly connFailedOn: Date;
  readonly reconnectStrategy?: c.ReconnectionStrategy;
}

export const isWebSocketConnectionUnhealthy = safety.typeGuard<
  WebSocketConnectionUnhealthy
>("isHealthy", "connFailedOn");

export const isWebSocketReconnecting = safety.typeGuard<
  WebSocketConnectionUnhealthy
>("isHealthy", "connFailedOn", "reconnectStrategy");

export interface WebSocketErrorEventSupplier
  extends WebSocketConnectionUnhealthy {
  readonly isEventSourceError: true;
  readonly errorEvent: Event;
}

export const isWebSocketErrorEventSupplier = safety.typeGuard<
  WebSocketErrorEventSupplier
>("isEventSourceError", "errorEvent");

export interface WebSocketCloseEventSupplier
  extends WebSocketConnectionUnhealthy {
  readonly isCloseEvent: true;
  readonly closeEvent: CloseEvent;
}

export const isWebSocketCloseEventSupplier = safety.typeGuard<
  WebSocketCloseEventSupplier
>("isCloseEvent", "closeEvent");

export interface WebSocketEndpointUnavailable {
  readonly isEndpointUnavailable: true;
  readonly endpointURL: string;
  readonly pingURL: string;
  readonly httpStatus?: number;
  readonly httpStatusText?: string;
  readonly connectionError?: Error;
}

export const isWebSocketEndpointUnavailable = safety.typeGuard<
  WebSocketEndpointUnavailable
>("isEndpointUnavailable", "endpointURL");

/**
 * WebSocketFactory will be called upon each connection of WS. It's important
 * that this factory setup the full WebSocket, including any onmessage or
 * event listeners because reconnections will close previous WSs and recreate
 * the WebSocket every time a connection is "broken".
 */
export interface WebSocketFactory {
  construct: (esURL: string) => WebSocket;
  connected?: (es: WebSocket) => void;
}

interface ConnectionStateChangeNotification {
  (
    active: WebSocketConnectionState,
    previous: WebSocketConnectionState,
    tunnel: WebSocketTunnel,
  ): void;
}

interface ReconnectionStateChangeNotification {
  (
    active: c.ReconnectionState,
    previous: c.ReconnectionState,
    rs: c.ReconnectionStrategy,
    tunnel: WebSocketTunnel,
  ): void;
}

interface AllowCloseSupplier {
  (event: CloseEvent, tunnel: WebSocketTunnel): boolean;
}

export interface WebSocketStateInit {
  readonly wsURL: string;
  readonly wsEndpointValidator: c.ConnectionValidator;
  readonly webSocketFactory: WebSocketFactory;
  readonly options?: {
    readonly onConnStateChange?: ConnectionStateChangeNotification;
    readonly onReconnStateChange?: ReconnectionStateChangeNotification;
    readonly allowClose?: AllowCloseSupplier;
  };
}

export class WebSocketTunnel {
  readonly wsURL: string;
  readonly wsEndpointValidator: c.ConnectionValidator;
  readonly observerUniversalScopeID: "universal" = "universal";
  readonly webSocketFactory: WebSocketFactory;
  readonly onConnStateChange?: ConnectionStateChangeNotification;
  readonly onReconnStateChange?: ReconnectionStateChangeNotification;
  readonly allowClose?: AllowCloseSupplier;

  #activeSocket?: WebSocket;
  // isHealthy can be true or false for known states, or undefined at init
  // for "unknown" state
  #connectionState: WebSocketConnectionState = { isConnectionState: true };

  constructor(init: WebSocketStateInit) {
    this.wsURL = init.wsURL;
    this.wsEndpointValidator = init.wsEndpointValidator;
    this.webSocketFactory = init.webSocketFactory;
    this.onConnStateChange = init.options?.onConnStateChange;
    this.onReconnStateChange = init.options?.onReconnStateChange;
    this.allowClose = init.options?.allowClose;
  }

  init(reconnector?: c.ReconnectionStrategy) {
    this.wsEndpointValidator.validate(reconnector).then((resp) => {
      if (resp.ok) {
        // garbage collection if one already exists
        if (this.#activeSocket) this.#activeSocket.close();
        this.#activeSocket = undefined;

        // this.eventSourceFactory() should assign onmessage by default
        const ws = this.#activeSocket = this.webSocketFactory.construct(
          this.wsURL,
        );

        ws.onopen = () => {
          const connState: WebSocketConnectionHealthy = {
            isConnectionState: true,
            isHealthy: true,
            connEstablishedOn: new Date(),
            endpointURL: this.wsURL,
            pingURL: this.wsEndpointValidator.validationEndpointURL.toString(),
          };
          this.connectionState = connState;
          if (reconnector) reconnector.completed();
          this.webSocketFactory.connected?.(ws);
        };

        ws.onclose = (event) => {
          const allowClose = this.allowClose?.(event, this) ?? false;
          if (!allowClose) {
            // if we want a permanent connection go ahead and reconnect now
            const connState: WebSocketCloseEventSupplier = {
              isConnectionState: true,
              isHealthy: false,
              connFailedOn: new Date(),
              isCloseEvent: true,
              closeEvent: event,
              reconnectStrategy: new c.ReconnectionStrategy((reconnector) => {
                // recursively call init() until success or aborted exit
                this.init(reconnector);
              }, {
                onStateChange: this.onReconnStateChange
                  ? (active, previous, rs) => {
                    this.onReconnStateChange?.(active, previous, rs, this);
                  }
                  : undefined,
              }).reconnect(),
            };
            this.connectionState = connState;
          }
        };

        ws.onerror = (event) => {
          ws.close();
          const connState: WebSocketErrorEventSupplier = {
            isConnectionState: true,
            isHealthy: false,
            connFailedOn: new Date(),
            isEventSourceError: true,
            errorEvent: event,
            reconnectStrategy: new c.ReconnectionStrategy((reconnector) => {
              // recursively call init() until success or aborted exit
              this.init(reconnector);
            }, {
              onStateChange: this.onReconnStateChange
                ? (active, previous, rs) => {
                  this.onReconnStateChange?.(active, previous, rs, this);
                }
                : undefined,
            }).reconnect(),
          };
          this.connectionState = connState;
        };
      } else {
        const connState:
          & WebSocketConnectionUnhealthy
          & WebSocketEndpointUnavailable = {
            isConnectionState: true,
            isHealthy: false,
            connFailedOn: new Date(),
            isEndpointUnavailable: true,
            endpointURL: this.wsURL,
            pingURL: this.wsEndpointValidator.validationEndpointURL.toString(),
            httpStatus: resp.status,
            httpStatusText: resp.statusText,
          };
        this.connectionState = connState;
      }
    }).catch((connectionError: Error) => {
      const connState:
        & WebSocketConnectionUnhealthy
        & WebSocketEndpointUnavailable = {
          isConnectionState: true,
          isHealthy: false,
          connFailedOn: new Date(),
          pingURL: this.wsEndpointValidator.validationEndpointURL.toString(),
          connectionError,
          isEndpointUnavailable: true,
          endpointURL: this.wsURL,
        };
      this.connectionState = connState;
    });

    // we return 'this' to allow convenient method chaining
    return this;
  }

  get activeSocket() {
    return this.#activeSocket;
  }

  get connectionState() {
    return this.#connectionState;
  }

  set connectionState(value) {
    const previousConnState = this.#connectionState;
    this.#connectionState = value;
    this.onConnStateChange?.(this.#connectionState, previousConnState, this);
  }
}

export interface WebSocketConnNarrative {
  readonly isHealthy: boolean;
  readonly summary: string;
  readonly color: string;
  readonly summaryHint?: string;
}

export function webSocketConnNarrative(
  tunnel: WebSocketTunnel,
  reconn?: c.ReconnectionStrategy,
): WebSocketConnNarrative {
  const ws = tunnel.connectionState;
  if (!reconn && isWebSocketReconnecting(ws)) {
    reconn = ws.reconnectStrategy;
  }
  let reconnected = false;
  if (reconn) {
    switch (reconn.state) {
      case c.ReconnectionState.WAITING:
      case c.ReconnectionState.TRYING:
        return {
          summary: `reconnecting ${reconn.attempt}/${reconn.maxAttempts}`,
          color: "orange",
          isHealthy: false,
          summaryHint:
            `Trying to reconnect to ${tunnel.wsURL} (WS), reconnecting every ${reconn.intervalMillecs} milliseconds`,
        };

      case c.ReconnectionState.ABORTED:
        return {
          summary: `failed`,
          color: "red",
          isHealthy: false,
          summaryHint:
            `Unable to reconnect to ${tunnel.wsURL} (WS) after ${reconn.maxAttempts} attempts, giving up`,
        };

      case c.ReconnectionState.COMPLETED:
        reconnected = true;
        break;
    }
  }

  // c.ReconnectionState.UNKNOWN and c.ReconnectionState.COMPLETED will fall
  // through to the messages below

  if (isWebSocketConnectionHealthy(ws)) {
    return {
      summary: reconnected ? "reconnected" : "connected",
      color: "green",
      isHealthy: true,
      summaryHint:
        `Connection to ${ws.endpointURL} (WS) verified using ${ws.pingURL} on ${ws.connEstablishedOn}`,
    };
  }

  const isHealthy = false;
  let summary = "unknown";
  let color = "purple";
  let summaryHint = `the WebSocket tunnel is not healthy, but not sure why`;
  if (isWebSocketConnectionUnhealthy(ws)) {
    if (isWebSocketEndpointUnavailable(ws)) {
      summary = "WS unavailable";
      summaryHint = `${ws.endpointURL} not available`;
      if (ws.httpStatus) {
        summary = `WS unavailable (${ws.httpStatus})`;
        summaryHint += ` (HTTP status: ${ws.httpStatus}, ${ws.httpStatusText})`;
        color = "red";
      }
    } else {
      if (isWebSocketErrorEventSupplier(ws)) {
        summary = "error";
        summaryHint = JSON.stringify(ws.errorEvent);
        color = "red";
      }
    }
  }

  return { isHealthy, summary, summaryHint, color };
}
