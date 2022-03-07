///! <reference lib="dom" />
import * as govn from "./governance.ts";
import * as c from "./connection.ts";

// ===================================================================
// TODO: REMOVE EVENTSOURCEEVENTMAP AND EVENTSOURCE LOCAL DECLARATIONS
// ===================================================================
// had to copy EventSourceEventMap and EventSource interfaces from lib.dom.d.ts
// because "/// <reference lib="dom" />" works in VS Code but not Deno.emit().

interface EventSourceEventMap {
  "error": Event;
  "message": MessageEvent;
  "open": Event;
}

interface EventSource extends EventTarget {
  onerror: ((this: EventSource, ev: Event) => any) | null;
  onmessage: ((this: EventSource, ev: MessageEvent) => any) | null;
  onopen: ((this: EventSource, ev: Event) => any) | null;
  /** Returns the state of this EventSource object's connection. It can have the values described below. */
  readonly readyState: number;
  /** Returns the URL providing the event stream. */
  readonly url: string;
  /** Returns true if the credentials mode for connection requests to the URL providing the event stream is set to "include", and false otherwise. */
  readonly withCredentials: boolean;
  /** Aborts any instances of the fetch algorithm started for this EventSource object, and sets the readyState attribute to CLOSED. */
  close(): void;
  readonly CLOSED: number;
  readonly CONNECTING: number;
  readonly OPEN: number;
  addEventListener<K extends keyof EventSourceEventMap>(
    type: K,
    listener: (this: EventSource, ev: EventSourceEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener<K extends keyof EventSourceEventMap>(
    type: K,
    listener: (this: EventSource, ev: EventSourceEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
}

// =========================================================================
// TODO: ^^^^^ REMOVE EVENTSOURCEEVENTMAP AND EVENTSOURCE LOCAL DECLARATIONS
// =========================================================================

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
  readonly isHealthy: boolean;
}

export interface EventSourceConnectionHealthy
  extends EventSourceConnectionState {
  readonly isHealthy: true;
}

export interface EventSourceConnectionUnhealthy
  extends EventSourceConnectionState {
  readonly isHealthy: false;
}

export interface EventSourceError extends EventSourceConnectionUnhealthy {
  readonly isEventSourceError: true;
  readonly errorEvent: Event;
}

export interface EventSourceEndpointUnvailable
  extends EventSourceConnectionUnhealthy {
  readonly isEventSourceEndpointUnvailable: true;
  readonly httpStatus?: number;
  readonly httpStatusText?: string;
  readonly connectionError?: Error;
}

function eventSourceError(
  errorEvent: Event,
): EventSourceError {
  return {
    isHealthy: false,
    isEventSourceError: true,
    errorEvent,
  };
}

function endpointUnavailable(
  state?: Partial<EventSourceEndpointUnvailable>,
): EventSourceEndpointUnvailable {
  return {
    isHealthy: false,
    isEventSourceEndpointUnvailable: true,
    ...state,
  };
}

export interface EventSourceListener {
  readonly identity: string;
  readonly observableListener: (event: Event) => void;
  readonly options?: boolean | AddEventListenerOptions | undefined;
}

export type EventSourceListeners = EventSourceListener[];

/**
 * EventSourceFactory will be called upon each connection of ES. It's important
 * that this factory setup the full EventSource, including any onmessage or
 * event listeners because reconnections will close previous ESs and recreate
 * the EventSource every time a connection is "broken".
 */
export interface EventSourceFactory {
  construct: (esURL: string) => EventSource;
  connected?: (es: EventSource) => void;
}

export interface EventSourceStateInit {
  readonly esURL: string;
  readonly esPingURL: string;
  readonly eventSourceFactory: EventSourceFactory;
}

export class EventSourceTunnel {
  readonly esURL: string;
  readonly esPingURL: string;
  readonly observers = new EventTarget();
  readonly observerUniversalScopeID: "universal" = "universal";

  readonly eventSourceFactory: EventSourceFactory;
  readonly eventSourceListeners: EventSourceListeners = [];

  #connectionState?: EventSourceConnectionState;

  constructor(init: EventSourceStateInit) {
    this.esURL = init.esURL;
    this.esPingURL = init.esPingURL;
    this.eventSourceFactory = init.eventSourceFactory;
  }

  init(reconnector?: c.ReconnectionStrategy) {
    fetch(this.esPingURL, { method: "HEAD" }).then((resp) => {
      if (resp.ok) {
        // this.eventSourceFactory() should assign onmessage by default
        const eventSource = this.eventSourceFactory.construct(this.esURL);

        eventSource.onopen = () => {
          this.connectionState = { isHealthy: true };
          if (reconnector) reconnector.completed();
          this.eventSourceFactory.connected?.(eventSource);
        };

        eventSource.onerror = (event) => {
          eventSource.close();
          this.connectionState = eventSourceError(event);

          // recursively call init() until success or aborted exit
          new c.ReconnectionStrategy((reconnector) => {
            this.init(reconnector);
          }, {
            onStateChange: (active, previous) => {
              this.observers.dispatchEvent(
                new CustomEvent("reconnection-state", {
                  detail: {
                    connState: this.connectionState,
                    previousReconnState: previous,
                    activeReconnState: active,
                    esState: this,
                  },
                }),
              );
            },
          }).reconnect();
        };

        // in case we're reconnecting, get the existing listeners attached to the new ES
        this.eventSourceListeners.forEach((l) => {
          eventSource.addEventListener(
            l.identity,
            l.observableListener,
            l.options,
          );
        });
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
    const statusEventDetail = {
      previousConnState: this.#connectionState,
      activeConnState: value,
      esState: this,
    };
    this.#connectionState = value;
    this.observers.dispatchEvent(
      new CustomEvent("connection-state", { detail: statusEventDetail }),
    );
  }
}
