import * as html from "../../../../render/html/governance.ts";
import * as ldsGovn from "../../governance.ts";
import * as git from "../../../../../lib/git/mod.ts";
import * as ws from "../../../../../lib/workspace/mod.ts";

export const ugcCommentsMatrix: ldsGovn.LightningPartial = (
  layout,
) => {
  const fm= layout?.frontmatter as any;
  return `${fm?.ugc?.comments ?
    `<div id="comment-section"></div>

    <script type="text/javascript" src="https://latest.cactus.chat/cactus.js"></script>
    <link rel="stylesheet" href="https://latest.cactus.chat/style.css" type="text/css">
    <script src="/lightning/script/cactus-comments.js"></script>
    <script>
      document.addEventListener("DOMContentLoaded", function () {
        // code
        console.log("loaded");
        document.querySelector(".cactus-send-button").innerHTML = "Post";
        document.querySelector(".cactus-logout-button").style.display = "none";
      });
    </script>`: ""}`;
};
