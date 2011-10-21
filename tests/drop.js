/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core.js'),
    drop = streamer.drop, list = streamer.list, delay = streamer.delay,
    append = streamer.append
var test = require('./utils.js').test

exports['test drop empty'] = function(assert, done) {
  var empty = list()
  test(assert, done, drop(2, empty), [])
}

exports['test drop on sync stream'] = function(assert, done) {
  var numbers = list(1, 2, 3, 4)
  test(assert, done, drop(3, numbers), [ 4 ])
}


exports['test drop more than have'] = function(assert, done) {
  var numbers = list(1, 2, 3, 4)
  test(assert, done, drop(5, numbers), [])
}


exports['test drop of async stream'] = function(assert, done) {
  var stream = delay(list(5, 4, 3, 2, 1))
  test(assert, done, drop(2, stream), [ 3, 2, 1 ])
}

exports['test drop on stream with error'] = function(assert, done) {
  var error = Error('Boom')
  var stream = delay(append(list(4, 3, 2, 1), function(next) { next(error) }))

  test(assert, done, drop(2, stream), [ 2, 1 ], error)
}

exports['test drop on stream with error in head'] = function(assert, done) {
  var error = Error('Boom!')
  var stream = delay(append(function(next) { next(error) }, list(3, 2, 1)))

  test(assert, done, drop(2, stream), [], error)
}

if (module == require.main)
  require('test').run(exports)

});
