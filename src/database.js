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

const selectRegistrationColumns = `
  SELECT 
    name 
  FROM 
    PRAGMA_TABLE_INFO(
      'Registrations'
    );
`;

const selectRegistrations = `
  SELECT 
    RegisterID,
    ApplicationName, 
    Time, 
    UserID, 
    IPAdress
  FROM 
    Registrations
  WHERE
    UserID LIKE ? AND
    ApplicationName LIKE ?;
`;

const createExceptionsTable = `
  CREATE TABLE Exceptions (
    ExceptionID INTEGER PRIMARY KEY, 
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
    ExceptionID,
    ApplicationName, 
    Severity, 
    UserToken, 
    UserIP, 
    MessageText, 
    '<a href="/retrieve/report/attachments/' || ExceptionID || '" target="_blank">link</a>' as DataText, 
    Time
  FROM
    Exceptions
  WHERE
    UserToken LIKE ? AND
    ApplicationName LIKE ?;
  ;
`;

const selectReportDataTextStmt = `
  SELECT
    DataText
  FROM
    Exceptions
  WHERE
    ExceptionID = ?;
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
  selectRegistrationColumns,
  selectRegistrations,
  insertExcStmt,
  selectReportDataTextStmt,
  selectExceptionColumns,
  seletExceptions,

}