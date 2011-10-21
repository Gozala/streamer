/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core.js'),
    head = streamer.head, list = streamer.list, empty = streamer.empty,
    delay = streamer.delay, append = streamer.append
var test = require('./utils.js').test

exports['test head empty'] = function(assert, done) {
  test(assert, done, head(empty), [])
}

exports['test head default to 1'] = function(assert, done) {
  var numbers = list(1, 2, 3, 4)
  test(assert, done, head(numbers), [1])
}


exports['test head of async stream'] = function(assert, done) {
  var stream = delay(list(5, 4, 3, 3, 1))
  test(assert, done, head(stream), [ 5 ])
}

exports['test head before stream error'] = function(assert, done) {
  var stream = delay(append(list(3, 2), function broken(next) {
    next(Error('Boom!'))
  }))

  test(assert, done, head(stream), [ 3 ])
}

exports['test head on broken stream'] = function(assert, done) {
  var error = Error('Boom!')
   var stream = delay(function broken(next) {
    next(error)
  })

  test(assert, done, head(stream), [], error)
}

if (module == require.main)
  require('test').run(exports)

});
