/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core.js'),
    take = streamer.take, list = streamer.list, empty = streamer.empty,
    delay = streamer.delay, append = streamer.append
var test = require('./utils.js').test

exports['test take empty'] = function(assert, done) {
  test(assert, done, take(1, empty), [])
}

exports['test take more than have'] = function(assert, done) {
  var numbers = list(1, 2, 3)
  test(assert, done, take(5, numbers), [1, 2, 3])
}

exports['test take on async stream'] = function(assert, done) {
  var stream = delay(list(5, 4, 3, 3, 1))
  test(assert, done, take(3, stream), [ 5, 4, 3 ])
}

exports['test take before error'] = function(assert, done) {
  var stream = delay(append(list(3, 2, 1), function broken(next) {
    next(Error('Boom!'))
  }))

  test(assert, done, take(3, stream), [ 3, 2, 1 ])
}

exports['test erro on take'] = function(assert, done) {
  var error = Error('Boom!')
   var stream = delay(append(list(3, 2, 1), function broken(next) {
    next(error)
  }))

  test(assert, done, take(5, stream), [3, 2, 1], error)
}

if (module == require.main)
  require('test').run(exports)

});
