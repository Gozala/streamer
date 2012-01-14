/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var Stream = require('../core').Stream

exports.Assert = require('./assert').Assert
exports['test basic repeat'] = function(expect, complete) {
  var ones = Stream.repeat(1)
  expect(ones.take(5)).to.be(1, 1, 1, 1, 1).and.then(complete)
}

if (module == require.main)
  require('test').run(exports)

});
