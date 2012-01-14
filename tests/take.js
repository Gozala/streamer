/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';


var Stream = require('../core').Stream

exports.Assert = require('./assert').Assert

exports['test take empty'] = function(test, complete) {
  var actual = Stream.empty.take(100)
  test(actual).to.be.empty().then(complete)
}

exports['test take more than have'] = function(test, complete) {
  var actual = Stream.of(1, 2, 3)
  test(actual.take(5)).to.be(1, 2, 3).then(complete)
}

exports['test take falls back to all'] = function(test, complete) {
  var actual = Stream.of(1, 2, 3)
  test(actual.take()).to.be(1, 2, 3).then(complete)
}

exports['test take may be given 0'] = function(test, complete) {
  var actual = Stream.of(1, 2, 3)
  test(actual.take(0)).to.be.empty().then(complete)
}

exports['test take on async stream'] = function(test, complete) {
  var actual = Stream.of(5, 4, 3, 2, 1).delay()
  test(actual.take(3)).to.be(5, 4, 3).then(complete)
}

exports['test take before error'] = function(test, complete) {
  var boom = Error('Boom!')
  var actual = Stream.of(3, 2, 1).append(Stream.error(boom)).delay()

  test(actual.take(3)).to.be(3, 2, 1).then(complete)
}

exports['test error on take'] = function(test, complete) {
  var boom = Error('Boom!')
  var actual = Stream.of(3, 2, 1).append(Stream.error(boom)).delay()

  test(actual.take(5)).to.have.elements(3, 2, 1).and.error(boom).then(complete)
}

if (module == require.main)
  require('test').run(exports)

});
