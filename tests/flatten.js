/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core.js'),
    flatten = streamer.flatten, list = streamer.list, delay = streamer.delay,
    append = streamer.append
var test = require('./utils.js').test

exports['test flatten stream of empty streams'] = function(assert, done) {
  test(assert, done, flatten(list(list(), list())), [])
}

exports['test flatten empty & non-empty'] = function(assert, done) {
  test(assert, done, flatten(list(list(), list(1, 2), list())), [1, 2])
}

exports['test flatten flattened'] = function(assert, done) {
  var stream = flatten(list(list(1, 2), list('a', 'b')))
  stream = flatten(list(list('>'), stream, list()))
  test(assert, done, stream, ['>', 1, 2, 'a', 'b'])
}

exports['test flatten sync & async streams'] = function(assert, done) {
  var async = delay(list(3, 2, 1))
  var stream = flatten(list(async, list('|'), async, list('a', 'b'), list()))
  test(assert, done, stream, [ 3, 2, 1, '|', 3, 2, 1, 'a', 'b' ])
}

exports['test flatten with broken stream'] = function(assert, done) {
  var boom = Error('Boom!')
  var async = delay(append(list(3, 2, 1), function(next) { next(boom) }))

  var stream = flatten(list(list('>'), async, list(1, 2) ))
  test(assert, done, stream, [ '>', 3, 2, 1 ], boom)
}

exports['test flatten async stream of streams'] = function(assert, done) {
  var async = delay(list(3, 2, 1))
  var stream = delay(list(list(), list(1, 2), async, list('a', 'b'), async))
  var expected = [ 1, 2, 3, 2, 1, 'a', 'b', 3, 2, 1 ]
  var actual = flatten(stream)

  test(assert, done, actual, expected)
}

if (module == require.main)
  require('test').run(exports)

});
