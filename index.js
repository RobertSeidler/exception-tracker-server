const dbPath = 'database/db.sqlite';
const port = 52005;
const registerPath = '/register';
const reportPath = '/report';

const sqlite = require('sqlite');
const util = require('util');
const fAccess = util.promisify(require('fs').access);
const express = require('express');
const bodyParser = require('body-parser')
const app = express();

var isClosed = false;

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
      await db.run('CREATE TABLE Registrations (RegisterID INTEGER PRIMARY KEY, ApplicationName TEXT NOT NULL, Time TEXT NOT NULL, UserID TEXT, IPAdress TEXT)');
      await db.run('CREATE TABLE Exceptions (ExceptionID INTEGER PRIMARY KEY)');
      return db;
    } catch(err){
      console.error(err)
    }
    
    // rejectError(reject, err);
    // db.serialize(function(){
    //   db
    //     .run('CREATE TABLE Registrations (RegisterID INTEGER PRIMARY KEY, ApplicationName TEXT NOT NULL, Time TEXT NOT NULL, UserID TEXT, IPAdress TEXT)', (err) => {
    //       rejectError(reject, err);
    //     })
    //     .run('CREATE TABLE Exceptions (ExceptionID INTEGER PRIMARY KEY)', (err) => {
    //       rejectError(reject, err);
    //       resolve(db);
    //     });
    // });
    
    // console.log('db: ', db);
  // });
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
  const insertStmt = `INSERT INTO Registrations (ApplicationName, Time, UserID, IPAdress) VALUES (?, ?, ?, ?);`

  provideDatabase(dbPath)
    .then(db => {
      console.log(db)
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
      });

    })
    .catch(err => console.error(err));
}

startServer();

