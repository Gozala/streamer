/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

exports['test list'] = require('./list')
exports['test head'] = require('./head')
exports['test tail'] = require('./tail')
exports['test take'] = require('./take')
exports['test drop'] = require('./drop')
exports['test filter'] = require('./filter')
exports['test map'] = require('./map')
exports['test zipmap'] = require('./zipmap')
exports['test zip'] = require('./zip')
exports['test append'] = require('./append')
exports['test flatten'] = require('./flatten')
exports['test mix'] = require('./mix')
exports['test merge'] = require('./merge')
exports['test hub'] = require('./hub')
exports['test lazy'] = require('./lazy')

if (module == require.main)
  require('test').run(exports)

});
