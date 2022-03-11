export interface ConnectionValidator {
  readonly validationEndpointURL: string | URL | Request;
  readonly validate: (rs?: ReconnectionStrategy) => Promise<Response>;
}

export function typicalConnectionValidator(
  pingURL: string | URL | Request,
): ConnectionValidator {
  return {
    validationEndpointURL: pingURL,
    validate: () => {
      return fetch(pingURL, { method: "HEAD" });
    },
  };
}

export interface ReconnectionStateChangeNotification {
  (
    active: ReconnectionState,
    previous: ReconnectionState,
    stategy: ReconnectionStrategy,
  ): void;
}

export interface ReconnectionStrategyOptions {
  readonly intervalMillecs?: number;
  readonly maxAttempts?: number;
  readonly onStateChange?: ReconnectionStateChangeNotification;
}

export enum ReconnectionState {
  UNKNOWN = "unknown",
  WAITING = "waiting",
  TRYING = "trying",
  COMPLETED = "completed",
  ABORTED = "aborted",
}

export class ReconnectionStrategy {
  readonly maxAttempts: number;
  readonly intervalMillecs: number;
  readonly onStateChange?: ReconnectionStateChangeNotification;
  #state: ReconnectionState = ReconnectionState.UNKNOWN;
  #attempt = 0;
  #interval?: number;

  constructor(
    readonly connect: (rs: ReconnectionStrategy) => void,
    options?: ReconnectionStrategyOptions,
  ) {
    this.maxAttempts = options?.maxAttempts ?? 15;
    this.intervalMillecs = options?.intervalMillecs ?? 1000;
    this.onStateChange = options?.onStateChange;
  }

  get attempt() {
    return this.#attempt;
  }

  get state() {
    return this.#state;
  }

  set state(value) {
    const previousStatus = this.#state;
    this.#state = value;
    this.onStateChange?.(this.#state, previousStatus, this);
  }

  reconnect() {
    this.state = ReconnectionState.WAITING;
    this.#interval = setInterval(() => {
      this.#attempt++;
      if (this.#attempt > this.maxAttempts) {
        this.completed(ReconnectionState.ABORTED);
      } else {
        this.state = ReconnectionState.TRYING;
        this.connect(this);
      }
    }, this.intervalMillecs);
    return this; // return 'this' to encourage method chaining
  }

  completed(status = ReconnectionState.COMPLETED) {
    this.state = status;
    if (this.#interval) {
      clearInterval(this.#interval);
      this.#interval = undefined;
    }
    return this; // return 'this' to encourage method chaining
  }
}
