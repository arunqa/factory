import * as extn from "./extension.ts";

export interface LocationSupplier {
  readonly moduleImportMetaURL: string;
}

export interface ModuleResource {
  readonly imported: extn.ExtensionModule;
}
