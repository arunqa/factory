import { actuationStrategy } from "./path.lib.js";

// prepare global `executive` and "bootstrap" or _actuate_ the page.
const strategy = actuationStrategy().args;
strategy.actuate();
