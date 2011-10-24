/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core.js'),
    merge = streamer.merge, list = streamer.list, delay = streamer.delay,
    append = streamer.append
var test = require('./utils.js').test

exports['test merge stream of empty streams'] = function(assert, done) {
  test(assert, done, merge(list(list(), list())), [])
}

exports['test merge empty & non-empty'] = function(assert, done) {
  test(assert, done, merge(list(list(), list(1, 2), list())), [1, 2])
}

exports['test merge merged'] = function(assert, done) {
  var stream = merge(list(list(1, 2), list('a', 'b')))
  stream = merge(list(list('>'), stream, list()))
  test(assert, done, stream, ['>', 1, 'a', 2, 'b'])
}

exports['test merge sync & async streams'] = function(assert, done) {
  var async = delay(list(3, 2, 1))
  var actual = merge(list(async, list(), async, list('a', 'b')))
  test(assert, done, actual, [ 'a', 'b', 3, 3, 2, 2, 1, 1, ])
}

exports['test merge with broken stream'] = function(assert, done) {
  var boom = Error('Boom!!')
  function broken(next) { next(boom) }
  var async = delay(append(list(3, 2, 1), broken))

  var stream = merge(list(list('>'), async, list(1, 2), async))

  test(assert, done, stream, [ '>', 1, 2, 3, 3, 2, 2, 1, 1 ], boom)
}

exports['test merge async stream of streams'] = function(assert, done) {
  var async = delay(list(3, 2, 1))
  var actual = merge(append(delay(list(list(), async, list(1, 2), async)),
                     list(list('a', 'b')), list(list(), list('C', 'D'))))
  var expected = [ 3, 1, 2, 2, 1, 3, 'a', 'C', 'b', 'D', 2, 1 ]

  test(assert, done, actual, expected)
}

if (module == require.main)
  require('test').run(exports)

});
