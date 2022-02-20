import * as events from "https://raw.githubusercontent.com/ihack2712/eventemitter/1.2.3/mod.ts";

export class WatchableFileSysEventEmitter extends events.EventEmitter<{
  create(path: string, fse: Deno.FsEvent, w: Deno.FsWatcher): Promise<void>;
  modify(path: string, fse: Deno.FsEvent, w: Deno.FsWatcher): Promise<void>;
  remove(path: string, fse: Deno.FsEvent, w: Deno.FsWatcher): Promise<void>;
  impacted(path: string, fse: Deno.FsEvent, w: Deno.FsWatcher): Promise<void>;
}> {}

export interface WatchableFileSysPath {
  readonly identity?: string;
  readonly path: string;
  readonly trigger: (
    event: Deno.FsEvent,
    watcher: Deno.FsWatcher,
  ) => Promise<number>;
  readonly onEvent: (
    path: string,
    event: Deno.FsEvent,
    watcher: Deno.FsWatcher,
  ) => Promise<void>;
}

export function typicalWatchableFS(
  absPath: string,
  wfsEE: WatchableFileSysEventEmitter,
  options?: Partial<Omit<WatchableFileSysPath, "path">>,
): WatchableFileSysPath {
  const result: WatchableFileSysPath = {
    path: absPath,
    identity: options?.identity,
    trigger: async (event, watcher) => {
      let count = 0;
      for (const p of event.paths) {
        if (p.startsWith(absPath)) {
          await result.onEvent(p, event, watcher);
          count++;
        }
      }
      return count;
    },
    onEvent: options?.onEvent ? options?.onEvent : async (path, fse, w) => {
      switch (fse.kind) {
        case "create":
          await wfsEE.emit("impacted", path, fse, w);
          await wfsEE.emit("create", path, fse, w);
          break;

        case "modify":
          await wfsEE.emit("impacted", path, fse, w);
          await wfsEE.emit("modify", path, fse, w);
          break;

        case "remove":
          await wfsEE.emit("impacted", path, fse, w);
          await wfsEE.emit("remove", path, fse, w);
          break;
      }
    },
  };
  return result;
}
