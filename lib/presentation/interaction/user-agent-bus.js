import { flexibleArgs, jsTokenEvalResult } from "../../conf/flexible-args.ts"

export class UserAgentBus {
    #clientReqMessageBaseURL;
    #config;
    #registry = [];
    #identifiables = {};

    constructor(argsSupplier) {
        this.#config = flexibleArgs(argsSupplier, {
            defaultArgs: {
                hookableDomElemsAttrName: "user-interactions-args-supplier",
                hookableDomElems: [document.documentElement, document.head],
                domElemHookName: (element, potentialName = element.dataset.tunnelUi) => {
                    return (potentialName == "auto" || potentialName == "yes")
                        ? `tuiHook_${element.id || `${element.tagName}_${this.registry.length}`}`
                        : potentialName;
                },
                discoverDomElemHook(element, discover = eval) {
                    const hookName = this.domElemHookName(element);
                    const hookFactory = jsTokenEvalResult(
                        hookName,
                        discover,
                        (value, name) => value, // TODO: we'll accept any value for now
                        (name) => { console.log(`[UserAgentBus.discoverDomElemHook] '${name}' is not a token for current scope (${element.tagName} ${element.id})`, element); return undefined; },
                        (error, name) => { console.log(`[UserAgentBus.discoverDomElemHook] token discovery '${name}' generated error in current scope (${element.tagName} ${element.id}): ${error}`, error, element); return undefined; }
                    );
                    if (hookFactory) {
                        const hook = hookFactory(element, hookName, this);
                        hook.operationsEE.emit("constructed", { element, hookName, hookFactory, uab: this });
                        return this.register(hook);
                    }
                    return undefined;
                },
                prepareClientReqMessage: (hook, message) => {
                    return {
                        nature: "UserAgentBus.message",
                        tuiHookIdentity: hook.identity,
                        ...message
                    }
                },
                determineMessageHook: (message, onNotFound = this.args.onHandleMessageHookIdNotFound) => {
                    const attemptedHookID = message.tuiHookIdentity;
                    if (attemptedHookID) {
                        let hook = this.#identifiables[attemptedHookID];
                        if (!hook) hook = onNotFound(message, attemptedHookID, this)
                        return hook;
                    }
                    return this.args.onHandleMessageHookIdNotProvided(message, this);
                },
                onDuplicateControlHook: (newHook, existingHook, identity) => {
                    console.warn(`[UserAgentBus.register] duplicate controlHook '${identity}' registered.`, newHook, existingHook, identity);
                    return newHook; // sending back hook means register this one, sending undefined skips its
                },
                onHandleMessageHookIdNotProvided: (message) => {
                    console.warn(`[UserAgentBus.onHandleMessageHookIdNotProvided] controlHook ID not provided in message (expecting message.tuiHookIdentity property).`, message, this.identifiables);
                    return undefined; // sending back undefined means stop looking, any other value would be a hook in case this method wants to replace it
                },
                onHandleMessageHookIdNotFound: (message, attemptedHookID) => {
                    console.warn(`[UserAgentBus.onHandleMessageHookIdNotFound] controlHook ID '${attemptedHookID}' in message not found.`, message, this.identifiables);
                    return undefined; // sending back undefined means stop looking, any other value would be a hook in case this method wants to replace it
                },
            }
        });

        this.#clientReqMessageBaseURL = this.#config.args.clientReqMessageBaseURL;
        if (!this.#clientReqMessageBaseURL) throw Error("this.#config.args.clientReqMessageBaseURL expected in new UserAgentBus({ clientReqMessageBaseURL: ? })");
    }

    get clientReqMessageBaseURL() { return this.#clientReqMessageBaseURL; }
    get config() { return this.#config; }
    get args() { return this.#config.args; }
    get registry() { return this.#registry; }
    get domElemHookName() { return this.#config.args.domElemHookName; }
    get discoverDomElemHook() { return this.#config.args.discoverDomElemHook; }
    get identifiables() { return this.#identifiables; }
    get prepareClientReqMessage() { return this.#config.args.prepareClientReqMessage; }

    register(constructedHook) {
        let registeredHook = constructedHook;
        const identity = registeredHook.identity;
        this.#registry.push(registeredHook);
        if (identity) {
            const existing = this.#identifiables[identity];
            if (existing && this.args.onDuplicateControlHook) {
                registeredHook = this.args.onDuplicateControlHook(registeredHook, existing, identity);
            }
            if (registeredHook) {
                this.#identifiables[identity] = registeredHook;
                const { operationsEE } = registeredHook;
                operationsEE.on("user-agent-request", (message) => {
                    this.sendClientReqMessage(registeredHook, message, true);
                });
                operationsEE.on("user-agent-notification", (message) => {
                    this.sendClientReqMessage(registeredHook, message, false);
                });
                operationsEE.emit("registered", { uab: this, identity });
            }
        }
        // chainable
        return this;
    }

    sendClientReqMessage(hook, message, fullDuplex) {
        const transactionID = "TODO:UUIDv5?"; // tokens, user agent strings, etc.
        const clientProvenance = 'UserAgentBus.sendClientMessage';
        const endpoint = this.#clientReqMessageBaseURL;
        const payload = this.prepareClientReqMessage(hook, { ...message, transactionID, endpoint, clientProvenance, uab: this });
        console.log("[UserAgentBus.sendClientMessage]", payload);

        const body = JSON.stringify(payload);
        if (fullDuplex) {
            fetch(endpoint, { method: "POST", body })
                .then(res => res.json())
                .then(message => {
                    hook.operationsEE.emit("user-agent-server-response", { ...message, transactionID, endpoint, clientProvenance, uab: this });
                }).catch(error => {
                    hook.operationsEE.emit("user-agent-request-error", { body, error, transactionID, uab: this });
                    console.error(`${endpoint} POST error`, body, error);
                });
        } else {
            fetch(endpoint, { method: "POST", body }).catch(error => {
                hook.operationsEE.emit("user-agent-notification-error", { body, error, transactionID, uab: this });
                console.error(`${endpoint} POST error`, body, error);
            });
        }
    }

    handleServerMessage(message, onNotFound) {
        const hook = this.args.determineMessageHook(message, onNotFound);
        if (hook) {
            const clientProvenance = 'UserAgentBus.handleServerMessage';
            hook.operationsEE.emit("server-notification", { ...message, endpoint, clientProvenance, uab: this });
        }
    }

    // deno-lint-ignore require-await
    async init() {
        console.log(`[UserAgentBus.init]`, this);
        // encourage chaining
        return this;
    }
}
