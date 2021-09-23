export interface StateTransition<Event, State> {
  readonly event: Event;
  readonly fromState: State;
  readonly toState: State;
}

export interface StateEventListener {
  readonly onEvent: (...args: unknown[]) => void | Promise<void>;
}

export interface StateEventListenerCustom<Event, State> {
  readonly onAnyEvent: (
    event: Event,
    fsm: FiniteStateMachine<Event, State>,
    ...args: unknown[]
  ) => Promise<void>;
}

export interface StateTransitionListener {
  readonly onTransition: (...args: unknown[]) => Promise<void>;
}

export interface StateTransitionListenerCustom<Event, State> {
  readonly onAnyTransition: (
    transition: StateTransition<Event, State>,
    fsm: FiniteStateMachine<Event, State>,
    ...args: unknown[]
  ) => Promise<void>;
}

export interface FiniteStateMachine<Event, State> {
  readonly state: State;
  readonly isTerminal: boolean;
  readonly isTransitionable: (event: Event) => boolean;
  readonly transition: (event: Event, ...args: unknown[]) => Promise<void>;
  readonly transitionSync: (
    event: Event,
    ...args: unknown[]
  ) => State | undefined;
}
