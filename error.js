module.exports.exitCodes = {
    dbOpenFailed: 1,
    dbCreateFailed: 2,
    dbFileAccessFailed: 3,   
}

module.exports.errorMessages = {
    createDBFailed: `Database creation failed. Exiting programm.`,
    openDBFailed: `Database could not be opened. Exiting programm.`,
    accessFileDBFailed: `Unkown error while accessing database file.`,
}

module.exports.errors = {
    
}