"use strict";

class SocketConnectionStrategy {
  #connIntervalMillisecs;
  #startedConnAttemptsAt;
  #endedConnAttemptsAt;
  #socketReconnectionTimerId;

  constructor(connIntervalMillisecs = 1000, connMaxAttempts = 60) {
    this.connIntervalMillisecs = connIntervalMillisecs;
    this.connMaxAttempts = connMaxAttempts || 60;        // don't allow zero

    this.onInitAutoReconnect = null;   // (SocketCommandsManager, attemptNum) => boolean
    this.onInitConnect = null;         // (SocketCommandsManager, attemptNum, callback) => void
    this.onMaxAttemptsExceeded = null; // (attemptNum, SocketCommandsManager) => boolean
    this.onConnEstablished = null;     // (event, SocketCommandsManager, attemptNum, reestablishing) => void
    this.onAbandonConnAttempts = null; // (SocketCommandsManager, attemptNum) => void
  }

  get connIntervalMillisecs() {
    return this.#connIntervalMillisecs;
  }

  set connIntervalMillisecs(connIntervalMS) {
    this.#connIntervalMillisecs = connIntervalMS < 1000 ? 1000 : connIntervalMS;
  }

  durationSinceStart() {
    return Date.now() - this.#startedConnAttemptsAt.getTime();
  }

  startEndDateRange() {
    return [this.#startedConnAttemptsAt, this.#endedConnAttemptsAt];
  }

  shouldAutoReconnectOnSocketClose(socketCmdsManager, attemptNum) {
    if (this.onInitAutoReconnect) return this.onInitAutoReconnect(socketCmdsManager, attemptNum);
    return true;
  }

  attemptConnection(socketCmdsManager, callback, attemptNum) {
    clearInterval(this.#socketReconnectionTimerId);
    this.#socketReconnectionTimerId = setInterval(callback, this.connIntervalMillisecs);
    this.#startedConnAttemptsAt = Date();
    if (this.onInitConnect) this.onInitConnect(socketCmdsManager, attemptNum, callback);
  }

  isMaxReconnAttemptsExceeded(attemptNum, socketCmdsManager) {
    const exceeded = attemptNum > this.connMaxAttempts;
    if (exceeded && this.onMaxAttemptsExceeded) {
      return this.onMaxAttemptsExceeded(attemptNum, socketCmdsManager)
    }
    return exceeded;
  }

  abandonConnectionAttempts(socketCmdsManager, attemptNum) {
    clearInterval(this.#socketReconnectionTimerId);
    socketCmdsManager.reportDiagnostic(`[SocketConnectionStrategy] abandonConnectionAttempts (${attemptNum}, ${this.connMaxAttempts}, ${this.#socketReconnectionTimerId})`);
    this.#endedConnAttemptsAt = new Date();
    if (this.onAbandonConnAttempts) this.onAbandonConnAttempts(socketCmdsManager, attemptNum);
  }

  connectionEstablished(event, socketCmdsManager, attemptNum, reestablishing) {
    clearInterval(this.#socketReconnectionTimerId);
    socketCmdsManager.reportDiagnostic(`[SocketConnectionStrategy] connectionEstablished (attempt: ${attemptNum}, reestablishing: ${reestablishing}, connIntervalMillisecs: ${this.connIntervalMillisecs})`);
    this.#endedConnAttemptsAt = new Date();
    if (this.onConnEstablished) this.onConnEstablished(event, socketCmdsManager, attemptNum, reestablishing);
  }
}

class NamedSocketCommandsHandler {
  constructor(handlers) {
    this.onMessage = (event, socketCmdsManager) => {
      const message = JSON.parse(event.data);
      if (message && message.nature == "command") {
        const commandID = message.identity;
        if (handlers[commandID]) {
          const handler = handlers[commandID];
          let handlerResult;
          if (this.onShouldCommandBeHandled) {
            if (this.onShouldCommandBeHandled(commandID, message.arguments, handler, message, event, socketCmdsManager)) {
              handlerResult = handler(commandID, message.arguments, event, socketCmdsManager);
            } else {
              return;
            }
          } else {
            handlerResult = handler(commandID, message.arguments, event, socketCmdsManager)
          }
          if (this.onAfterCommandHandled) {
            this.onAfterCommandHandled(commandID, message.arguments, handlerResult, handler, message, event, socketCmdsManager);
          }
        } else {
          if (this.onCommandNotFound) {
            this.onCommandNotFound(commandID, message, event, socketCmdsManager);
          }
        }
      }
    }

    this.onShouldCommandBeHandled = null; // (commandID, commandArgs, handler, message, event, socketCmdsManager) => boolean;
    this.onAfterCommandHandled = null; // (commandID, commandArgs, handlerResult, handler, message, event, socketCmdsManager) => unknown;

    this.onCommandNotFound = (commandID, message, _event, socketCmdsManager) => {
      socketCmdsManager.reportDiagnostic(`'${commandID}' DictionarySocketCommandsHandler onMessage(event) command not found (${JSON.stringify(message)})`);
    }
  }
}

class SocketCommandsManager {
  #activeSocket;

  constructor(socketEndpointURL, cmdsHandler, options) {
    this.socketEndpointURL = socketEndpointURL;
    this.cmdsHandler = cmdsHandler;
    this.diagnose = options?.diagnose ?? false;
    this.connStrategy = options?.connStrategy || new SocketConnectionStrategy(1, 60);
    this.userAgent = {
      identity: options?.userAgentIdentity || this.randomOriginIdentity(),
      locationURL: options?.locationURL || `${location.protocol}//${location.hostname}:${location.port}`
    };
  }

  reportDiagnostic(message) {
    if (this.diagnose) {
      console.info(message);
    }
  }

  get activeSocket() {
    return this.#activeSocket;
  }

  randomOriginIdentity() {
    // generate UUID v4 (https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid)
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  connect(onSuccess, parentConnAttempt = 0, reestablishing = false) {
    // If one is already open, allow the last socket to be garbage collected
    if (this.#activeSocket) this.#activeSocket.close();
    this.#activeSocket = null;
    this.#activeSocket = new WebSocket(this.socketEndpointURL);

    this.#activeSocket.addEventListener("open", (event) => {
      this.reportDiagnostic(`SocketCommandsManager web socket opened, onConnect initiated (${this.socketEndpointURL})`);
      this.connStrategy.connectionEstablished(event, this, parentConnAttempt, reestablishing);
      if (onSuccess) onSuccess(event, parentConnAttempt, reestablishing);
    });

    this.#activeSocket.addEventListener("close", () => {
      const connAttemptNum = parentConnAttempt + 1;
      const connStrategy = this.connStrategy;
      if (!connStrategy.shouldAutoReconnectOnSocketClose(this, connAttemptNum)) {
        this.reportDiagnostic(`SocketCommandsManager web socket declined auto reconnect (${connAttemptNum}, ${this.socketEndpointURL})`);
        return;
      }
      connStrategy.attemptConnection(this, () => {
        if (connStrategy.isMaxReconnAttemptsExceeded(connAttemptNum, this)) {
          connStrategy.abandonConnectionAttempts(this, connAttemptNum);
          return;
        }
        this.connect(onSuccess, connAttemptNum, true);
      }, connAttemptNum);
    });

    // Add a listener for messages from the server.
    this.#activeSocket.addEventListener("message", (event) => {
      this.cmdsHandler.onMessage(event, this);
    });
  }

  provision(_event, connAttempt = 0, reestablishing = false) {
    // TODO: use https://github.com/fingerprintjs/fingerprintjs or similar
    // for more unique socket provisioning
    this.#activeSocket.send(JSON.stringify({
      nature: 'provision',
      userAgent: this.userAgent,
      observability: {
        connAttempt,
        reestablishing
      }
    }));
  }
}

function socketCmdsMgrVisualsProseDecorator(socketCmdsManager, options = {
  domElemIDsPrefix: "socket-commands-mgr-state-"
}) {
  const updateConnStateVisuals = (scm, connected, reestablished) => {
    const visElem = document.getElementById(`${options.domElemIDsPrefix}visuals`);
    if (visElem) {
      if (connected) {
        visElem.style.display = 'block';
        visElem.title = `${scm.userAgent.locationURL} connection ${reestablished ? 'reestablished' : 'established'} to ${scm.socketEndpointURL}`;
      } else {
        visElem.style.display = '';
        visElem.title = `${scm.userAgent.locationURL} not connected to ${scm.socketEndpointURL}`;
      }
    }
  };

  const updateConnStateProse = (message, appendForceReload = false) => {
    const proseElem = document.getElementById(`${options.domElemIDsPrefix}prose`);
    if (proseElem) {
      proseElem.innerHTML = appendForceReload ? `${message} <a href="javascript:location.reload()" class="localhost-diags localhost-diags-live-reload-force">Force Reload</a>.` : message;
    } else {
      console.log(message);
    }
  };

  const scmStrategy = socketCmdsManager.connStrategy;
  scmStrategy.onInitConnect = (scm, attemptNum) => {
    updateConnStateVisuals(scm, false);
    updateConnStateProse(`Waiting for ${scm.userAgent.locationURL} server to start (attempt ${attemptNum} of ${scm.connStrategy.connMaxAttempts}).`, true);
  };
  scmStrategy.onInitAutoReconnect = (scm, attemptNum) => {
    updateConnStateProse(`Server at ${scm.userAgent.locationURL} has been closed (restarted?), reconnecting (attempt ${attemptNum} in ${scm.connStrategy.connIntervalMS}ms).`, true);
    return true;
  };
  scmStrategy.onConnEstablished = (event, scm, attemptNum, reestablishing) => {
    updateConnStateVisuals(scm, true, reestablishing);
    updateConnStateProse(`Connection ${reestablishing ? 'reestablished' : 'established'} for <code><a href="${scm.userAgent.locationURL}">${scm.userAgent.locationURL}</a></code>.<br/><code>${scm.socketEndpointURL}</code><p>${new Date()}.${attemptNum > 1 ? `<br/>${attemptNum} attempts.</p>` : ''}`);
    scm.provision(event, attemptNum, reestablishing);
  };
  scmStrategy.onAbandonConnAttempts = (scm, attemptNum) => {
    updateConnStateVisuals(scm, false);
    updateConnStateProse(`Server did not restart after ${scmStrategy.durationSinceStart()}ms and ${attemptNum} attempts, giving up.`, true);
  };

  return socketCmdsManager;
}