// TODO convert to fetch and Typescript

export function httpEndpointAvailableAction(url, action, state) {
  const prepareHttpRequest = (url, state) => {
    const http = new XMLHttpRequest();
    http.open("HEAD", url, /*async*/ true);
    http.setRequestHeader("Content-Type", "text/plain");
    return http;
  };

  // if caller wants to setup any state, use the context variable
  const http = state?.prepareXMLHttpRequest
    ? state.prepareXMLHttpRequest(url, state)
    : prepareHttpRequest(url, state);

  http.onreadystatechange = function (xhrEvent) {
    if (http.readyState == 4) {
      if (http.status == 200) {
        action({ request: http, url, xhrEvent, state });
      } else {
        if (state?.onInvalidStatus) {
          state.onInvalidStatus({ request: http, url, xhrEvent, state });
        }
      }
    }
  };
  try {
    http.send(null);
  } catch (error) {
    if (state?.onError) {
      if (state?.onInvalidStatus) {
        state.onInvalidStatus({ request: http, url, xhrEvent, state, error });
      }
    }
  }
}
