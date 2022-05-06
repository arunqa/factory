import * as govn from "../../governance/mod.ts";
import * as fsg from "../../core/originate/file-sys-globs.ts";
import * as oTab from "../../core/originate/tabular.ts";
import * as p from "../typical/proxy.ts";

export class OriginatorsRegistry extends oTab.OriginatorTabularRecordsFactory
  implements p.ProxyablesOriginatorRegistry {
  // deno-lint-ignore no-explicit-any
  readonly refineries = new Set<govn.ResourceRefinery<any>>();
  readonly fsgotrFactory: fsg.FileSysGlobsOriginatorTabularRecordsFactory;
  readonly pfsmtrFactory:
    p.ProxyableFileSysModelOriginatorTabularRecordsFactory;
  readonly pfsdtrFactory:
    p.ProxyableFileSysDirectoryOriginatorTabularRecordsFactory;

  constructor(sqlViewsNamespace: string) {
    super(() => sqlViewsNamespace);
    this.fsgotrFactory = new fsg.FileSysGlobsOriginatorTabularRecordsFactory(
      this,
    );
    this.pfsmtrFactory = new p
      .ProxyableFileSysModelOriginatorTabularRecordsFactory(
      this,
      {
        enabled: !window.disableAllProxies,
        originator: "Proxyable File System Model",
        provenance: import.meta.url,
      },
    );
    this.pfsdtrFactory = new p
      .ProxyableFileSysDirectoryOriginatorTabularRecordsFactory(
      this,
      {
        enabled: !window.disableAllProxies,
        originator: "Proxyable File System Directory",
        provenance: import.meta.url,
      },
    );
  }

  originatorsCount() {
    return this.fsgotrFactory.fileSysGlobRB.records.length +
      this.pfsmtrFactory.proxyableFsModelRB.records.length +
      this.pfsdtrFactory.proxyableFsDirRB.records.length;
  }

  // deno-lint-ignore no-explicit-any
  registerRefinery(rr: govn.ResourceRefinery<any>) {
    this.refineries.add(rr);
  }
}
