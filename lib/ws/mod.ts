import { path } from "./deps.ts";

export type WorkspaceEditorIdentity = string;
export type EditableSourceFilePathAndName = string;
export type EditableSourceURI = string;
export type EditableTargetURI = string;

export interface WorkspaceEditorTarget {
  readonly identity: WorkspaceEditorIdentity;
  readonly editableTargetURI: EditableTargetURI;
  readonly openInWorkspaceHTML?: (classes?: string) => string;
}

export interface WorkspaceEditorTargetResolver<
  Target extends WorkspaceEditorTarget,
> {
  (
    src: EditableSourceFilePathAndName | EditableSourceURI,
    line?: number,
  ): Target | undefined;
}

export function envWorkspaceEditorResolver(
  prime: string,
): WorkspaceEditorTargetResolver<WorkspaceEditorTarget> {
  const type = Deno.env.get(prime);
  if (type) {
    switch(type){
      case "vscode":
      case "vscode-wsl":
        return vscodeWslRemoteEditorResolver(
          Deno.env.get(`${prime}_VSCODE_REMOTE_DISTRO`) || "Debian",
        );
      case "vscode-linux":
          return vscodeLinuxRemoteEditorResolver();
      case "vscode-mac":
          return vscodeMacRemoteEditorResolver();
    }
  }
  return () => undefined;
}

export interface VsCodeWorkspaceEditorTarget extends WorkspaceEditorTarget {
  readonly wslDistroName: string;
}

export function vscodeWslRemoteEditorResolver(
  wslDistroName: string,
): WorkspaceEditorTargetResolver<VsCodeWorkspaceEditorTarget> {
  return (src, line) => {
    if (src.startsWith("file:")) {
      src = path.fromFileUrl(src);
    }
    if (!src.startsWith("/")) src = `/${src}`;
    const editableTargetURI =
      `vscode://vscode-remote/wsl+${wslDistroName}${src}:${line || 1}`;
    return {
      identity: "vscode",
      wslDistroName,
      editableTargetURI,
      // deno-fmt-ignore
      openInWorkspaceHTML: (classes) =>`<a href="${editableTargetURI}" ${classes ? ` class="${classes}"` : ""} title="${editableTargetURI}">Open in VS Code</a>`,
    };
  };
}

export function vscodeLinuxRemoteEditorResolver(
  ): WorkspaceEditorTargetResolver<WorkspaceEditorTarget> {
  return (src, line) => {
    if (src.startsWith("file:")) {
      src = path.fromFileUrl(src);
    }
    if (!src.startsWith("/")) src = `/${src}`;
    const editableTargetURI =
      `vscode://file${src}:${line || 1}`;
    return {
      identity: "vscode-linux",
      editableTargetURI,
      // deno-fmt-ignore
      openInWorkspaceHTML: (classes) =>`<a href="${editableTargetURI}" ${classes ? ` class="${classes}"` : ""} title="${editableTargetURI}">Open in VS Code</a>`,
    };
  };
}

export function vscodeMacRemoteEditorResolver(
  ): WorkspaceEditorTargetResolver<WorkspaceEditorTarget> {
  return (src, line) => {
    if (src.startsWith("file:")) {
      src = path.fromFileUrl(src);
    }
    if (!src.startsWith("/")) src = `/${src}`;
    const editableTargetURI =
      `vscode://file${src}:${line || 1}`;
    return {
      identity: "vscode-mac",
      editableTargetURI,
      // deno-fmt-ignore
      openInWorkspaceHTML: (classes) =>`<a href="${editableTargetURI}" ${classes ? ` class="${classes}"` : ""} title="${editableTargetURI}">Open in VS Code</a>`,
    };
  };
}