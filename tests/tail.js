/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core.js'),
    tail = streamer.tail, list = streamer.list, delay = streamer.delay,
    append = streamer.append
var test = require('./utils.js').test

exports['test tail empty'] = function(assert, done) {
  var empty = list()
  test(assert, done, tail(empty), [])
}

exports['test tail on sync stream'] = function(assert, done) {
  var numbers = list(1, 2, 3, 4)
  test(assert, done, tail(numbers), [ 2, 3, 4 ])
}

exports['test tail of async stream'] = function(assert, done) {
  var stream = delay(list(5, 4, 3, 2, 1))
  test(assert, done, tail(stream), [ 4, 3, 2, 1 ])
}

exports['test stream with error in tail'] = function(assert, done) {
  var error = Error('Boom')
  var stream = delay(append(list(3, 2, 1), function(next) { next(error) }))

  test(assert, done, tail(stream), [ 2, 1 ], error)
}

exports['test stream with error before tail'] = function(assert, done) {
  var error = Error('Boom!')
  var stream = delay(append(function(next) { next(error) }, list(3, 2, 1)))

  test(assert, done, tail(stream), [], error)
}

if (module == require.main)
  require('test').run(exports)

});
