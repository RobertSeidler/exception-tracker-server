const dbPath = 'database/db.sqlite';
const port = 52005;
const registerPath = '/register';
const reportPath = '/report';
const registrationRetrievelPath = '/retrieve/reg';
const exceptionRetrievelPath = '/retrieve/exc';

const path = require('path');
const sqlite = require('sqlite');
const util = require('util');
const fAccess = util.promisify(require('fs').access);
const express = require('express');
const bodyParser = require('body-parser')
const rhtmlEngine = require('./rhtml-engine.js');
const app = express();

app.use('/public', express.static(path.join(__dirname, 'public')));

app.engine('rhtml', rhtmlEngine);
app.set('views', './views');
app.set('view engine', 'rhtml');


const cors = require('cors')

app.use(cors());
app.use(bodyParser.json());

function rejectError(reject, err){
  if(err){
    console.error(err);
    reject(err);
  } else {
    console.log('no error', err)
  }
}

async function createDatabase(dbPath){
  // return new Promise((resolve, reject) => {
    try{
      let db = await sqlite.open(dbPath);
      await db.run('CREATE TABLE Registrations (RegisterID INTEGER PRIMARY KEY, ApplicationName TEXT NOT NULL, Time TEXT NOT NULL, UserID TEXT, IPAdress TEXT);');
      await db.run(`CREATE TABLE Exceptions (ExceptionID INTEGER PRIAMRY KEY, UserToken TEXT, UserIP TEXT, ApplicationName TEXT NOT NULL, Severity TEXT NOT NULL CHECK(Severity = 'log' OR Severity = 'warning' OR Severity = 'error'), MessageText TEXT NOT NULL, DataText TEXT, Time TEXT);`);
      return db;
    } catch(err){
      console.error(err)
    }
}

async function openDatabase(dbPath){
  return await sqlite.open(dbPath);
}

async function provideDatabase(dbPath){
  return new Promise((resolve, reject) => {
    fAccess(dbPath)
      .catch(err => {
        if(err.code === 'ENOENT'){
          // file does not exist
          console.log('trying to create new DB')
          createDatabase(dbPath)
            .then( db => resolve(db) )
            .catch( err => rejectError(reject, err) );
        } else rejectError(reject, err);
      })
      .then(() => {
        // file does already exist
        openDatabase(dbPath)
          .then( db => {
            console.log(db)
            resolve(db);
            
          })
          .catch( err => rejectError(reject, err) );
      });
  });
}

function startServer(){
  const insertRegStmt = `INSERT INTO Registrations (ApplicationName, Time, UserID, IPAdress) VALUES (?, ?, ?, ?);`
  const insertExcStmt = `INSERT INTO Exceptions (UserToken, UserIP, ApplicationName, Severity, MessageText, DataText, Time) VALUES (?, ?, ?, ?, ?, ?, ?);`

  provideDatabase(dbPath)
    .then(db => {

      app.post(registerPath, function(req, res){
        let now = (new Date()).toISOString();
        console.log({...req.body, ...{time: now}});
        db.run(insertRegStmt, [req.body.application, now, req.body.user, req.ip])
          .then(() => {
            res.sendStatus(200);
          })
          .catch(err => {
            console.error(err);
            res.status(400).json({error: err.name, message: err.message});
          });
      });
      
      app.post(reportPath, function(req, res){
        let now = (new Date()).toISOString();
        console.log({...req.body, ...{time: now}});
        db.run(insertExcStmt, [req.body.user, req.ip, req.body.application, req.body.severity, req.body.message, req.body.data, now])
          .then(() => {
            res.sendStatus(200);
          })
          .catch(err => {
            console.error(err);
            res.status(400).json({error: err.name, message: err.message});
          });
      });

      app.get(registrationRetrievelPath, function(req, res){
        Promise.all([db.all('SELECT name FROM PRAGMA_TABLE_INFO(\'Registrations\')'), db.all(`SELECT * FROM Registrations;`)])
          .catch(err => res.json({error: err.name, message: err.message}))
          .then(([columnNames, dataRows]) => {
            res.render('register/index', {values: {
              columnCount: columnNames.length,
              headerDivs: columnNames.map(row => `<div class="column-cell registration-cell">${row.name}</div>`).join(''), 
              dataDivs: dataRows.map(row => Object.keys(row).map(key => `<div class="data-cell registration-cell">${row[key]}</div>`).join('')).join('')
            }});
        })
        
      })

      app.listen(port, function(){
        console.log(`listening on ${port}.`);
      });

    })
    .catch(err => console.error(err));
}

startServer();

