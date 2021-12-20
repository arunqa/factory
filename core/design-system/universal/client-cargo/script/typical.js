"use strict";

const consoleLogWarningStyles = `
  color: #fff;
  background-color: #c23934;
  display: block;
  text-align: center;
  padding: 8px 32px;
  font: 100 16px/28px sans-serif;
  background-image: linear-gradient(45deg,rgba(0,0,0,.025) 25%,transparent 25%,transparent 50%,rgba(0,0,0,.025) 50%,rgba(0,0,0,.025) 75%,transparent 75%,transparent);
  background-size: 64px 64px;
`;

/**
 * Uses https://github.com/Alorel/console-log-html to redirect console.* output to an HTML DOM element.
 * @param {*} redirectConsoleContainerID
 */
// deno-lint-ignore no-unused-vars
const redirectConsoleToHTML = (
  redirectConsoleContainerID = "container_redirectConsole",
) => {
  const ldsRedirectConsoleContainer = document.getElementById(redirectConsoleContainerID);
  if (ldsRedirectConsoleContainer) {
    $script(
      "//cdn.rawgit.com/Alorel/console-log-html/master/console-log-html.min.js",
      function () {
        ConsoleLogHTML.connect(ldsRedirectConsoleContainer);
        console.log(
          `Element ID '${redirectConsoleContainerID}' is logging console output. See github.com/Alorel/console-log-html for usage instructions.`,
        );
      },
    );
  } else {
    console.log(
      "%c%s",
      consoleLogWarningStyles,
      `Element with ID '${redirectConsoleContainerID}' required by redirectConsoleToHTML() does not exist.`,
    );
  }
};

const MINUTE = 60,
  HOUR = MINUTE * 60,
  DAY = HOUR * 24,
  WEEK = DAY * 7,
  MONTH = DAY * 30,
  YEAR = DAY * 365

function getTimeAgo(date) {
  const secondsAgo = Math.round((+new Date() - date) / 1000)
  let divisor = null
  let unit = null

  if (secondsAgo < MINUTE) {
    return secondsAgo + " seconds ago"
  } else if (secondsAgo < HOUR) {
    [divisor, unit] = [MINUTE, 'minute']
  } else if (secondsAgo < DAY) {
    [divisor, unit] = [HOUR, 'hour']
  } else if (secondsAgo < WEEK) {
    [divisor, unit] = [DAY, 'day']
  } else if (secondsAgo < MONTH) {
    [divisor, unit] = [WEEK, 'week']
  } else if (secondsAgo < YEAR) {
    [divisor, unit] = [MONTH, 'month']
  } else if (secondsAgo > YEAR) {
    [divisor, unit] = [YEAR, 'year']
  }

  const count = Math.floor(secondsAgo / divisor)
  return `${count} ${unit}${(count > 1) ? 's' : ''} ago`
}

/**
 * Create a custom element which will take any date and show long ago it was.
 * Usage in HTML:
 *     <span is="time-ago" date="valid Date string"/>
 * `date` is a Javascript Date string that will be passed into new Date(text)
 */
customElements.define('time-ago',
  class TimeAgoSpanElement extends HTMLSpanElement {
    static get observedAttributes() { return ['date']; }
    connectedCallback() { this.innerHTML = getTimeAgo(new Date(this.getAttribute('date'))); }
  },
  { extends: 'span' }
);

function getWordCount(rootElement) {
  let docContent = rootElement.textContent;

  // Parse out unwanted whitespace so the split is accurate
  // ref: https://github.com/microsoft/vscode-wordcount/blob/main/extension.ts
  docContent = docContent.replace(/(< ([^>]+)<)/g, '').replace(/\s+/g, ' ');
  docContent = docContent.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  let wordCount = 0;
  if (docContent != "") {
    wordCount = docContent.split(" ").length;
  }
  return wordCount;
}

/**
 * Create a custom element which will take any element ID and show how many words are in there.
 * Usage in HTML:
 *     <span is="word-count" element-id="ELEMENT_ID"/>
 * `element-id` is a DOM element identifier like <div id="ELEMENT_ID">
 */
customElements.define('word-count',
  class WordCountElement extends HTMLSpanElement {
    static get observedAttributes() { return ['element-id']; }
    connectedCallback() {
      window.addEventListener("load", () => {
        this.innerHTML = getWordCount(document.getElementById("content"));
      });
    }
  },
  { extends: 'span' }
);