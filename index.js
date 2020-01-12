const port = 52005;

const staticFolder = '/public';
const registerPath = '/register';
const reportPath = '/report';
const showRegistrationsPath = '/retrieve/reg';
const showExceptionsPath = '/retrieve/exc';

const path = require('path');
const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser')

const rhtmlEngine = require('./rhtml-engine.js');
const provideDatabase = require('./database.js').provideDatabase;
const {
  insertRegistrationRoute,
  insertExceptionRoute,
  showRegistrations,
  showExceptions,

} = require('./router.js');

const app = express();

app.use(staticFolder, express.static(path.join(__dirname, staticFolder.substr(1))));
app.use(cors());
app.use(bodyParser.json());

app.engine('rhtml', rhtmlEngine);

app.set('views', './views');
app.set('view engine', 'rhtml');

function startServer(){
  provideDatabase()
    .then(db => {
      app.post(registerPath, insertRegistrationRoute.bind(this, db));
      app.post(reportPath, insertExceptionRoute.bind(this, db));
      app.get(showRegistrationsPath, showRegistrations.bind(this, db));
      app.get(showExceptionsPath, showExceptions.bind(this, db));

      app.listen(port, function(){
        console.log(`Server started. listening on ${port}.`);
      });

    });
}

startServer();

