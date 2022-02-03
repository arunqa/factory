/*!
 * [Sticky Footer 2.3](https://github.com/coreysyms/foundationStickyFooter)
 * Copyright 2013 Corey Snyder.
 */

const StickyFooterMutationObserver = (function () {
    const prefixes = ["WebKit", "Moz", "O", "Ms", ""];
    for (let i = 0; i < prefixes.length; i++) {
        if (prefixes[i] + "StickyFooterMutationObserver" in window) {
            return window[prefixes[i] + "StickyFooterMutationObserver"];
        }
    }
    return false;
}());

//check for changes to the DOM
const stickyFooterTarget = document.body;
let stickyFooterObserver;
const stickyFooterConfig = {
    attributes: true,
    childList: true,
    characterData: true,
    subtree: true,
};

if (StickyFooterMutationObserver) {
    // create an observer instance
    stickyFooterObserver = new StickyFooterMutationObserver(() => { stickyFooter() });
}

//check for resize event
window.onresize = function () {
    stickyFooter();
};

//lets get the marginTop for the <footer>
function stickyFooterGetCSS(element, property) {
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
    if (StickyFooterMutationObserver) {
        stickyFooterObserver.disconnect();
    }
    document.body.setAttribute("style", "height:auto");

    //only get the last footer
    const footer = document.getElementsByTagName("footer")[document.getElementsByTagName("footer").length - 1];
    if (footer.getAttribute("style") !== null) {
        footer.removeAttribute("style");
    }

    if (window.innerHeight != document.body.offsetHeight) {
        const offset = window.innerHeight - document.body.offsetHeight;
        let current = stickyFooterGetCSS("footer", "margin-top");

        if (isNaN(parseInt(current)) === true) {
            footer.setAttribute("style", "margin-top:0px;");
            current = 0;
        } else {
            current = parseInt(current);
        }

        if (current + offset > parseInt(stickyFooterGetCSS("footer", "margin-top"))) {
            footer.setAttribute(
                "style",
                "margin-top:" + (current + offset) + "px;display:block;",
            );
        }
    }

    document.body.setAttribute("style", "height:100%");

    //reconnect
    if (StickyFooterMutationObserver) {
        stickyFooterObserver.observe(stickyFooterTarget, stickyFooterConfig);
    }
}

/*
! end sticky footer
*/

if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    let lrSocket, lrReconnectionTimerId;
    const lrIntervalSeconds = 1;
    const lrIntervalMS = lrIntervalSeconds * 1000;
    const lrMaxAttempts = 60;

    const refreshPage = (_event, _lrSocketUrl) => {
        location.reload();
    }

    const liveReloadStatus = (message) => {
        const messenger = document.getElementById("live-reload-message-container");
        if (messenger) {
            messenger.innerHTML = message;
        } else {
            console.log(message);
        }
    }

    // if we're running as a local service, see if live-reload is enabled.
    // if a websocket is available, at the lrSocketUrl it means that we support
    // live reload using a simple rule: when the web socket closes, it triggers
    // a notification that tells us we should reload the current page and then
    // hook back in.
    const liveReloadConnect = (onConnect, lrSocketUrl = `ws://${document.location.host}/ws/experiment/live-reload`, reloadAttempt = 0) => {
        // If one is already open, allow the last socket to be garbage collected
        if (lrSocket) lrSocket.close();
        lrSocket = null;

        liveReloadStatus(`Waiting for live reload server to start at ${lrSocketUrl} (attempt ${reloadAttempt} of ${lrMaxAttempts}). <a href="javascript:location.reload()">Force Reload</a>.`);
        lrSocket = new WebSocket(lrSocketUrl);
        lrSocket.addEventListener("open", (event) => { onConnect(event, lrSocketUrl) });

        lrSocket.addEventListener("close", () => {
            const nextReloadAttempt = reloadAttempt + 1;
            liveReloadStatus(`Server at ${lrSocketUrl} has been closed (restarted?), reconnecting (attempt ${nextReloadAttempt} in ${lrIntervalMS}ms). <a href="javascript:location.reload()">Force Reload</a>.`);
            clearInterval(lrReconnectionTimerId);
            lrReconnectionTimerId = setInterval(() => {
                if (nextReloadAttempt > lrMaxAttempts) {
                    liveReloadStatus(`Server did not restart after ${lrMaxAttempts * lrIntervalSeconds} seconds and ${reloadAttempt} attempts, giving up. <a href="javascript:location.reload()">Force Reload</a>.`);
                    clearInterval(lrReconnectionTimerId);
                    return;
                }
                liveReloadConnect((event) => {
                    clearInterval(lrReconnectionTimerId);
                    refreshPage(event, lrSocketUrl)
                }, lrSocketUrl, nextReloadAttempt);
            }, lrIntervalMS);
        });

        // Add a listener for messages from the server.
        lrSocket.addEventListener("message", (event) => {
            // Check whether we should refresh the browser.
            if (event.data === "reload") {
                liveReloadStatus(`Received live reload request from ${lrSocketUrl}.`);
                liveReload(event, lrSocketUrl);
            }
        });
    }

    liveReloadConnect((_event, lrSocketUrl) => {
        liveReloadStatus(`Live reload enabled for ${lrSocketUrl}`);
    });
}