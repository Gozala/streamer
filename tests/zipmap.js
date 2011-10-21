/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core.js'),
    map = streamer.map, list = streamer.list, append = streamer.append,
    delay = streamer.delay
var test = require('./utils.js').test

exports['test map with empty'] = function(assert, done) {
  var empty = list()
  var numbers = list(1, 2, 3)
  var actual = map(function(a, b) { return a + b }, empty, numbers)

  test(assert, done, actual, [])
}

exports['test map same length streams'] = function(assert, done) {
  var numbers = list(1, 2, 3, 4)
  var letters = list('a', 'b', 'c', 'd')
  var actual = map(function(a, b) { return a + b }, numbers, letters)
  var expected = [ '1a', '2b', '3c', '4d' ]
  test(assert, done, actual, expected)
}

exports['test map sync & async stream'] = function(assert, done) {
  var a = delay(list(5, 4, 3, 2, 1))
  var b = list('a', 'b', 'c', 'd', 'e')
  var c = list('~', '@', '!', '#')

  var actual = map(Array, a, b, c)

  test(assert, done, actual, [
    [ 5, 'a', '~'  ],
    [ 4, 'b', '@' ],
    [ 3, 'c', '!' ],
    [ 2, 'd', '#' ]
  ])
}

exports['test map with late error'] = function(assert, done) {
  var error = Error('boom')
  var stream = delay(append(list(3, 2, 1), function(next) { next(error) }))
  var letters = list('a', 'b', 'c')
  var actual = map(function(a, b) { return a + b }, letters, stream)

  test(assert, done, actual, [ 'a3', 'b2', 'c1' ])
}

exports['test map with early error'] = function(assert, done) {
  var error = Error('Boom!!')
  var stream = delay(append(list(3, 2, 1), function(next) { next(error) }))
  var letters = list('a', 'b', 'c', 'd')
  var actual = map(Array, stream, letters)
  var expected = [ [ 3, 'a' ], [ 2, 'b' ], [ 1, 'c' ] ]

  test(assert, done, actual, expected, error)
}

if (module == require.main)
  require('test').run(exports)

});
