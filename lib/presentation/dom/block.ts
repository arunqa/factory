// loosely follows https://blockprotocol.org/ but as that protocol gets better
// defined, we'll align to it more closely

// deno-lint-ignore no-explicit-any
export interface ModuleSupplier<Module = any> {
  readonly import: (
    dependency: string,
    actuate?: (acquired: unknown) => Promise<Module>,
  ) => Promise<Module>;
}

export function esmModuleSupplier<Module>(): ModuleSupplier<Module> {
  return {
    import: async (dependency, actuate) => {
      const module = await import(dependency);
      return actuate ? actuate(module) : module;
    },
  };
}

export interface PresentationBlock<Presentation, Dependencies> {
  readonly moduleSupplier?: ModuleSupplier;
  readonly init: () => Promise<PresentationBlock<Presentation, Dependencies>>;
}

// deno-lint-ignore no-empty-interface
export interface PresentationBlockSchema {
}

export interface BadgenBadgeContent extends PresentationBlockSchema {
  // API: https://github.com/badgen/badgen#in-browser
  readonly label?: string;
  readonly labelColor?: string; // <Color RGB> or <Color Name> (default: '555')
  readonly status: string; // <Text>, required
  readonly color?: string; // <Color RGB> or <Color Name> (default: 'blue')
  readonly style?: "classic" | "flat"; // 'flat' or 'classic' (default: 'classic')
  readonly icon?: string; // Use icon (default: undefined), best to use 'data:image/svg+xml;base64,...'
  readonly iconWidth?: number; // Set this if icon is not square (default: 13)
  readonly scale?: number; // Set badge scale (default: 1)

  // beyond badgen, our custom properties
  readonly title?: string;
  readonly action?: string;
}

// deno-lint-ignore no-explicit-any
export interface BadgenBlock extends PresentationBlock<any, any> {
  readonly moduleSupplier: ModuleSupplier;
  readonly autoHTML: (content: BadgenBadgeContent) => string;
  readonly remoteBaseURL?: string;
  readonly remoteURL: (content: BadgenBadgeContent) => string;
  readonly remoteImageURL: (content: BadgenBadgeContent) => string;
  readonly decorateHTML: (html: string, content: BadgenBadgeContent) => string;
  readonly isUsingRemote: () => boolean;
}

export interface BadgenBlockInit {
  readonly remoteBaseURL?: string;
  readonly moduleSupplier?: ModuleSupplier<unknown>;
  readonly tryBadgenLib?: boolean;
}

declare global {
  interface Window {
    badgen?: (content: BadgenBadgeContent) => string;
  }
}

export interface BadgenBlockState {
  isBadgenLibLoadAttempted: boolean;
  isBadgenLibLoaded: boolean;
}

export function badgenBlock(init: BadgenBlockInit = {}): BadgenBlock {
  const {
    remoteBaseURL = "https://badgen.net/badge",
    moduleSupplier = esmModuleSupplier(),
    tryBadgenLib = true,
  } = init;

  const state: BadgenBlockState = {
    isBadgenLibLoadAttempted: false,
    isBadgenLibLoaded: false,
  };
  const block: BadgenBlock = {
    moduleSupplier,
    remoteBaseURL,
    autoHTML: (content) => {
      if (state.isBadgenLibLoaded) {
        if (window.badgen) {
          return block.decorateHTML(window.badgen(content), content);
        }
        console.warn(
          `[badgenBlock] isBadgenLibLoaded is true but window.badgen not found, resorting to ${remoteBaseURL}`,
        );
      }
      // use the external badge API temporarily while the badgen script is being loaded
      // while this is the primary update(), this.#isBadgenLibLoaded should remain false
      return block.remoteImageURL(content);
    },
    init: async () => {
      if (tryBadgenLib && !state.isBadgenLibLoadAttempted) {
        // load the badgen script so that if it's needed later it will be faster than making network calls
        // deno-lint-ignore require-await
        await moduleSupplier.import("https://unpkg.com/badgen", async () => {
          state.isBadgenLibLoaded = true;
        });
        state.isBadgenLibLoadAttempted = true;
      }
      return block; // for chaining
    },
    remoteURL: (content) =>
      `${block.remoteBaseURL}/${content.label}/${content.status}/${content.color}`,
    remoteImageURL: (content) =>
      block.decorateHTML(`<img src="${block.remoteURL(content)}">`, content),
    decorateHTML: (html, content) => {
      if (content.title) {
        html = `<span title="${content.title}">${html}</span>`;
      }
      if (content.action) {
        html = `<a onclick="${content.action}">${html}</a>`;
      }
      return html;
    },
    isUsingRemote: () =>
      state.isBadgenLibLoaded && window.badgen ? false : true,
  };
  return block;
}

// deno-lint-ignore no-empty-interface
export interface BadgenLiveBadgeContent extends BadgenBadgeContent {
}

// deno-lint-ignore no-explicit-any
export interface BadgenLiveBlock extends PresentationBlock<any, any> {
  readonly content: (
    set?: BadgenLiveBadgeContent,
    display?: boolean,
  ) => BadgenLiveBadgeContent;
  readonly display: (state: boolean) => void;
}

export interface BadgenLiveBlockInit {
  readonly badgenBlockSupplier: (
    lbInit: BadgenLiveBlockInit,
  ) => Promise<BadgenBlock>;
  // deno-lint-ignore no-explicit-any
  readonly badgeElementSupplier: (lbInit: BadgenLiveBlockInit) => any;
  readonly init?: (block: BadgenLiveBlock) => Promise<BadgenLiveBlock>;
  readonly renderBadgeContentEventName?: string;
}

export function badgenLiveBlock(lbInit: BadgenLiveBlockInit): BadgenLiveBlock {
  const {
    badgenBlockSupplier,
    badgeElementSupplier,
    init,
    renderBadgeContentEventName = "render-badge-content",
  } = lbInit;

  const badgeElement = badgeElementSupplier(lbInit);
  // deno-lint-ignore no-explicit-any
  badgeElement.addEventListener(renderBadgeContentEventName, (event: any) => {
    const { badgenBlock = badgeElement.badgenBlock, content, display } =
      event.detail;
    if (badgenBlock) {
      badgeElement.innerHTML = badgenBlock.autoHTML(content);
    } else {
      // console.warn(`[badgenLiveBlock] badgenBlock not available yet.`);
    }
    if (display) block.display(display);
  });

  let content: BadgenLiveBadgeContent = { status: "Unspecified" };
  const block: BadgenLiveBlock = {
    init: async () => {
      badgeElement.badgenBlock = await badgenBlockSupplier(lbInit);
      return init ? await init?.(block) : block;
    },
    content: (set, display) => {
      if (set) {
        content = set;
        if (badgeElement) {
          badgeElement.dispatchEvent(
            new CustomEvent(renderBadgeContentEventName, {
              detail: { content, display },
            }),
          );
        } else {
          console.warn(
            `[badgenLiveBlock] content could not be updated: badgeElement was not found.`,
          );
        }
      }
      console.log("[badgenLiveBlock] content", set, content);
      return content;
    },
    display: (state) => {
      if (badgeElement) {
        badgeElement.style.display = state ? "block" : "none";
      }
    },
  };
  return block;
}
