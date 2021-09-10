import { colors, safety } from "../../deps.ts";
import { pg, pgQuery as pgq } from "./deps.ts";
import * as stdCache from "../../core/std/cache.ts";
import * as redisCache from "./cache.ts";

declare global {
  interface Window {
    globalSqlResultsCache: ResultsCache;
    globalSqlResultsCacheHealth: stdCache.CacheHealth;
    globalSqlDbConns: Map<string, DatabaseConnection>;
    postgresSqlDbConnSpecValidity: (
      name: string,
      envVarNamesPrefix?: string,
    ) => EnvVarsDatabaseConnectionOptionsValidationResult;
    acquirePostgresSqlDbConn: (
      name: string,
      envVarNamesPrefix?: string,
    ) => DatabaseConnection;
  }
}

export async function configureSqlGlobals() {
  if (!window.globalSqlResultsCache) {
    const [dbResultsCache, dbResultsCacheHealth] = await redisCache.redisCache<
      SqlResultSupplier<unknown>
    >({
      onSuccess: (_init, report) => {
        console.info(
          colors.yellow(
            // deno-fmt-ignore
            `Redis server ${colors.green(report.hostname)}${colors.gray(":" + String(report.port))} integrated`,
          ),
        );
      },
    });
    if (!window.globalSqlDbConns) {
      window.globalSqlDbConns = new Map<string, DatabaseConnection>();
    }

    window.globalSqlResultsCache = dbResultsCache;
    window.globalSqlResultsCacheHealth = dbResultsCacheHealth;
  }
}

export async function preparePostgreSqlGlobals() {
  await configureSqlGlobals();

  window.postgresSqlDbConnSpecValidity = (identity, envVarNamesPrefix) => {
    return isPostgreSqlConnectionEnvOptionsValid(
      envPostgreSqlConnectionOptions(identity, envVarNamesPrefix),
    );
  };

  window.acquirePostgresSqlDbConn = (identity, envVarNamesPrefix) => {
    let conn = window.globalSqlDbConns.get(identity);
    if (!conn) {
      conn = new TypicalDatabaseConnection({
        ...envPostgreSqlConnectionOptions(identity, envVarNamesPrefix),
        resultsCache: window.globalSqlResultsCache,
      });
      window.globalSqlDbConns.set(identity, conn);
    }
    return conn;
  };
}

// deno-lint-ignore require-await
export async function destroyPostgreSqlGlobals() {
  for (const dbConn of window.globalSqlDbConns.values()) {
    dbConn.close();
  }
}

export type ResultCacheKey = string;

export type SQL = string;

export interface SqlSupplier {
  readonly SQL: SQL;
}

export interface SqlResultSupplier<T> extends SqlSupplier {
  readonly result: pgq.QueryObjectResult<T>;
}

export interface CacheableResult {
  readonly cacheKey: ResultCacheKey;
}

export interface ResultTransformer<T> {
  (srs: SqlResultSupplier<T>): SqlResultSupplier<T>;
}

export interface TransformableResult<T> {
  readonly transform: ResultTransformer<T>;
}

export const isSqlSupplier = safety.typeGuard<SqlSupplier>("SQL");

export const isCacheableResult = safety.typeGuard<CacheableResult>(
  "cacheKey",
);

export function isTransformableResult<T>(
  o: unknown,
): o is TransformableResult<T> {
  const isTR = safety.typeGuard<TransformableResult<T>>("transform");
  return isTR(o);
}

export type ResultsCache = stdCache.TextKeyCache<SqlResultSupplier<unknown>>;

export interface DatabaseConnectionOptions extends pg.ClientOptions {
  readonly identity: string;
  readonly dbConnPoolCount: number;
  readonly connAcquisitionSource: string;
}

export interface EnvVarsDatabaseConnectionOptions
  extends DatabaseConnectionOptions {
  readonly envVarNamesPrefix: string;
}

export function envPostgreSqlConnectionOptions(
  identity: string,
  envVarNamesPrefix = "",
): EnvVarsDatabaseConnectionOptions {
  const dbHostFromEnv = Deno.env.get(`${envVarNamesPrefix}PGHOST`);
  const dbHostOrAddr = dbHostFromEnv
    ? dbHostFromEnv
    : (Deno.env.get(`${envVarNamesPrefix}PGHOSTADDR`));
  const dbConnPoolCountFromEnv = Deno.env.get(
    `${envVarNamesPrefix}PGCONNPOOL_COUNT`,
  );
  return {
    identity,
    envVarNamesPrefix,
    database: Deno.env.get(`${envVarNamesPrefix}PGDATABASE`),
    hostname: dbHostOrAddr,
    port: Deno.env.get(`${envVarNamesPrefix}PGPORT`),
    user: Deno.env.get(`${envVarNamesPrefix}PGUSER`),
    password: Deno.env.get(`${envVarNamesPrefix}PGPASSWORD`),
    applicationName: Deno.env.get(`${envVarNamesPrefix}PGAPPNAME`),
    tls: {
      enforce: Deno.env.get(`${envVarNamesPrefix}PGSSLMODE`) == "require"
        ? true
        : false,
    },
    dbConnPoolCount: dbConnPoolCountFromEnv
      ? Number.parseInt(dbConnPoolCountFromEnv)
      : 20,
    connAcquisitionSource:
      `environment variables (prefix = "${envVarNamesPrefix}")`,
  };
}

export interface EnvVarsDatabaseConnectionOptionsValidationResult {
  readonly isValid: boolean;
  readonly connOptions: EnvVarsDatabaseConnectionOptions;
  readonly envVarsMissing: string[];
}

export function isPostgreSqlConnectionEnvOptionsValid(
  connOptions: EnvVarsDatabaseConnectionOptions,
): EnvVarsDatabaseConnectionOptionsValidationResult {
  const envVarsMissing = [{
    value: connOptions.database,
    varName: `${connOptions.envVarNamesPrefix}PGDATABASE`,
  }, {
    value: connOptions.hostname,
    varName:
      `${connOptions.envVarNamesPrefix}PGHOST | ${connOptions.envVarNamesPrefix}PGHOSTADDR`,
  }, {
    value: connOptions.port,
    varName: `${connOptions.envVarNamesPrefix}PGPORT`,
  }, {
    value: connOptions.user,
    varName: `${connOptions.envVarNamesPrefix}PGUSER`,
  }, {
    value: connOptions.password,
    varName: `${connOptions.envVarNamesPrefix}PGPASSWORD`,
  }].filter((spec) => spec.value ? false : true).map((spec) => spec.varName);
  return {
    isValid: envVarsMissing.length == 0,
    connOptions,
    envVarsMissing,
  };
}

export type DatabaseQuery<T> =
  | string
  | SqlSupplier
  | (SqlSupplier & CacheableResult)
  | (SqlSupplier & CacheableResult & TransformableResult<T>);

export interface DatabaseConnection {
  readonly identity: string;
  readonly dbConnPool: pg.Pool;
  readonly queryResult: <T>(
    ss: DatabaseQuery<T>,
  ) => Promise<SqlResultSupplier<T>>;
  readonly queryResultSingleRecord: <T>(
    ss: DatabaseQuery<T>,
    options?: {
      onRecordNotFound?: (ss: DatabaseQuery<T>) => T | undefined;
      onTooManyRecords?: (srs: SqlResultSupplier<T>) => T | undefined;
    },
  ) => Promise<T | undefined>;
  readonly close: () => void;
}

export class TypicalDatabaseConnection implements DatabaseConnection {
  readonly identity: string;
  readonly dbConnPool: pg.Pool;
  readonly resultsCache: ResultsCache;
  readonly dbName?: string;
  readonly dbUserName?: string;
  readonly connAcquisitionSource: string;

  constructor(
    options: DatabaseConnectionOptions & {
      resultsCache: ResultsCache;
    },
  ) {
    this.identity = options?.identity;
    this.dbConnPool = new pg.Pool(
      options,
      options.dbConnPoolCount,
      true, /* use lazy, not eager, connections */
    );
    this.resultsCache = options.resultsCache;
    this.dbName = options.database;
    this.dbUserName = options.user;
    this.connAcquisitionSource = options.connAcquisitionSource;
  }

  async close() {
    await this.dbConnPool.end();
  }

  async queryResult<T>(
    ssArg: DatabaseQuery<T>,
  ): Promise<SqlResultSupplier<T>> {
    const ss = (typeof ssArg === "string") ? { SQL: ssArg } : ssArg;
    const cacheKey = isCacheableResult(ss) ? ss.cacheKey : undefined;
    if (cacheKey) {
      // we await this in case resultsCache is redis or remote
      const result = this.resultsCache[cacheKey];
      if (result) {
        return result as SqlResultSupplier<T>;
      }
    }

    const client = await this.dbConnPool.connect();
    const queryResult = await client.queryObject<T>(ss.SQL);
    client.release();
    let fnResult: SqlResultSupplier<T> = {
      ...ss,
      result: queryResult,
    };
    if (isTransformableResult<T>(ss)) {
      fnResult = ss.transform(fnResult);
    }
    if (cacheKey) {
      this.resultsCache[cacheKey] = fnResult;
    }
    return fnResult;
  }

  async queryResultSingleRecord<T>(
    ss: DatabaseQuery<T>,
    options?: {
      onRecordNotFound?: (ss: DatabaseQuery<T>) => T | undefined;
      onTooManyRecords?: (srs: SqlResultSupplier<T>) => T | undefined;
    },
  ): Promise<T | undefined> {
    const qr = await this.queryResult(ss);
    if (qr.result.rowCount) {
      if (qr.result.rowCount == 1) return qr.result.rows[0];
      if (options?.onTooManyRecords) {
        return options?.onTooManyRecords(qr);
      }
    }
    if (options?.onRecordNotFound) {
      return options?.onRecordNotFound(qr);
    }
    return undefined;
  }
}
