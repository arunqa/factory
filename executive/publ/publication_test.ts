import { path } from "../../deps.ts";
// import { testingAsserts as ta } from "../deps-test.ts";
import * as mod from "./publication.ts";
import * as fsLink from "../../lib/fs/link.ts";
import * as git from "../../lib/git/mod.ts";
import * as ds from "../../core/render/html/mod.ts";
import * as lds from "../../core/design-system/lightning/mod.ts";

const testPath = path.relative(
  Deno.cwd(),
  path.dirname(import.meta.url).substr("file://".length),
);
const docsPath = path.join(testPath, "../../", "docs");
const prefs: mod.Preferences = {
  contentRootPath: path.join(docsPath, "content"),
  persistClientCargo: async (publishDest) => {
    await fsLink.symlinkDirectoryChildren(
      path.join(path.join(docsPath, "client-cargo")),
      path.join(publishDest),
      undefined,
      //fsLink.symlinkDirectoryChildrenConsoleReporters,
    );
  },
  destRootPath: path.join(docsPath, "public"),
  appName: "Publication Test",
  envVarNamesPrefix: "PUBCTL_",
  mGitResolvers: {
    ...git.typicalGitWorkTreeAssetUrlResolvers(),
    remoteCommit: (commit, paths) => ({
      commit,
      remoteURL: "??",
      paths,
    }),
    workTreeAsset: git.typicalGitWorkTreeAssetResolver,
  },
  routeGitRemoteResolver: (route, gitBranchOrTag, paths) => {
    return {
      assetPathRelToWorkTree: route.terminal?.qualifiedPath || "??",
      href: route.terminal?.qualifiedPath || "??",
      textContent: route.terminal?.qualifiedPath || "??",
      paths,
      gitBranchOrTag,
    };
  },
};

export class TestDesignSystem implements lds.LightningDesignSystemFactory {
  readonly designSystem: lds.LightingDesignSystem<lds.LightningLayout>;
  readonly contentAdapter: lds.LightingDesignSystemContentAdapter;

  constructor(config: mod.Configuration, routes: mod.PublicationRoutes) {
    this.designSystem = new lds.LightingDesignSystem();
    this.contentAdapter = {
      git: config.git,
      layoutText: new lds.LightingDesignSystemText(),
      navigation: new lds.LightingDesignSystemNavigation(
        true,
        routes.navigationTree,
      ),
      assets: this.designSystem.assets(),
      branding: {
        contextBarSubject: config.appName,
        contextBarSubjectImageSrc: (assets) =>
          assets.image("/asset/image/brand/logo-icon-100x100.png"),
      },
      mGitResolvers: config.mGitResolvers,
      routeGitRemoteResolver: config.routeGitRemoteResolver,
      renderedAt: new Date(),
    };
  }
}

const config = new mod.Configuration(prefs);
const executive = new mod.Executive([
  new class extends mod.TypicalPublication {
    constructDesignSystem(
      config: mod.Configuration,
      routes: mod.PublicationRoutes,
      // deno-lint-ignore no-explicit-any
    ): ds.DesignSystemFactory<any, any, any, any> {
      return new TestDesignSystem(config, routes);
    }
  }(config),
]);

Deno.test(`Publication discovered proper number of assets ${config.contentRootPath}`, async () => {
  await executive.execute();
  // TODO: help find async leaks in executive.execute()
  // console.dir(Deno.metrics());
  // let count = 0;
  // ta.assertEquals(count, 1);
});

Deno.test(`Publication persist proper number of assets from ${config.contentRootPath} to ${config.destRootPath}`, () => {
  // executive.publication.productsSync();
});
