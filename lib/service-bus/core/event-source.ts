import * as govn from "../governance.ts";
import * as c from "./connection.ts";
import * as safety from "../../safety/mod.ts";

// Using Server Sent Events (SSEs or "EventSource") on anything but HTTP/2 connections is not recommended.
// See [EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) warning section.
// See [EventSource: why no more than 6 connections?](https://stackoverflow.com/questions/16852690/sseeventsource-why-no-more-than-6-connections).

export interface EventSourceCustomEventDetail<
  Payload extends govn.IdentifiablePayload,
> {
  readonly eventSrcPayload: Payload;
}

export interface EventSourceConnectionState {
  readonly isConnectionState: true;
  readonly isHealthy?: boolean;
}

export interface EventSourceConnectionHealthy
  extends EventSourceConnectionState {
  readonly isHealthy: true;
  readonly connEstablishedOn: Date;
  readonly endpointURL: string;
  readonly pingURL: string;
}

export const isEventSourceConnectionHealthy = safety.typeGuard<
  EventSourceConnectionHealthy
>("isHealthy", "connEstablishedOn");

export interface EventSourceConnectionUnhealthy
  extends EventSourceConnectionState {
  readonly isHealthy: false;
  readonly connFailedOn: Date;
  readonly reconnectStrategy?: c.ReconnectionStrategy;
}

export const isEventSourceConnectionUnhealthy = safety.typeGuard<
  EventSourceConnectionUnhealthy
>("isHealthy", "connFailedOn");

export const isEventSourceReconnecting = safety.typeGuard<
  EventSourceConnectionUnhealthy
>("isHealthy", "connFailedOn", "reconnectStrategy");

export interface EventSourceError extends EventSourceConnectionUnhealthy {
  readonly isEventSourceError: true;
  readonly errorEvent: Event;
}

export const isEventSourceError = safety.typeGuard<
  EventSourceError
>("isEventSourceError", "errorEvent");

export interface EventSourceEndpointUnavailable {
  readonly isEndpointUnavailable: true;
  readonly endpointURL: string;
  readonly pingURL: string;
  readonly httpStatus?: number;
  readonly httpStatusText?: string;
  readonly connectionError?: Error;
}

export const isEventSourceEndpointUnavailable = safety.typeGuard<
  EventSourceEndpointUnavailable
>("isEndpointUnavailable", "endpointURL");

/**
 * EventSourceFactory will be called upon each connection of ES. It's important
 * that this factory setup the full EventSource, including any onmessage or
 * event listeners because reconnections will close previous ESs and recreate
 * the EventSource every time a connection is "broken".
 *
 * We're using a generic EventSource because we build in Deno but Deno doesn't
 * know what an EventSource is (it's known in browsers). This did not work:
 *     /// <reference lib="dom" />
 * note: <reference lib="dom" /> works in VS Code but created Deno.emit() and
 * 'path-task bundle-all' errors.
 * TODO: figure out how to not use EventSource generic.
 */
export interface EventSourceFactory<EventSource> {
  construct: (esURL: string) => EventSource;
  connected?: (es: EventSource) => void;
}

interface ConnectionStateChangeNotification {
  (
    active: EventSourceConnectionState,
    previous: EventSourceConnectionState,
    tunnel: EventSourceTunnel,
  ): void;
}

interface ReconnectionStateChangeNotification {
  (
    active: c.ReconnectionState,
    previous: c.ReconnectionState,
    rs: c.ReconnectionStrategy,
    tunnel: EventSourceTunnel,
  ): void;
}

export interface EventSourceStateInit<EventSource> {
  readonly esURL: string;
  readonly esPingURL: string;
  readonly eventSourceFactory: EventSourceFactory<EventSource>;
  readonly options?: {
    readonly onConnStateChange?: ConnectionStateChangeNotification;
    readonly onReconnStateChange?: ReconnectionStateChangeNotification;
  };
}

// deno-lint-ignore no-explicit-any
export class EventSourceTunnel<EventSource = any> {
  readonly esURL: string;
  readonly esPingURL: string;
  readonly observerUniversalScopeID: "universal" = "universal";
  readonly eventSourceFactory: EventSourceFactory<EventSource>;
  readonly onConnStateChange?: ConnectionStateChangeNotification;
  readonly onReconnStateChange?: ReconnectionStateChangeNotification;

  // isHealthy can be true or false for known states, or undefined at init
  // for "unknown" state
  #connectionState: EventSourceConnectionState = { isConnectionState: true };

  constructor(init: EventSourceStateInit<EventSource>) {
    this.esURL = init.esURL;
    this.esPingURL = init.esPingURL;
    this.eventSourceFactory = init.eventSourceFactory;
    this.onConnStateChange = init.options?.onConnStateChange;
    this.onReconnStateChange = init.options?.onReconnStateChange;
  }

  init(reconnector?: c.ReconnectionStrategy) {
    fetch(this.esPingURL, { method: "HEAD" }).then((resp) => {
      if (resp.ok) {
        // this.eventSourceFactory() should assign onmessage by default
        const eventSource = this.eventSourceFactory.construct(this.esURL);

        // for type-safety in Deno we need to coerce to what we know ES is;
        // TODO: figure out how why /// <reference lib="dom" /> did not work.
        // note: <reference lib="dom" /> works in VS Code but not in Deno.emit().
        const coercedES = eventSource as unknown as {
          // deno-lint-ignore no-explicit-any
          onerror: ((this: EventSource, ev: Event) => any) | null;
          // deno-lint-ignore no-explicit-any
          onopen: ((this: EventSource, ev: Event) => any) | null;
          close: () => void;
        };

        coercedES.onopen = () => {
          const connState: EventSourceConnectionHealthy = {
            isConnectionState: true,
            isHealthy: true,
            connEstablishedOn: new Date(),
            endpointURL: this.esURL,
            pingURL: this.esPingURL,
          };
          this.connectionState = connState;
          if (reconnector) reconnector.completed();
          this.eventSourceFactory.connected?.(eventSource);
        };

        coercedES.onerror = (event) => {
          coercedES.close();
          const connState: EventSourceError = {
            isConnectionState: true,
            isHealthy: false,
            connFailedOn: new Date(),
            isEventSourceError: true,
            errorEvent: event,
            reconnectStrategy: new c.ReconnectionStrategy((reconnector) => {
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
          // recursively call init() until success or aborted exit
        };
      } else {
        const connState:
          & EventSourceConnectionUnhealthy
          & EventSourceEndpointUnavailable = {
            isConnectionState: true,
            isHealthy: false,
            connFailedOn: new Date(),
            isEndpointUnavailable: true,
            endpointURL: this.esURL,
            pingURL: this.esPingURL,
            httpStatus: resp.status,
            httpStatusText: resp.statusText,
          };
        this.connectionState = connState;
      }
    }).catch((connectionError: Error) => {
      const connState:
        & EventSourceConnectionUnhealthy
        & EventSourceEndpointUnavailable = {
          isConnectionState: true,
          isHealthy: false,
          connFailedOn: new Date(),
          pingURL: this.esPingURL,
          connectionError,
          isEndpointUnavailable: true,
          endpointURL: this.esPingURL,
        };
      this.connectionState = connState;
    });

    // we return 'this' to allow convenient method chaining
    return this;
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

export interface EventSourceConnNarrative {
  readonly isHealthy: boolean;
  readonly summary: string;
  readonly color: string;
  readonly summaryHint?: string;
}

export function eventSourceConnNarrative(
  tunnel: EventSourceTunnel,
  reconn?: c.ReconnectionStrategy,
): EventSourceConnNarrative {
  const sseState = tunnel.connectionState;
  if (!reconn && isEventSourceReconnecting(sseState)) {
    reconn = sseState.reconnectStrategy;
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
            `Trying to reconnect to ${tunnel.esURL}, reconnecting every ${reconn.intervalMillecs} milliseconds`,
        };

      case c.ReconnectionState.ABORTED:
        return {
          summary: `failed`,
          color: "red",
          isHealthy: false,
          summaryHint:
            `Unable to reconnect to ${tunnel.esURL} after ${reconn.maxAttempts} attempts, giving up`,
        };

      case c.ReconnectionState.COMPLETED:
        reconnected = true;
        break;
    }
  }

  // c.ReconnectionState.UNKNOWN and c.ReconnectionState.COMPLETED will fall
  // through to the messages below

  if (isEventSourceConnectionHealthy(sseState)) {
    return {
      summary: reconnected ? "reconnected" : "connected",
      color: "green",
      isHealthy: true,
      summaryHint:
        `Connection to ${sseState.endpointURL} verified using ${sseState.pingURL} on ${sseState.connEstablishedOn}`,
    };
  }

  const isHealthy = false;
  let summary = "unknown";
  let color = "purple";
  let summaryHint = `the tunnel is not healthy, but not sure why`;
  if (isEventSourceConnectionUnhealthy(sseState)) {
    if (isEventSourceEndpointUnavailable(sseState)) {
      summary = "unavailable";
      summaryHint = `${sseState.endpointURL} not available`;
      if (sseState.httpStatus) {
        summary = `unavailable (${sseState.httpStatus})`;
        summaryHint +=
          ` (HTTP status: ${sseState.httpStatus}, ${sseState.httpStatusText})`;
        color = "red";
      }
    } else {
      if (isEventSourceError(sseState)) {
        summary = "error";
        summaryHint = JSON.stringify(sseState.errorEvent);
        color = "red";
      }
    }
  }

  return { isHealthy, summary, summaryHint, color };
}
