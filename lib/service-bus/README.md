# ServiceBus for unified type-safe user agent (browser) and server messages

Resource Factory's `ServiceBus` library provides a User Agent (e.g. browser or mobile) client-side _service bus_ for sending and receiving RPC, EventSource, and WebSocket messages. The important thing is that Typescript is used to define type-safe _services_ that can be consumed and served with the same Typescript code on *both* the _client_ (user agent or browser) _and server_.

## Structure

These directories exist:

* `core` -- the code for connecting, reconnecting, and managing the event listeners for all services
* `assurance` -- 