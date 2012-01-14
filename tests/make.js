/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var Stream = require('../core').Stream

exports.Assert = require('./assert').Assert

exports['test Stream.empty']  = function(expect, complete) {
  expect(Stream.empty).to.be.empty().and.then(complete)
}

exports['test Stream.of'] = function(expect, complete) {
  expect(Stream.of(1, 2, 3, 4)).to.be(1, 2, 3, 4).and.then(complete)
}

exports['test empty stream via Stream.of'] = function(expect, complete) {
  expect(Stream.of()).to.be.empty().then(complete)
}

exports['test empty stream via Stream.from'] = function(expect, complete) {
  expect(Stream.from('')).to.be.empty().then(complete)
}

exports['test Stream.from string'] = function(expect, complete) {
  expect(Stream.from('hello')).to.be('h', 'e', 'l', 'l', 'o').then(complete)
}

exports['test Stream.from array'] = function(expect, complete) {
  expect(Stream.from([ 1, 2, 'a', 'b', 3 ])).to.be(1, 2, 'a', 'b', 3).
    and.then(complete)
}

exports['test Stream.from arguments'] = function(expect, complete) {
  (function() {
    expect(Stream.from(arguments)).to.be(1, 2, 3, 4).and.then(complete)
  })(1, 2, 3, 4)
}


if (module == require.main)
  require('test').run(exports)

});
