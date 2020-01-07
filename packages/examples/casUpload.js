/*
 * ------------------------------------------------------------------------------------
 *   Copyright (c) SAS Institute Inc.
 *   Licensed under the Apache License, Version 2.0 (the 'License');
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an 'AS IS' BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 * ---------------------------------------------------------------------------------------
 *
 */

'use strict';

let restaf     = require('@sassoftware/restaf');
let fs         = require('fs');

let {casSetup, print} = require('@sassoftware/restaflib');

let payload  = require('./config')();
let filename = 'cars';
let fileType = 'csv';

let store = restaf.initStore();

async function example () {
  // setup session
  let {session} = await casSetup(store, payload);

  // setup header for upload and the rest of the payload
  let JSON_Parameters = {
    casout: {
      caslib: 'casuser' /* a valid caslib */,
      name  : filename /* name of output file on cas server */
    },

    importOptions: {
      fileType: fileType /* type of the file being uploaded */
    }
  };

  let p = {
    headers: { 'JSON-Parameters': JSON_Parameters },
    data   : readFile(filename, fileType),
    action : 'table.upload'
  };

  await store.runAction(session, p);

  p = {
    action: 'table.fetch',
    data  : { table: { caslib: 'casuser', name: filename } }
  };

  let result = await store.runAction(session, p);
  print.casTable(result, 'Fetch');

  // console.log(JSON.stringify(result.items('tables'), null, 4));

  // noinspection JSUnusedLocalSymbols
  await store.apiCall(session.links('delete'));

  return 'All Done';
}

function readFile (filename, fileType) {
  let data = fs.readFileSync(`./data/${filename}.${fileType}`);
  return data;
}

example()
  .then(r => console.log(r))
  .catch(err => console.log(err));