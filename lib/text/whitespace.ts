export function minWhitespaceIndent(text: string): number {
  const match = text.match(/^[ \t]*(?=\S)/gm);
  return match ? match.reduce((r, a) => Math.min(r, a.length), Infinity) : 0;
}

export function unindentWhitespace(
  text: string,
  removeInitialNewLine = true,
): string {
  const indent = minWhitespaceIndent(text);
  const regex = new RegExp(`^[ \\t]{${indent}}`, "gm");
  const result = text.replace(regex, "");
  return removeInitialNewLine ? result.replace(/^\n/, "") : result;
}

export function singleLineTrim(text: string): string {
  return text.replace(/(\r\n|\n|\r)/gm, "")
    .replace(/\s+(?=(?:[^\'"]*[\'"][^\'"]*[\'"])*[^\'"]*$)/g, " ")
    .trim();
}

