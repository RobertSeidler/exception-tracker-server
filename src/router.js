const showRegistrationsTemplate = 'register/index';
const showExeptionsTemaplate = 'exception/index';

const contentTypeHTML = {'Content-Type': 'text/html'};

const headerPath = './public/header.html';
const footerPath = './public/footer.html';
const errorViewPath = 'error/error';

const util = require('util');
const readFilePromise = util.promisify(require('fs').readFile);

const {
  insertRegStmt, 
  selectRegistrationColumns,
  selectRegistrations,
  insertExcStmt,
  selectReportDataTextStmt,
  selectExceptionColumns,
  seletExceptions,
} = require('./database.js');

function handleError(res, next, statusCode, error){
  console.error(error);
  res.locals.template = errorViewPath;
  res.locals.content = {
    status: statusCode,
    error: error.stack,
    template: 'error/error'
  };
  next();
}

async function renderTemplateFile(res, templateFile, valueObj){
  if(templateFile === undefined) return '';
  return new Promise((resolve, reject) => {
    res.render(templateFile, {values: valueObj}, function(err, html){
      if(err) console.error(err);
      resolve(html);
    });
  })
    .catch(err => (console.error(err), res.sendStatus(500)));
}

async function getSideScaffold(res, sidebarTemplate, sidebarValues, ){
  return Promise.all([
    readFilePromise(headerPath), 
    renderTemplateFile(res, sidebarTemplate, sidebarValues), 
    readFilePromise(footerPath)
  ])
    .then(([headerHtml, sidebarHtml, footerHtml]) => {
      return {
        header: headerHtml, 
        sidebar: sidebarHtml,
        footer: footerHtml,
      }
    })
    .catch(err => (console.log(err), res.sendStatus(500)));
}

function sendResultPage(pageName, sidebarTemplate, req, res, next){
  let status = res.locals.content.status;
  let resultContent = res.locals.content;
  let templateFile = res.locals.template;
  Promise.all([
    renderTemplateFile(res, templateFile, resultContent),
    getSideScaffold(res, sidebarTemplate, {}),
  ])
    .then(([contentHtml, sideScaffold]) => {
      renderTemplateFile(res, 'index', {
        ...sideScaffold, 
        ...{page: pageName, content: contentHtml}
      })
        .then(finishedHtml => res.status(status).set(contentTypeHTML).send(finishedHtml))
        .catch(err => console.error(err));
    })
}

function insertRegistrationRoute(db, req, res, next){
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
    .catch(handleError.bind(this, res, next, 400));
}

function getReportAttachment(db, req, res, next){
  let reportID = req.params.reportID;
  db.all(selectReportDataTextStmt, [reportID])
    .catch(handleError.bind(this, res, next, 404))
    .then(dataRows => (
      console.log(dataRows[0].DataText), 
      res.send(JSON.parse(dataRows[0].DataText))
    ))
    .catch(handleError.bind(this, res, next, 500))
}

function insertExceptionRoute(db, req, res, next){
  let now = (new Date()).toISOString();
  console.log({...req.body, ...{time: now}});
  db.run(insertExcStmt, [
    req.body.application, 
    req.body.severity, 
    req.body.user, 
    req.ip, 
    req.body.message, 
    JSON.stringify({data: req.body.data}), 
    now
  ])
    .then(() => {
      res.sendStatus(200);
    })
    .catch(handleError.bind(this, res, next, 400))
}

function prepareDisplayValues([columnNames, dataRows]){
  return {
    columnCount: columnNames.length, 
    headerDivs: columnNames.map(
      row => `<div class="column-cell registration-cell">${row.name}</div>`
    ).join(''),
    dataDivs: dataRows.map(
      row => Object.keys(row).map(
        key => `<div class="data-cell registration-cell">${row[key]}</div>`
      ).join('')
    ).join('')
  };
}

function displayColumns(template, res, next, [columnNames, dataRows]) {
  res.locals.template = template;
  res.locals.content = {
    ...prepareDisplayValues([columnNames, dataRows]),
    status: 200,
  };
  next();
}

function showRegistrations(db, req, res, next){
  let userToken = req.query.user || '%';
  let application = req.query.app || '%';
  Promise.all([
    db.all(selectRegistrationColumns), 
    db.all(selectRegistrations, [userToken, application])
  ])
    .then(displayColumns.bind(this, showRegistrationsTemplate, res, next))
    .catch(handleError.bind(this, res, next, 400));
}

function showExceptions(db, req, res, next){
  let userToken = req.query.user || '%';
  let application = req.query.app || '%';
  Promise.all([
    db.all(selectExceptionColumns),
    db.all(seletExceptions, [userToken, application])
  ])
    .then(displayColumns.bind(this, showExeptionsTemaplate, res, next))
    .catch(handleError.bind(this, res, next, 400));
}

module.exports = {
  insertRegistrationRoute,
  insertExceptionRoute,
  showRegistrations,
  showExceptions,
  sendResultPage,
  getReportAttachment,
};