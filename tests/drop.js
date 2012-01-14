/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var Stream = require('../core').Stream

exports.Assert = require('./assert').Assert

exports['test drop empty'] = function(test, complete) {
  var actual = Stream.empty.drop(100)
  test(actual).to.be.empty().then(complete)
}

exports['test drop on sync stream'] = function(test, complete) {
  var actual = Stream.of(1, 2, 3, 4)
  test(actual.drop(3)).to.be(4).then(complete)
}

exports['test drop falls back to 1'] = function(test, complete) {
  var actual = Stream.of(1, 2, 3, 4)
  test(actual.drop()).to.be(2, 3, 4).then(complete)
}

exports['test drop can take 0'] = function(test, complete) {
  var actual = Stream.of(1, 2, 3, 4)
  test(actual.drop(0)).to.be(1, 2, 3, 4).then(complete)
}

exports['test drop more than have'] = function(test, complete) {
  var actual = Stream.of(1, 2, 3, 4)
  test(actual.drop(5)).to.be.empty().then(complete)
}

exports['test drop of async stream'] = function(test, complete) {
  var actual = Stream.of(5, 4, 3, 2, 1).delay()
  test(actual.drop(2)).to.be(3, 2, 1).then(complete)
}

exports['test drop on stream with error'] = function(test, complete) {
  var boom = Error('Boom!')
  var actual = Stream.of(4, 3, 2, 1).append(Stream.error(boom)).delay()

  test(actual.drop(2)).to.have.elements(2, 1).and.error(boom).then(complete)
}

exports['test drop on stream with error in head'] = function(test, complete) {
  var boom = Error('Boom!')
  var actual = Stream.error(boom).append(Stream.of(4, 3, 2, 1)).delay()

  test(actual.drop(2)).to.have.elements().and.error(boom).then(complete)
}

if (module == require.main)
  require('test').run(exports)

});
