import { humanPath } from "../../../../../lib/text/human.ts";
import { LocationSupplier } from "../../../../../governance/module.ts";

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
