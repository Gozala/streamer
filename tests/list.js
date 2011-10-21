/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var list = require('../core').list
var test = require('./utils').test

exports['test empty list'] = function(assert, done) {
  test(assert, done, list(), [])
}

exports['test number list'] = function(assert, done) {
  test(assert, done, list(1, 2, 3), [ 1, 2, 3 ])
}

exports['test mixed list'] = function(assert, done) {
  var object = {}, func = function() {}, exp = /foo/, error = new Error('Boom!')
  test(assert, done, list('a', 2, 'b', 4, object, func, exp, error),
       [ 'a', 2, 'b', 4, object, func, exp, error  ])
}

if (module == require.main)
  require('test').run(exports)

});
