import * as html from "../../../../render/html/governance.ts";
import * as ldsGovn from "../../governance.ts";
import * as git from "../../../../../lib/git/mod.ts";

export const footerFixedCopyrightBuildPartial: ldsGovn.LightningPartial = (
  layout,
) => {
  let gitBranch: string | undefined;
  let remoteAsset: html.GitRemoteAnchor | undefined;
  let remoteCommit:
    | git.GitRemoteCommit<"hash" | "authorName" | "subject">
    | undefined;
  if (layout.dsArgs.git) {
    const cached = layout.dsArgs.git.cached;
    gitBranch = cached.currentBranch || "??";
    remoteCommit = cached.mostRecentCommit
      ? layout.dsArgs.mGitResolvers.remoteCommit(
        cached.mostRecentCommit,
        layout.dsArgs.git,
      )
      : undefined;
    remoteAsset = layout.activeRoute
      ? layout.dsArgs.routeGitRemoteResolver(
        layout.activeRoute,
        gitBranch,
        layout.dsArgs.git,
      )
      : undefined;
  }
  // we hide the footer using display:none and then stickyFooter() in lightning-tail.js will display it in the proper place
  // deno-fmt-ignore
  return `<footer class="footer font-size-medium" style="position: absolute; bottom: 0; height: 60px; margin-top: 40px; width: 100%; display:none;">
    <div class="slds-container_x-large slds-container_center slds-p-left_small slds-p-right_small">      
      <article class="slds-text-align_center slds-p-top_small slds-p-bottom_large">
        <p class="slds-text-body_small">© 1997-<script>document.write(new Date().getFullYear())</script> Netspective Media LLC. All Rights Reserved.</p>        
        <p class="slds-text-body_small">
          Publication created <span is="time-ago" date="${layout.dsArgs.renderedAt}"/>
          ${remoteCommit ? ` (triggered by <a href="${remoteCommit.remoteURL}" class="git-remote-commit" title="${remoteCommit.commit.subject}">${remoteCommit.commit.authorName}</a>)` : ''}
        </p>
        <p class="slds-text-body_small">
        ${remoteAsset 
          ? `📄 <a href="${remoteAsset.href}" title="${remoteAsset.assetPathRelToWorkTree}" class="git-remote-object">${remoteAsset.textContent}</a>`
          : `<!-- no git remote -->`}
        ${layout.activeRoute?.terminal?.lastModifiedAt 
          ? `modified <span is="time-ago" date="${layout.activeRoute?.terminal?.lastModifiedAt}" title="${layout.activeRoute?.terminal?.lastModifiedAt}"/>`
          : '<!-- no layout.activeRoute?.terminal?.lastModifiedAt -->'}
        ${layout.dsArgs.git ? ` 🌲 ${gitBranch}` : "<!-- not in Git work tree -->"}
        </p>
      </article>
    </div>
  </footer>`;
};
