import { humanPath } from "../../../../../lib/text/human.ts";
import { LocationSupplier } from "../../../../../lib/module/mod.ts";

export function getUrlQueryParameterByName(
  name: string,
  url = window.location.href,
) {
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

export const editableFileRedirectURL = (absPath: string) => {
  let src = absPath;
  if (src.startsWith("file://")) {
    src = src.substring(7);
    return [`/workspace/editor-redirect/abs${src}`, src];
  } else {
    if (absPath.startsWith("/")) {
      return [`/workspace/editor-redirect/abs${absPath}`, absPath];
    } else {
      return [src, src];
    }
  }
};

export const editableFileRefHTML = (
  absPath: string,
  humanizeLength?: number,
) => {
  const [href, label] = editableFileRedirectURL(absPath);
  return humanizeLength
    ? humanPath(
      label,
      humanizeLength,
      (basename) =>
        `<a href="${href}" class="fw-bold" title="${absPath}">${basename}</a>`,
    )
    : `<a href="${href}">${label}</a>`;
};

export const locationEditorRedirectURL = (location: LocationSupplier) =>
  editableFileRedirectURL(location.moduleImportMetaURL);

export const locationEditorHTML = (
  location: LocationSupplier,
  humanizeLength?: number,
) => {
  const [href, label] = locationEditorRedirectURL(location);
  return humanizeLength
    ? humanPath(
      label,
      humanizeLength,
      (basename) =>
        `<a href="${href}" class="fw-bold" title="${location.moduleImportMetaURL}">${basename}</a>`,
    )
    : `<a href="${href}">${label}</a>`;
};
