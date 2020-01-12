const dbPath = 'db.sqlite';

const exitCodes = require('./error.js').exitCodes;
const errMsg = require('./error.js').errorMessages;

const util = require('util');
const sqlite = require('sqlite');
const fAccess = util.promisify(require('fs').access);

function fatalError(message, originalError, exitCode){
  console.error(message);
  console.error(originalError.message);
  process.exit(exitCode);
}

const createRegistrationsTable = `
  CREATE TABLE Registrations (
    RegisterID INTEGER PRIMARY KEY, 
    ApplicationName TEXT NOT NULL, 
    Time TEXT NOT NULL, 
    UserID TEXT, 
    IPAdress TEXT
  );
`;

const createExceptionsTable = `
  CREATE TABLE Exceptions (
    ExceptionID INTEGER PRIAMRY KEY, 
    ApplicationName TEXT NOT NULL, 
    Severity TEXT NOT NULL CHECK(
      Severity IN ('log', 'warn', 'error')
    ), 
    UserToken TEXT, 
    UserIP TEXT, 
    MessageText TEXT NOT NULL, 
    DataText TEXT, 
    Time TEXT NOT NULL
  );
`;

const insertRegStmt = `
  INSERT INTO Registrations (
    ApplicationName, 
    Time, 
    UserID, 
    IPAdress
  ) 
  VALUES (
    ?, ?, ?, ?
  );
`;

const insertExcStmt = `
  INSERT INTO Exceptions (
    ApplicationName, 
    Severity, 
    UserToken, 
    UserIP, 
    MessageText, 
    DataText, 
    Time
  ) 
  VALUES (
    ?, ?, ?, ?, ?, ?, ?
  );
`;

const selectRegistrationColumns = `
  SELECT 
    name 
  FROM 
    PRAGMA_TABLE_INFO(
      'Registrations'
    );
`;

const selectRestrations = `
  SELECT 
    * 
  FROM 
    Registrations;
`;

const selectExceptionColumns = `
  SELECT 
    name
  FROM
    PRAGMA_TABLE_INFO(
      'Exceptions'
    );
`;

const seletExceptions = `
  SELECT
    *
  FROM
    Exceptions;
`;

async function createDatabase(dbPath){
  try{
    let db = await sqlite.open(dbPath);
    await db.run(createRegistrationsTable);
    await db.run(createExceptionsTable);
    return db;
  } catch(err){
    fatalError(errMsg.createDBFailed, err.message, exitCodes.dbCreateFailed);
  }
}

async function openDatabase(dbPath){
  try{
    return await sqlite.open(dbPath);
  } catch(err){
    fatalError(errMsg.openDBFailed, err.message, exitCodes.dbOpenFailed);
  }
}

async function provideDatabase(){
  try{
    await fAccess(dbPath);
    return openDatabase(dbPath);
  } catch(err){
    if(err.code === 'ENOENT'){
      return createDatabase(dbPath);
    } else {
      fatalError(errMsg.accessFileDBFailed, err.message, exitCodes.dbFileAccessFailed);
    }
  }
}

module.exports = {
  provideDatabase,
  insertRegStmt,
  insertExcStmt,
  selectRegistrationColumns,
  selectRestrations,
  selectExceptionColumns,
  seletExceptions,

}