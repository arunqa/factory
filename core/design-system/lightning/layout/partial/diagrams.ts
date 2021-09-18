import * as ldsGovn from "../../governance.ts";

const mermaid = "mermaid";
const isMermaidDiagrams = (diagrams: unknown) => {
  if (typeof diagrams === "string" && diagrams == mermaid) return true;
  if (Array.isArray(diagrams) && diagrams.find((name) => name == mermaid)) {
    return true;
  }
  return false;
};

/**
 * Place this in the <head> of your layouts to automatically include diagrams
 * generator code when layout.frontmatter.diagrams is true.
 * blank if not.
 * @param _ body is not used
 * @param layout the active layout strategy execution instance
 * @returns diagrams scripts for <head> component
 */
// deno-fmt-ignore (because we don't want ${...} wrapped)
export const mermaidDiagramsPartial: ldsGovn.LightningPartial = (_, layout) => 
(layout?.frontmatter?.diagrams && isMermaidDiagrams(layout.frontmatter.diagrams)) 
  ? `<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>\n<script>mermaid.initialize({startOnLoad:true});</script>`
  : '<!-- layout.frontmatter.diagrams is false -->';
