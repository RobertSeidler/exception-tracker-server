/**
 * Simple Render Engine for my custom html template language, rhtml.
 * 
 * Usage:
 * 
 * const express = require('express');
 * const rhtmlEngine = require('./rhtml-engine.js');
 * const app = express();
 * app.engine('rhtml', rhtmlEngine());
 * app.set('view engine', 'rhtml');
 */

const fs = require('fs');

function mergeValues(values, content){
    for(let key in values){
        // console.log(Object.keys(values));
        content = content.toString('utf-8').replace(`{{${key}}}`, values[key]);
    }
    return content;
}

module.exports = function rhtmlEngine(filePath, options, callback){
    fs.readFile(filePath, function(err, content){
        if(err) return callback(new Error(err));
        return callback(null, mergeValues(options.values, content));
    })
}