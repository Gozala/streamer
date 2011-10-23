/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'),
    mix = streamer.mix, list = streamer.list, delay = streamer.delay,
    append = streamer.append
var test = require('./utils').test

exports['test mix empty streams'] = function(assert, done) {
  test(assert, done, mix(list(), list()), [])
}

exports['test mix empty'] = function(assert, done) {
  test(assert, done, mix(list(1, 2), list()), [1, 2])
}

exports['test mix to empty'] = function(assert, done) {
  test(assert, done, mix(list(), list(3, 4)), [3, 4])
}

exports['test mix many streams'] = function(assert, done) {
  var stream = mix(list(1, 2), list(), list('a', 'b'), list())
  test(assert, done, stream, [ 1, 'a', 2, 'b'])
}

exports['test mix sync & async streams'] = function(assert, done) {
  var async = delay(list(3, 2, 1))
  var actual = mix(async, list(), async, list('a', 'b'))
  test(assert, done, actual, [ 'a', 'b', 3, 3, 2, 2, 1, 1, ])
}

exports['test mix & remix'] = function(assert, done) {
  var async = delay(list(3, 2, 1))
  var stream = mix(async, list('a', 'b'))
  var actual = mix(stream, list('||'), stream)
  var expected = [ 'a', '||', 'b', 'a', 'b', 3, 3, 2, 2, 1, 1 ]

  test(assert, done, actual, expected)
}

exports['test map broken stream'] = function(assert, done) {
  var boom = Error('Boom!!')
  function broken(next) { next(boom) }
  var async = delay(mix(list(3, 2, 1), broken))

  var stream = mix(list('>'), async, list(1, 2), async)

  test(assert, done, stream, [ '>', 1, 2, 3, 3 ], boom)
}

if (module == require.main)
  require('test').run(exports);

});
