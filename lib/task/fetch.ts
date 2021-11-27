import { ioStreamConversion as iosc } from "./deps.ts";
import * as govn from "./governance.ts";
import * as human from "../text/human.ts";

// deno-lint-ignore no-empty-interface
export interface FetchTaskRunnerSupplier
  extends govn.IdentifiableTaskRunnerSupplier {
}

// deno-lint-ignore no-empty-interface
export interface GraphQlTaskRunnerSupplier extends FetchTaskRunnerSupplier {
}

export function graphQlTask(
  identity: string,
  endpoint: string,
  query: string,
  variables?: Record<string, unknown>,
  onData?: (data: unknown) => void,
  onError?: (error: Error) => void,
): GraphQlTaskRunnerSupplier {
  if (!onData) {
    onData = (data) => {
      console.dir(data, { showHidden: true, depth: undefined, colors: true });
    };
  }
  if (!onError) {
    onError = (error) => {
      console.dir(error, { colors: true });
    };
  }
  return {
    identity,
    // deno-lint-ignore require-await
    exec: async () => {
      fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(
          variables
            ? {
              query,
              variables,
            }
            : { query },
        ),
      }).then((r) => r.json()).then(onData)
        .catch(onError);
    },
  };
}

// deno-lint-ignore no-empty-interface
export interface DownloadTaskRunnerSupplier extends FetchTaskRunnerSupplier {
}

export const reportDownloadConsole = (
  destFile: string,
  srcEndpoint: string,
  mark: PerformanceMark,
) => {
  const measure = performance.measure(mark.name, {
    start: mark.startTime,
  });
  const info = Deno.statSync(destFile);
  console.log(
    `Downloaded ${destFile} (${
      human.humanFriendlyBytes(info.size)
    }) from ${srcEndpoint} (in ${measure.duration} ms)`,
  );
};

// deno-lint-ignore require-await
export async function downloadAsset(
  srcEndpoint: string,
  destFile: string,
  onData?: (
    destFile: string,
    srcEndpoint: string,
    mark: PerformanceMark,
  ) => void,
  onError?: (error: Error) => void,
): Promise<void> {
  const markName = `${srcEndpoint}::${destFile}`;
  const mark = performance.mark(markName);
  fetch(srcEndpoint).then(async (rsp) => {
    try {
      const rdr = rsp.body?.getReader();
      if (rdr) {
        const r = iosc.readerFromStreamReader(rdr);
        const f = await Deno.open(destFile, {
          create: true,
          write: true,
        });
        await iosc.copy(r, f);
        f.close();
        if (onData) onData(destFile, srcEndpoint, mark);
      }
    } catch (err) {
      if (onError) onError(err);
    }
  }).catch(onError);
}

export function downloadTask(
  identity: string,
  srcEndpoint: string,
  destFile: string,
  onData?: (
    destFile: string,
    srcEndpoint: string,
    mark: PerformanceMark,
  ) => void,
  onError?: (error: Error) => void,
): GraphQlTaskRunnerSupplier {
  return {
    identity,
    exec: async () => {
      if (!onError) {
        onError = (error) => {
          console.dir(error, { colors: true });
        };
      }

      await downloadAsset(
        srcEndpoint,
        destFile,
        onData || reportDownloadConsole,
        onError,
      );
    },
  };
}
