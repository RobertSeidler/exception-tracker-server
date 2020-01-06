const dbPath = './database/db.sqlite';
const port = 52005;
const registerPath = '/register';
const reportPath = '/report';

const sqlite = require('sqlite3');
const util = require('util');
const fAccess = util.promisify(require('fs').access);
const express = require('express');
const bodyParser = require('body-parser')
const app = express();

app.use(bodyParser.json());

async function createDatabase(dbPath){
  return new Promise((resolve, reject) => {
    let db = new sqlite.Database(dbPath, sqlite.OPEN_CREATE, err => reject(err));
    db.serialize(function(){
      db.run('CREATE TABLE Registrations (RegisterID INTEGER PRIMARY KEY, ApplicationName TEXT NOT NULL, Time TEXT NOT NULL, UserID TEXT, IPAdress TEXT)')
      db.run('CREATE TABLE Exceptions (...)', (result, err) => {
        if(err) reject(err);
        resolve(db);
      });
    });    
  });
}

async function openDatabase(dbPath){
  return new Promise((resolve, reject) => {
    let db = new sqlite.Database(dbPath, sqlite.OPEN_READWRITE, err => reject(err));
    resolve(db);
  });
}

async function provideDatabase(dbPath){
  return new Promise((resolve, reject) => {
    fAccess(dbPath)
      .catch(err => {
        if(err.code === 'ENOENT'){
          // file does not exist
          createDatabase(dbPath)
            .then( db => resolve(db) )
            .catch( err => reject(err) );
        } else reject(err);
      })
      .then(() => {
        // file does already exist
        openDatabase(dbPath)
          .then( db => resolve(db) )
          .catch( err => reject(err) );
      });
  });
}

function startServer(){
  const insertStmt = `INSERT INTO Registrations (ApplicationName, Time, UserID, IPAdress) VALUES (?, ?, ?, ?);`

  provideDatabase(dbPath).then(db => {
    app.post(registerPath, function(req, res){
      let now = (new Date()).toISOString();
      db.run(insertStmt, [req.body.app, now, req.body.user, req.ip], err => {
        if(err) {
          console.error(err);
          res.status(400).json({error: err.name, message: err.message});
        } else {
          res.sendStatus(200);
        }
      });
    });
    
    app.listen(port, function(){
      console.log(`listening on ${port}.`);
    })
  });
}

