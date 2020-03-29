'use strict';

const
  dateformat = require('dateformat'),
  vscode = require('vscode');

const DEFAULT_DATE_FORMAT = 'hh:MM TT';

module.exports = function () {
  return dateformat(Date.now(), vscode.workspace.getConfiguration('clock').dateFormat || DEFAULT_DATE_FORMAT);
};
