const port = 52005;

const staticFolder = '/public';
const registerPath = '/register';
const reportPath = '/report';

// const contentTypeHTML = {'Content-Type': 'text/html'};

const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const rhtmlEngine = require('./rhtml-engine.js');
const provideDatabase = require('./database.js').provideDatabase;
const {
  insertRegistrationRoute,
  insertExceptionRoute,
  showRegistrations,
  showExceptions,
  sendResultPage,
} = require('./router.js');

class View {
  constructor(name, path, routeFn, sidebarTemplate){
    this.name = name;
    this.path = path;
    this.view = routeFn;
    this.side = sidebarTemplate;
    this.sideValues = {}
  }
}

const exceptionsView = new View(
  'Reports', 
  '/retrieve/exc', 
  showExceptions,
  undefined
);
const registrationsView = new View(
  'Registrations', 
  '/retrieve/reg', 
  showRegistrations,
  'register/sidebar'
);

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(
  staticFolder, 
  express.static(path.join(__dirname, staticFolder.substr(1)))
);

app.engine('rhtml', rhtmlEngine);

app.set('views', './views');
app.set('view engine', 'rhtml');

function startServer(){
  provideDatabase()
    .then(db => {
      app.post(registerPath, insertRegistrationRoute.bind(this, db));
      app.post(reportPath, insertExceptionRoute.bind(this, db));
      app.get(
        registrationsView.path, 
        registrationsView.view.bind(this, db), 
        sendResultPage.bind(this, registrationsView.name, registrationsView.side)
      );
      app.get(
        exceptionsView.path, 
        exceptionsView.view.bind(this, db), 
        sendResultPage.bind(this, exceptionsView.name, exceptionsView.side),
      );

      app.listen(port, function(){
        console.log(`Server started. listening on ${port}.`);
      });

    });
}

startServer();

