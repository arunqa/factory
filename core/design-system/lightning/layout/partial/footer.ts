import * as ldsGovn from "../../governance.ts";

export const footerFixedCopyrightBuildPartial: ldsGovn.LightningPartial = (
  layout,
) => {
  // we hide the footer using display:none and then stickyFooter() in lightning.js will display it in the proper place
  // deno-fmt-ignore
  return `<footer class="footer font-size-medium" style="position: absolute; bottom: 0; height: 60px; margin-top: 40px; width: 100%; display:none;">
    <div class="slds-container_x-large slds-container_center slds-p-left_small slds-p-right_small">      
      <article class="slds-text-align_center slds-p-top_small slds-p-bottom_large">
        <p class="slds-text-body_small">© 1997-<script>document.write(new Date().getFullYear())</script> Netspective Media LLC. All Rights Reserved.</p>
        <p class="slds-text-body_small">Publication created <span is="time-ago" date="${layout.dsArgs.renderedAt}"/></p>
        <p class="slds-text-body_small">${layout.dsArgs.git ? ` 🌲 ${layout.dsArgs.git?.cached.currentBranch || "??"}` : "not in Git work tree"} 📄 Modified <span is="time-ago" date="${layout.activeRoute?.terminal?.lastModifiedAt}"/></p>
      </article>
    </div>
  </footer>`;
};
