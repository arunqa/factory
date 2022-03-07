///! <reference lib="dom" />
import * as govn from "./governance.ts";
import * as c from "./connection.ts";

export interface EventSourceStrategy {
  observeEventSource: <
    EventSourcePayload extends govn.IdentifiablePayload,
  >(
    observer: EventSourceObserver<EventSourcePayload>,
    payloadID?: govn.PayloadIdentity,
  ) => void;
}

export interface EventSourceProxy<
  EventSourcePayload extends govn.IdentifiablePayload,
> {
  readonly prepareEventSourcePayload: (rawJSON: unknown) => EventSourcePayload;
  readonly observeEventSource: (
    ess: EventSourceStrategy,
    observer: EventSourceObserver<EventSourcePayload>,
  ) => void;
}

export interface EventSourceObserver<
  EventSourcePayload extends govn.IdentifiablePayload,
> {
  (esp: EventSourcePayload, ess: EventSourceStrategy): void;
}

export interface EventSourceCustomEventDetail<
  Payload extends govn.IdentifiablePayload,
> {
  readonly eventSrcPayload: Payload;
}

export interface EventSourceConnectionState {
  readonly isHealthy?: boolean;
}

export interface EventSourceConnectionHealthy
  extends EventSourceConnectionState {
  readonly isHealthy: true;
}

export interface EventSourceConnectionUnhealthy
  extends EventSourceConnectionState {
  readonly isHealthy: false;
  readonly reconnectStrategy?: c.ReconnectionStrategy;
}

export interface EventSourceError extends EventSourceConnectionUnhealthy {
  readonly isEventSourceError: true;
  readonly errorEvent: Event;
}

export interface EventSourceEndpointAvailability
  extends EventSourceConnectionUnhealthy {
  readonly isEventSourceEndpointAvailable: false;
  readonly httpStatus?: number;
  readonly httpStatusText?: string;
  readonly connectionError?: Error;
}

function eventSourceError(
  errorEvent: Event,
  reconnectStrategy: c.ReconnectionStrategy,
): EventSourceError {
  return {
    isHealthy: false,
    isEventSourceError: true,
    errorEvent,
    reconnectStrategy,
  };
}

function endpointUnavailable(
  state?: Partial<EventSourceEndpointAvailability>,
): EventSourceEndpointAvailability {
  return {
    isHealthy: false,
    isEventSourceEndpointAvailable: false,
    ...state,
  };
}

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
  ): void;
}

export interface EventSourceStateInit<EventSource> {
  readonly esURL: string;
  readonly esPingURL: string;
  readonly eventSourceFactory: EventSourceFactory<EventSource>;
  readonly options?: {
    readonly onConnStateChange?: ConnectionStateChangeNotification;
    readonly onReconnStateChange?: c.ReconnectionStateChangeNotification;
  };
}

// deno-lint-ignore no-explicit-any
export class EventSourceTunnel<EventSource = any> {
  readonly esURL: string;
  readonly esPingURL: string;
  readonly observerUniversalScopeID: "universal" = "universal";
  readonly eventSourceFactory: EventSourceFactory<EventSource>;
  readonly onConnStateChange?: ConnectionStateChangeNotification;
  readonly onReconnStateChange?: c.ReconnectionStateChangeNotification;

  // isHealthy can be true or false for known states, or undefined at init
  // for "unknown" state
  #connectionState: EventSourceConnectionState = { isHealthy: undefined };

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
          this.connectionState = { isHealthy: true };
          if (reconnector) reconnector.completed();
          this.eventSourceFactory.connected?.(eventSource);
        };

        coercedES.onerror = (event) => {
          coercedES.close();
          // recursively call init() until success or aborted exit
          this.connectionState = eventSourceError(
            event,
            new c.ReconnectionStrategy((reconnector) => {
              this.init(reconnector);
            }, {
              onStateChange: this.onReconnStateChange,
            }).reconnect(),
          );
        };
      } else {
        this.connectionState = endpointUnavailable({
          httpStatus: resp.status,
          httpStatusText: resp.statusText,
        });
      }
    }).catch((connectionError: Error) => {
      this.connectionState = endpointUnavailable({ connectionError });
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
    this.onConnStateChange?.(this.#connectionState, previousConnState);
  }
}
