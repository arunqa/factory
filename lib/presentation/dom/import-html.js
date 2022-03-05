/**
 * importHtmlContent fetches HTML from a source, adopts selected nodes, and injects into the current document
 * @param {string | URL | Request} input URL to acquire HTML from
 * @param {(foreignDoc) => []} select use the parsed HTML foreignDoc to select which nodes you want to acquire
 * @param {(importedNode, input, html) => void} inject the given, already document-adopted node anywhere you'd like
 */
export function importHtmlContent(input, select, inject) {
    fetch(input).then(resp => {
        resp.text().then(html => {
            const parser = new DOMParser();
            const foreignDoc = parser.parseFromString(html, "text/html");
            const selected = select(foreignDoc);
            if (Array.isArray(selected)) {
                for (const s of selected) {
                    const importedNode = document.adoptNode(s);
                    inject(importedNode, input, html);
                }
            } else if (selected) {
                const importedNode = document.adoptNode(selected);
                inject(importedNode, input, html);
            }
        });
    });
}
