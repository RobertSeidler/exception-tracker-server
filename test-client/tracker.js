const logConsole = console.log;
const warnConsole = console.warn;
const errorConsole = console.error;

const registerPath = 'register';
const reportPath = 'report';

const contentTypeHeader = {'Content-Type': 'application/json'};

function createUserToken(){
  return [...Array(32)].map(() => Math.floor(Math.random() * 10)).join('');
}

function loadUserToken(){
  let userToken = localStorage.getItem('usertoken');
  if(userToken === null){
    userToken = createUserToken();
    localStorage.setItem('usertoken', userToken);
  } 
  return userToken;
}

function handleRequest(uri, opts){
  fetch(uri, opts)
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

  static injectConsole(uri, app){
    let tracker = new Tracker(uri, app);
    console.tracker = tracker;
    console.log = function(message, data, ...additionalArgs){
      tracker.sendReport('log', message, data);
      logConsole(message, data, ...additionalArgs);
    };
    console.warn = function(message, data, ...additionalArgs){
      tracker.sendReport('warn', message, data);
      warnConsole(message, data, ...additionalArgs);
    };
    console.error = function(message, data, ...additionalArgs){
      tracker.sendReport('error', message, data);
      errorConsole(message, data, ...additionalArgs);
    }
  }
}

