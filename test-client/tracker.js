const logConsole = console.log;
const warnConsole = console.warn;
const errorConsole = console.error;

const registerPath = 'register';
const reportPath = 'report';

const contentTypeHeader = {'Content-Type': 'application/json'};

function createUserToken(){
  return [...Array(16)].map(() => Math.floor(Math.random() * 10)).join('');
}

function loadUserToken(){
  let userToken = localStorage.getItem('usertoken');
  if(userToken === null){
    userToken = createUserToken();
    localStorage.setItem('usertoken', userToken);
  } 
  return userToken;
}

async function handleRequest(uri, opts){
  return fetch(uri, opts)
    .then(response => {
      if(response.status >= 200 || response.status < 300){
        logConsole(response.status, response.statusText);
        return '{}';
      } else {
        logConsole(response.status, response.statusText);
        return response.json();
      }
    })
    .then(value => {
      if(value.error) logConsole(value.error, value.message);
    })
    .catch(err => {
      errorConsole(err);
      errorConsole('request returned an error');
      logConsole(err);
    })
}

class Tracker {
  registerClient(){
    handleRequest(this.server + registerPath, {
      method: 'POST',
      headers: contentTypeHeader,
      body: JSON.stringify({
        application: this.application,
        user: this.userToken,
      })
    });
  }

  sendReport(severity, message, data){
    handleRequest(this.server + reportPath, {
      method: 'POST',
      headers: contentTypeHeader,
      body: JSON.stringify({
        user: this.userToken,
        application: this.application,
        severity: severity,
        message: message,
        data: data,
      }),
    });
  }

  constructor(serverUri, applicationName){
    this.server = serverUri.slice(-1) == '/' ? serverUri : serverUri + '/';
    this.application = applicationName;
    this.userToken = loadUserToken();
    logConsole(this.userToken)
    this.registerClient()
  }

  /**
   * Inject a new Tracker object into console global. The tracker for an application, app, is accessable via console.tracker[app].
   * 
   * @param {string} uri Exception-tracker-Server uri in the Form 'proto://my.server.address.com:port/'.
   * @param {string} app a name under which the Reports are filed in the server.
   * @param {boolean} injectLog if console.log should send the logs automatically.
   * @param {boolean} injectWarn if console.log should send the logs automatically.
   * @param {boolean} injectError if console.log should send the logs automatically.
   */
  static injectConsole(uri, app, injectLog = true, injectWarn = true, injectError = true){
    let tracker = new Tracker(uri, app);
    if(!console.tracker) console.tracker = {};
    console.tracker[app] = tracker;

    if(injectLog){
      console.log = function(message, data, appname, ...additionalArgs){
        tracker.sendReport('log', message, data);
        logConsole(message, data, ...additionalArgs);
      };
    }

    if(injectWarn){
      console.warn = function(message, data, appname,  ...additionalArgs){
        tracker.sendReport('warn', message, data);
        warnConsole(message, data, ...additionalArgs);
      };
    }

    if(injectError){
      console.error = function(message, data, appname, ...additionalArgs){
        tracker.sendReport('error', message, data);
        errorConsole(message, data, ...additionalArgs);
      };
    }
  }
}

module.exports = {
  Tracker
}