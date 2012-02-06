/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'), Stream = streamer.Stream,
    map = streamer.map, take = streamer.take, delay = streamer.delay,
    append = streamer.append, reduce = streamer.reduce

exports.Assert = require('./assert').Assert
exports['test reduce on empty'] = function(expect, complete) {
  var called = 0
  var actual = reduce(function(item) {
    expect.test.fail('reducer was called on empty stream')
  }, Stream.empty, null)

  expect(actual).to.be(null).then(complete)
}

exports['test reduce to sum'] = function(expect, complete) {
  var actual = reduce(function(x, y) {
    return x + y
  }, Stream.of(1, 2, 3, 4), 0)

  expect(actual).to.be(10).then(complete)
}

exports['test reduce async stream'] = function(expect, complete) {
  var actual = reduce(function(x, y) {
    return x + y
  }, delay(Stream.of(5, 4, 3, 2, 1)), 3)

  expect(actual).to.be(18).then(complete)
}

exports['test reduce broken stream'] = function(expect, complete) {
  var boom = Error('Boom!')
  var actual = reduce(function(x, y) {
    return x + y
  }, append(Stream.of(3, 2, 1), Stream.error(boom)), 0)

  expect(actual).to.have.an.error(boom).then(complete)
}

if (module == require.main)
  require('test').run(exports)

});
