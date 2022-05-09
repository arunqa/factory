import * as html from "../../../../render/html/governance.ts";
import * as ldsGovn from "../../governance.ts";
import * as git from "../../../../../lib/git/mod.ts";
import * as ws from "../../../../../lib/workspace/mod.ts";

const ugcEnvVarsPrefix = "MATRIX_";

export const ugcCommentsMatrix: ldsGovn.LightningPartial = (
  layout,
) => {
  const fm= layout?.frontmatter as any;
  const matrixServerNameEnvVar = `${ugcEnvVarsPrefix}SERVER_NAME`;
  const matrixServerName = Deno.env.get(matrixServerNameEnvVar);
  return `${matrixServerName && fm?.ugc?.comments ?
    `<div id="comment-section"></div>

    <script type="text/javascript" src="https://latest.cactus.chat/cactus.js"></script>
    <link rel="stylesheet" href="https://latest.cactus.chat/style.css" type="text/css">
    <script>
    const domainDetails = new URL(window.location.href);
    const pageUrlslug = domainDetails.pathname.replace(/\\//g, "-");
    console.log(pageUrlslug);
    const commentSectionId = pageUrlslug;
    initComments({
      node: document.getElementById("comment-section"),
      defaultHomeserverUrl: "${Deno.env.get(`${ugcEnvVarsPrefix}HOME_SERVER_URL`)}",
      serverName: "${matrixServerName}",
      siteName: "${Deno.env.get(`${ugcEnvVarsPrefix}SITE_NAME`)}",
      commentSectionId: commentSectionId,
    });
      document.addEventListener("DOMContentLoaded", function () {
        // code
        console.log("loaded");
        document.querySelector(".cactus-send-button").innerHTML = "Post";
        document.querySelector(".cactus-logout-button").style.display = "none";
      });
    </script>`: `No ${matrixServerNameEnvVar} is defined, declare it in .envrc`}`;
};
