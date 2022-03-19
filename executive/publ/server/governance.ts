import * as fsg from "../../../core/originate/file-sys-globs.ts";
import { PublicationHomePathSupplier } from "../publication.ts";

export interface FactoryHomePathSupplier {
  (relative: string, abs?: boolean): fsg.FileSysPathText;
}

export interface ServerUserAgentContext {
  readonly project: {
    readonly publFsEntryPath: PublicationHomePathSupplier;
    readonly factoryFsEntryPath: FactoryHomePathSupplier;
  };
}
