/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true */

(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

exports['test list'] = require('./list.js')
exports['test map'] = require('./map.js')
exports['test filter'] = require('./filter.js')
exports['test reduce'] = require('./reduce.js')
exports['test zip'] = require('./zip.js')
exports['test head'] = require('./head.js')
exports['test tail'] = require('./tail.js')
exports['test append'] = require('./append.js')
exports['test merge'] = require('./merge.js')
exports['test hub'] = require('./hub.js')
exports['test cache'] = require('./cache.js')


if (module == require.main)
  require('test').run(exports);

})
