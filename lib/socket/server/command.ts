export type SocketCommandIdentity = string;

export interface CommandPayload<Arguments = void> {
  readonly nature: "command";
  readonly identity: SocketCommandIdentity;
  readonly arguments: Arguments;
}

export interface SocketCommand<
  Arguments,
  Result = void,
  Configuration extends SocketCommandsConfiguration =
    SocketCommandsConfiguration,
  State extends SocketState = SocketState,
> {
  readonly identity: SocketCommandIdentity;
  readonly execute: (
    cm: SocketCommandsManager<Configuration, State>,
    args: Arguments,
  ) => Promise<Result>;
}

export type SocketCommandData =
  | string
  | ArrayBufferLike
  | Blob
  | ArrayBufferView;

export interface SocketState {
  readonly originURL?: URL;
  readonly socket: WebSocket;
  readonly configure: (
    handlers: Pick<WebSocket, "onopen" | "onclose" | "onerror">,
  ) => void;
  readonly send: (
    data: SocketCommandData,
  ) => void;
  readonly cleanup: () => Promise<void>;
}

export interface SocketsStateSendOptions<State extends SocketState> {
  readonly shouldSend?: (ss: State, data: SocketCommandData) => boolean;
  readonly beforeSend?: (data: SocketCommandData, ss: State) => boolean;
  readonly afterSend?: (data: SocketCommandData, ss: State) => void;
}

export interface SocketsState<State extends SocketState> {
  readonly active: Iterable<State>;
  readonly send: (
    data: SocketCommandData,
    options?: SocketsStateSendOptions<State>,
  ) => void;
  readonly sendCommand: <Arguments>(
    command: SocketCommand<Arguments>,
    args: Arguments,
    options?: SocketsStateSendOptions<State>,
  ) => void;
  readonly register: (socket: State) => State;
  readonly cleanup: () => Promise<void>;
}

export interface SocketCommandsConfiguration {
  readonly endpointBaseURL: string;
}

export interface SocketCommandsManager<
  Configuration extends SocketCommandsConfiguration =
    SocketCommandsConfiguration,
  State extends SocketState = SocketState,
> {
  readonly config: SocketCommandsConfiguration;
  readonly state: SocketsState<State>;
  readonly commands: Map<
    SocketCommandIdentity,
    // deno-lint-ignore no-explicit-any
    SocketCommand<any, any, Configuration, State>
  >;
  readonly execute: <Arguments, Result>(
    identity: SocketCommandIdentity,
    args: Arguments,
    onCmdNotFound: (
      identity: SocketCommandIdentity,
      args: Arguments,
    ) => Promise<Result>,
  ) => Promise<Result>;
}

export class TypicalSocketsState<State extends SocketState>
  implements SocketsState<State> {
  readonly #active: State[] = [];

  get active(): Iterable<State> {
    return this.#active;
  }

  register(ss: State): State {
    ss.configure({
      onopen: () => this.#active.push(ss),
      onclose: () => {
        const index = this.#active.indexOf(ss);
        if (index !== -1) {
          this.#active.splice(index, 1);
        }
      },
      onerror: (e) => console.error("TypicalSocketsState socket error", e),
    });
    return ss;
  }

  send(
    data: SocketCommandData,
    options?: SocketsStateSendOptions<State>,
  ): void {
    const shouldSend = options?.shouldSend;
    const beforeSend = options?.beforeSend;
    const afterSend = options?.afterSend;
    for (const ss of this.#active) {
      if (shouldSend && !shouldSend(ss, data)) continue;
      if (beforeSend) {
        const send = beforeSend(data, ss);
        if (!send) continue;
      }
      ss.socket.send(data);
      if (afterSend) afterSend(data, ss);
    }
  }

  sendCommand<Arguments = void>(
    command: SocketCommand<Arguments>,
    args: Arguments,
    options?: SocketsStateSendOptions<State>,
  ) {
    const payload: CommandPayload<Arguments> = {
      nature: "command",
      identity: command.identity || "??identity",
      arguments: args,
    };
    this.send(JSON.stringify(payload), options);
  }

  async cleanup(): Promise<void> {
    for (const ss of this.#active) {
      await ss.cleanup();
    }
  }
}

export class TypicalSocketCommandsManager<
  Configuration extends SocketCommandsConfiguration,
  State extends SocketState,
> implements SocketCommandsManager<Configuration, State> {
  readonly commands = new Map<
    SocketCommandIdentity,
    // deno-lint-ignore no-explicit-any
    SocketCommand<any, any, Configuration, State>
  >();
  readonly state: SocketsState<State>;
  constructor(
    readonly config: Configuration,
    stateConstruct?: (
      cm: TypicalSocketCommandsManager<Configuration, State>,
    ) => SocketsState<State>,
  ) {
    this.state = stateConstruct
      ? stateConstruct(this)
      : new TypicalSocketsState();
  }

  // deno-lint-ignore no-explicit-any
  register(command: SocketCommand<any, any, Configuration, State>) {
    this.commands.set(command.identity, command);
  }

  async execute<Arguments, Result>(
    identity: SocketCommandIdentity,
    args: Arguments,
    onCmdNotFound: (
      identity: SocketCommandIdentity,
      args: Arguments,
    ) => Promise<Result>,
  ): Promise<Result> {
    const command = this.commands.get(identity);
    if (command) {
      return await command.execute(this, args) as Result;
    }
    return onCmdNotFound(identity, args);
  }
}
