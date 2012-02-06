/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

exports['test make'] = require('./make')
exports['test delay'] = require('./delay')
exports['test iterate'] = require('./iterate')
exports['test repeat'] = require('./repeat')
exports['test capture'] = require('./capture')
exports['test finalize'] = require('./finalize')
exports['test alter'] = require('./alter')
exports['test edit'] = require('./edit')
exports['test take'] = require('./take')
exports['test drop'] = require('./drop')
exports['test head'] = require('./head')
exports['test tail'] = require('./tail')
exports['test filter'] = require('./filter')
exports['test map'] = require('./map')
exports['test zip'] = require('./zip')
exports['test append'] = require('./append')
exports['test flatten'] = require('./flatten')
exports['test mix'] = require('./mix')
exports['test merge'] = require('./merge')
exports['test lazy'] = require('./lazy')
exports['test run'] = require('./run')

if (module == require.main)
  require('test').run(exports)

});
