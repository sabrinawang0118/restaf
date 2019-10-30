/*
 * ------------------------------------------------------------------------------------
 *   Copyright (c) SAS Institute Inc.
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 * ---------------------------------------------------------------------------------------
 *
 */

"use strict";

let restaf = require("restaf");
let payload = require('./config')();
let store = restaf.initStore();
let restaflib = require('restaflib');
let {print} = restaflib;

/* --------------------------------------------------------------------------------
 * Logon to the restaf server and setup file service
 * ---------------------------------------------------------------------------------
 */

async function example (payload, models) {
  await store.logon(payload);
  let masControl = await restaflib.masSetup(store, models);

  let scenario = {
    petallengthcm: 1.5,
    petalwidthcm : 0.2,
    sepallengthcm: 5,
    sepalwidthcm : 3
  };
  let result = await restaflib.masRun (store, masControl, models[0], scenario);
  print.object(result);
  console.log(result);

}
example (payload, [ 'sdktgo_iris' ])
  .then(r => console.log('done'))
  .catch(e => {
       console.log('failed');
       console.log(e);
  });

