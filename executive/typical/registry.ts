import * as fsg from "../../core/originate/file-sys-globs.ts";
import * as oTab from "../../core/originate/tabular.ts";
import * as p from "../typical/proxy.ts";

export class OriginatorsRegistry extends oTab.OriginatorTabularRecordsFactory
  implements p.ProxyablesOriginatorRegistry {
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
}
