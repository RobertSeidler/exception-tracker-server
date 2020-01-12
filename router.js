const showRegistrationsTemplate = 'register/index';
const showExeptionsTemaplate = 'exception/index';

const {
  insertRegStmt, 
  insertExcStmt,
  selectRegistrationColumns,
  selectRestrations,
  selectExceptionColumns
} = require('./database.js');

function handleError(response, error){
  console.error(error);
  response
    .status(400)
    .json({
      error: error.name,
      message: error.message,
    })
}

function insertRegistrationRoute(db, req, res){
  let now = (new Date()).toISOString();
  console.log({...req.body, ...{time: now}});
  db.run(insertRegStmt, [
    req.body.application, 
    now, 
    req.body.user, 
    req.ip
  ])
    .then(() => {
      res.sendStatus(200);
    })
    .catch(handleError.bind(this, res));
}

function insertExceptionRoute(db, req, res){
  let now = (new Date()).toISOString();
  console.log({...req.body, ...{time: now}});
  db.run(insertExcStmt, [
    req.body.user, 
    req.ip, 
    req.body.application, 
    req.body.severity, 
    req.body.message, 
    req.body.data, now
  ])
    .then(() => {
      res.sendStatus(200);
    })
    .catch(handleError.bind(this, res));
}

function displayColumns(template, [columnNames, dataRows]) {
  res.render(template, {values: {
    columnCount: columnNames.length,
    headerDivs: columnNames.map(
      row => `<div class="column-cell registration-cell">${row.name}</div>`
    ).join(''), 
    dataDivs: dataRows.map(
      row => Object.keys(row).map(
        key => `<div class="data-cell registration-cell">${row[key]}</div>`
      ).join('')
    ).join('')
  }});
}

function showRegistrations(db, req, res){
  Promise.all([
    db.all(selectRegistrationColumns), 
    db.all(selectRestrations)
  ])
    .catch(handleError.bind(this, res))
    .then(displayColumns.bind(this, showRegistrationsTemplate));
  
}

function showExceptions(db, req, res){
  Promise.all([
    db.all(selectExceptionColumns),
    db.all(seletExceptions)
  ])
    .catch(handleError.bind(this, res))
    .then(displayColumns.bind(this, showExeptionsTemaplate));
}

module.exports = {
  insertRegistrationRoute,
  insertExceptionRoute,
  showRegistrations,
  showExceptions,

};