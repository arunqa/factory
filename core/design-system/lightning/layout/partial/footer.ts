import * as ldsGovn from "../../governance.ts";

export const footerFixedCopyrightBuildPartial: ldsGovn.LightningPartial =
  () => {
    // we hide the footer using display:none and then stickyFooter() in lightning.js will display it in the proper place
    return `<footer class="footer font-size-medium" style="position: absolute; bottom: 0; height: 60px; margin-top: 40px; width: 100%; display:none;">
    <div class="slds-container_x-large slds-container_center slds-p-left_small slds-p-right_small">      
      <article class="slds-text-align_center slds-p-top_small slds-p-bottom_large">
        <p class="slds-text-body_small">© 1997-<script>document.write(new Date().getFullYear())</script> Netspective Media LLC. All Rights Reserved.</p>
        <p class="slds-text-body_small">Built on ${new Date()}</p>        
      </article>
    </div>
  </footer>`;
  };
