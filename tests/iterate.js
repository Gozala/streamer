/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var Stream = require('../core').Stream

exports.Assert = require('./assert').Assert
exports['test basic iterate'] = function(expect, complete) {
  var numbers = Stream.iterate(function incriment(x) { return x + 1 }, 0)
  expect(numbers.take(5)).to.be(0, 1, 2, 3, 4).and.then(complete)
}

if (module == require.main)
  require('test').run(exports)

});
