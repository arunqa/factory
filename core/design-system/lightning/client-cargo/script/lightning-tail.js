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

if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    // if we're running as a local service, see if live-reload is enabled.
    // if a websocket is available, at the socketUrl it means that we support
    // live reload using a simple rule: when the web socket closes, it triggers
    // a notification that tells us we should reload the current page and then
    // hook back in.
    (() => {
        const socketUrl = `ws://${document.location.host}/ws/experiment/live-reload`;
        let socket = new WebSocket(socketUrl);
        socket.addEventListener('open', () => {
            const messenger = document.getElementById("live-reload-message-container");
            if (messenger) {
                messenger.innerHTML = `Live reload enabled for ${socketUrl}`;
            } else {
                console.log(`live reload socket connected at ${socketUrl}`);
            }
        });
        socket.addEventListener('close', () => {
            // If we get here it means the server has been turned off, either
            // due to file-change-triggered web server restart or to truly
            // being turned off.

            console.log(`live reload socket ${socketUrl} closed, will reload the page shortly`);

            // Attempt to re-establish a connection until it works,
            // failing after a few seconds (at that point things are likely
            // turned off/permanantly broken instead of rebooting)
            const interAttemptTimeoutMilliseconds = 100;
            const maxDisconnectedTimeMilliseconds = 3000;
            const maxAttempts = Math.round(maxDisconnectedTimeMilliseconds / interAttemptTimeoutMilliseconds);
            let attempts = 0;
            const reloadIfCanConnect = () => {
                attempts++;
                if (attempts > maxAttempts) {
                    console.error(`Could not reconnect to experimental server at ${socketUrl}.`);
                    return;
                }
                socket = new WebSocket(socketUrl);
                socket.addEventListener('error', () => {
                    setTimeout(reloadIfCanConnect, interAttemptTimeoutMilliseconds);
                });
                socket.addEventListener('open', () => {
                    location.reload();
                });
            };
            reloadIfCanConnect();
        });
    })();
}