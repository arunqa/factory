import * as govn from "./governance.ts";

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
