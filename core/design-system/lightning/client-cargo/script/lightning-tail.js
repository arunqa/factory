/*!
 * [Sticky Footer 2.3](https://github.com/coreysyms/foundationStickyFooter)
 * Copyright 2013 Corey Snyder.
 */

const MutationObserver = (function () {
    const prefixes = ["WebKit", "Moz", "O", "Ms", ""];
    for (let i = 0; i < prefixes.length; i++) {
        if (prefixes[i] + "MutationObserver" in window) {
            return window[prefixes[i] + "MutationObserver"];
        }
    }
    return false;
}());

//check for changes to the DOM
const target = document.body;
let observer;
const config = {
    attributes: true,
    childList: true,
    characterData: true,
    subtree: true,
};

if (MutationObserver) {
    // create an observer instance
    observer = new MutationObserver(mutationObjectCallback);
}

function mutationObjectCallback() {
    stickyFooter();
}

//check for resize event
window.onresize = function () {
    stickyFooter();
};

//lets get the marginTop for the <footer>
function getCSS(element, property) {
    const elem = document.getElementsByTagName(element)[0];
    let css = null;

    if (elem.currentStyle) {
        css = elem.currentStyle[property];
    } else if (window.getComputedStyle) {
        css = document.defaultView.getComputedStyle(elem, null)
            .getPropertyValue(property);
    }

    return css;
}

function stickyFooter() {
    if (MutationObserver) {
        observer.disconnect();
    }
    document.body.setAttribute("style", "height:auto");

    //only get the last footer
    const footer = document.getElementsByTagName(
        "footer",
    )[document.getElementsByTagName("footer").length - 1];

    if (footer.getAttribute("style") !== null) {
        footer.removeAttribute("style");
    }

    if (window.innerHeight != document.body.offsetHeight) {
        const offset = window.innerHeight - document.body.offsetHeight;
        let current = getCSS("footer", "margin-top");

        if (isNaN(parseInt(current)) === true) {
            footer.setAttribute("style", "margin-top:0px;");
            current = 0;
        } else {
            current = parseInt(current);
        }

        if (current + offset > parseInt(getCSS("footer", "margin-top"))) {
            footer.setAttribute(
                "style",
                "margin-top:" + (current + offset) + "px;display:block;",
            );
        }
    }

    document.body.setAttribute("style", "height:100%");

    //reconnect
    if (MutationObserver) {
        observer.observe(target, config);
    }
}

/*
! end sticky footer
*/
