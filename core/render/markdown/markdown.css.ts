import { base64 } from "../../deps.ts";

export const CSS = (className: string) => `
/* TODO: These styles were "borrowed" from GitLab and need to find out what copyrights need to be followed */

.${className} {
    color: #303030;
    word-wrap: break-word
}

.${className} [dir='auto'] {
    text-align: initial
}

.${className} *:first-child {
    margin-top: 0
}

.${className}>:last-child {
    margin-bottom: 0
}

.${className} p {
    color: #303030;
    margin: 0 0 16px
}

.${className} p>code {
    font-weight: inherit
}

.${className} p a:not(.no-attachment-icon) img {
    margin-bottom: 0
}

.${className} a {
    color: #1068bf
}

.${className} a>code {
    color: #1068bf
}

.${className} img:not(.emoji) {
    margin: 0 0 8px
}

.${className} img.lazy {
    min-width: 200px;
    min-height: 100px;
    background-color: #fdfdfd
}

.${className} img.js-lazy-loaded, .md img.emoji {
    min-width: inherit;
    min-height: inherit;
    background-color: inherit;
    max-width: 100%
}

.${className}:not(.md) img:not(.emoji) {
    border: 1px solid #f0f0f0;
    padding: 5px;
    margin: 5px 0;
    max-height: calc(100vh - 100px)
}

.${className} details {
    margin-bottom: 16px
}

.${className} code {
    font-family: "Menlo", "DejaVu Sans Mono", "Liberation Mono", "Consolas", "Ubuntu Mono", "Courier New", "andale mono", "lucida console", monospace;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: keep-all
}

.${className} h1 {
    font-size: 1.75em;
    font-weight: 600;
    margin: 24px 0 16px;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #eaeaea;
    color: #303030
}

.${className} h1:first-child {
    margin-top: 0
}

.${className} h2 {
    font-size: 1.5em;
    font-weight: 600;
    margin: 24px 0 16px;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #eaeaea;
    color: #303030
}

.${className} h3 {
    margin: 24px 0 16px;
    font-size: 1.3em
}

.${className} h4 {
    margin: 24px 0 16px;
    font-size: 1.2em
}

.${className} h5 {
    margin: 24px 0 16px;
    font-size: 1em
}

.${className} h6 {
    margin: 24px 0 16px;
    font-size: 0.95em
}

.${className} blockquote, .md .blockquote {
    color: #7f8fa4;
    font-size: inherit;
    padding: 8px 24px;
    margin: 16px 0;
    border-left: 3px solid #eaeaea
}

.${className} blockquote:dir(rtl), .md .blockquote:dir(rtl) {
    border-left: 0;
    border-right: 3px solid #eaeaea
}

.${className} blockquote p, .md .blockquote p {
    color: #7f8fa4 !important;
    font-size: inherit;
    line-height: 1.5
}

.${className} blockquote p:last-child, .md .blockquote p:last-child {
    margin: 0
}

.${className} hr {
    border-color: #e1e1e1;
    margin: 10px 0
}

.${className} table:not(.code) {
    margin: 16px 0;
    color: #303030;
    border: 0;
    width: auto;
    display: block;
    overflow-x: auto
}

.${className} table:not(.code) tbody {
    background-color: #fff
}

.${className} table:not(.code) tbody td {
    border-color: #dbdbdb
}

.${className} table:not(.code) tr th {
    border-bottom: solid 2px #bfbfbf
}

.${className} table:not(.code).grid-none>thead>tr>th {
    border-bottom-width: 0;
    border-right-width: 0;
    border-left-width: 0
}

.${className} table:not(.code).grid-none>thead>tr>th:first-child {
    border-left-width: 1px
}

.${className} table:not(.code).grid-none>thead>tr>th:last-child {
    border-right-width: 1px
}

.${className} table:not(.code).grid-none>tbody>tr>td {
    border-width: 0
}

.${className} table:not(.code).grid-none>tbody>tr>td:first-child {
    border-left-width: 1px
}

.${className} table:not(.code).grid-none>tbody>tr>td:last-child {
    border-right-width: 1px
}

.${className} table:not(.code).grid-none>tbody>tr:last-child>td {
    border-bottom-width: 1px
}

.${className} table:not(.code).grid-rows>thead>tr>th, .md table:not(.code).grid-rows>tbody>tr>td {
    border-right-width: 0;
    border-left-width: 0
}

.${className} table:not(.code).grid-rows>thead>tr>th:first-child {
    border-left-width: 1px
}

.${className} table:not(.code).grid-rows>thead>tr>th:last-child {
    border-right-width: 1px
}

.${className} table:not(.code).grid-rows>tbody>tr>td {
    border-left-width: 0;
    border-right-width: 0
}

.${className} table:not(.code).grid-rows>tbody>tr>td:first-child {
    border-left-width: 1px
}

.${className} table:not(.code).grid-rows>tbody>tr>td:last-child {
    border-right-width: 1px
}

.${className} table:not(.code).grid-cols>thead>tr>th {
    border-bottom-width: 0
}

.${className} table:not(.code).grid-cols>tbody>tr>td {
    border-top-width: 0;
    border-bottom-width: 0
}

.${className} table:not(.code).grid-cols>tbody>tr:last-child>td {
    border-bottom-width: 1px
}

.${className} table:not(.code).frame-sides>thead>tr>th {
    border-top-width: 0
}

.${className} table:not(.code).frame-sides>tbody>tr:last-child>td {
    border-bottom-width: 0
}

.${className} table:not(.code).frame-topbot>thead>tr>th:first-child, .md table:not(.code).frame-topbot>tbody>tr>td:first-child, .md table:not(.code).frame-ends>thead>tr>th:first-child, .md table:not(.code).frame-ends>tbody>tr>td:first-child {
    border-left-width: 0
}

.${className} table:not(.code).frame-topbot>thead>tr>th:last-child, .md table:not(.code).frame-topbot>tbody>tr>td:last-child, .md table:not(.code).frame-ends>thead>tr>th:last-child, .md table:not(.code).frame-ends>tbody>tr>td:last-child {
    border-right-width: 0
}

.${className} table:not(.code).frame-none>thead>tr>th {
    border-top-width: 0
}

.${className} table:not(.code).frame-none>tbody>tr:last-child>td {
    border-bottom-width: 0
}

.${className} table:not(.code).frame-none>thead>tr>th:first-child, .md table:not(.code).frame-none>tbody>tr>td:first-child {
    border-left-width: 0
}

.${className} table:not(.code).frame-none>thead>tr>th:last-child, .md table:not(.code).frame-none>tbody>tr>td:last-child {
    border-right-width: 0
}

.${className} table:not(.code).stripes-all tr, .md table:not(.code).stripes-odd tr:nth-of-type(odd), .md table:not(.code).stripes-even tr:nth-of-type(even), .md table:not(.code).stripes-hover tr:hover {
    background: #fafafa
}

.${className} table:dir(rtl) th {
    text-align: right
}

.${className} pre {
    margin-bottom: 16px;
    font-size: 13px;
    line-height: 1.6em;
    overflow-x: auto;
    border-radius: 2px
}

.${className} pre code {
    white-space: pre;
    word-wrap: normal;
    overflow-wrap: normal
}

.${className} pre.plain-readme {
    background: none;
    border: 0;
    padding: 0;
    margin: 0;
    font-size: 14px
}

.${className} dd {
    margin-left: 16px
}

.${className} ul, .md ol {
    padding: 0;
    margin: 0 0 16px
}

.${className} ul ul, .md ul ol, .md ol ul, .md ol ol {
    margin-bottom: 0
}

.${className} ul:dir(rtl), .md ol:dir(rtl) {
    margin: 3px 28px 3px 0 !important
}

.${className}>ul {
    list-style-type: disc
}

.${className}>ul ul {
    list-style-type: circle
}

.${className}>ul ul ul {
    list-style-type: square
}

.${className} ul.checklist, .md ul.none, .md ol.none, .md ul.no-bullet, .md ol.no-bullet, .md ol.unnumbered, .md ul.unstyled, .md ol.unstyled {
    list-style-type: none
}

.${className} ul.checklist li, .md ul.none li, .md ol.none li, .md ul.no-bullet li, .md ol.no-bullet li, .md ol.unnumbered li, .md ul.unstyled li, .md ol.unstyled li {
    margin-left: 0
}

.${className} li {
    line-height: 1.6em;
    margin-left: 25px;
    padding-left: 3px
}

@media screen and (-webkit-min-device-pixel-ratio: 0) {
    .md li {
        margin-left: 28px;
        padding-left: 0
    }
}

.${className} ul.task-list>li.task-list-item {
    list-style-type: none;
    position: relative;
    min-height: 22px;
    padding-left: 28px;
    margin-left: 0 !important
}

.${className} ul.task-list>li.task-list-item>input.task-list-item-checkbox {
    position: absolute;
    left: 8px;
    top: 5px
}

.${className} a.with-attachment-icon::before, .md a[href*='/uploads/']::before, .md a[href*='storage.googleapis.com/google-code-attachments/']::before {
    margin-right: 4px;
    font-style: normal;
    font-size: inherit;
    text-rendering: auto;
    -webkit-font-smoothing: antialiased;
    content: '📎'
}

.${className} a[href*='/uploads/'].no-attachment-icon::before, .md a[href*='storage.googleapis.com/google-code-attachments/'].no-attachment-icon::before {
    display: none
}

.${className} h1 a.anchor, .md h2 a.anchor, .md h3 a.anchor, .md h4 a.anchor, .md h5 a.anchor, .md h6 a.anchor {
    float: left;
    margin-left: -20px;
    text-decoration: none;
    outline: none
}

.${className} h1 a.anchor::after, .md h2 a.anchor::after, .md h3 a.anchor::after, .md h4 a.anchor::after, .md h5 a.anchor::after, .md h6 a.anchor::after {
    content: url(./icon_anchor-297aa9b0225eff3d6d0da74ce042a0ed5575b92aa66b7109a5e060a795b42e36.svg);
    visibility: hidden
}

.${className} h1:hover>a.anchor::after, .md h2:hover>a.anchor::after, .md h3:hover>a.anchor::after, .md h4:hover>a.anchor::after, .md h5:hover>a.anchor::after, .md h6:hover>a.anchor::after {
    visibility: visible
}

.${className} h1>a.anchor:focus::after, .md h2>a.anchor:focus::after, .md h3>a.anchor:focus::after, .md h4>a.anchor:focus::after, .md h5>a.anchor:focus::after, .md h6>a.anchor:focus::after {
    visibility: visible;
    outline: auto
}

.${className} .big {
    font-size: larger
}

.${className} .small {
    font-size: smaller
}

.${className} .underline {
    text-decoration: underline
}

.${className} .overline {
    text-decoration: overline
}

.${className} .line-through {
    text-decoration: line-through
}

.${className} .fa {
    display: inline-block;
    font-style: normal;
    font-size: 14px;
    text-rendering: auto;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale
}

.${className} .fa-2x, .md .admonitionblock td.icon [class^='fa icon-'] {
    font-size: 2em
}

.${className} .fa-exclamation-triangle::before, .md .admonitionblock td.icon .icon-warning::before {
    content: '⚠'
}

.${className} .fa-exclamation-circle::before, .md .admonitionblock td.icon .icon-important::before {
    content: '❗'
}

.${className} .fa-lightbulb-o::before, .md .admonitionblock td.icon .icon-tip::before {
    content: '💡'
}

.${className} .fa-thumb-tack::before, .md .admonitionblock td.icon .icon-note::before {
    content: '📌'
}

.${className} .fa-fire::before, .md .admonitionblock td.icon .icon-caution::before {
    content: '🔥'
}

.${className} .fa-square-o::before {
    content: '\\2610'
}

.${className} .fa-check-square-o::before {
    content: '\\2611'
}

.${className} .admonitionblock td.icon {
    width: 1%
}

.${className} .metrics-embed h3.popover-header {
    margin: 0;
    font-size: 12px
}

.${className} .metrics-embed ul.dropdown-menu {
    margin-top: 4px;
    margin-bottom: 24px;
    padding: 8px 0
}

.${className} .metrics-embed ul.dropdown-menu li {
    margin: 0;
    padding: 0 1px
}

.${className} .text-left {
    text-align: left !important
}

.${className} .text-right {
    text-align: right !important
}

.${className} .text-center {
    text-align: center !important
}

.${className} .text-justify {
    text-align: justify !important
}

.${className} section.footnotes ol {
  list-style: none;
  counter-reset: item;
}

.${className} section.footnotes ol li {
  counter-increment: item;
  margin-bottom: 5px;
}

.${className} section.footnotes ol li p:before {
    margin-right: 10px;
    content: counter(item);
    background: #dddbda;
    border-radius: 100%;
    color: #969492;
    padding-left: 0.5em;
    padding-right: 0.5em;
    text-align: center;
    display: inline-block;
}

.${className} section.footnotes :target {
    background: yellow;
}
`;

export const dataURI = (css: string) => {
  return `data:text/css;base64,${base64.encode(css)}`;
};

export const styleTag = (className: string) => {
  // deno-fmt-ignore
  return `
    <!-- styles for .${className} are in the data URI generated from ${import.meta.url} -->
    <style>@import url("${dataURI(CSS(className))}");</style>`;
};

export default styleTag;
