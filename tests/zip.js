/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core.js'),
    zip = streamer.zip, list = streamer.list, delay = streamer.delay,
    append = streamer.append
var test = require('./utils.js').test

exports['test zip with empty'] = function(assert, done) {
  var empty = list()
  var numbers = list(1, 2, 3)
  var zipped = zip(empty, numbers)

  test(assert, done, zipped, [])
}

exports['test zip 2 lists'] = function(assert, done) {
  var numbers = list(1, 2, 3, 4)
  var letters = list('a', 'b', 'c', 'd')
  var zipped = zip(numbers, letters)
  test(assert, done, zipped, [ [ 1, 'a' ], [ 2, 'b' ], [ 3, 'c' ], [ 4, 'd' ] ])
}

exports['test zip sync stream with async stream'] = function(assert, done) {
  var a = delay(list(5, 4, 3, 2, 1))
  var b = list('a', 'b', 'c', 'd', 'e')
  var c = list('~', '@', '!', '#')

  var zipped = zip(a, b, c)

  test(assert, done, zipped, [
    [ 5, 'a', '~'  ],
    [ 4, 'b', '@' ],
    [ 3, 'c', '!' ],
    [ 2, 'd', '#' ]
  ])
}

exports['test zip with late error'] = function(assert, done) {
  var error = Error('boom')
  var stream = delay(append(list(3, 2, 1), function(next) { next(error) }))
  var letters = list('a', 'b', 'c')
  var zipped = zip(letters, stream)

  test(assert, done, zipped, [
    [ 'a', 3 ],
    [ 'b', 2 ],
    [ 'c', 1 ]
  ])
}

exports['test zip with early error'] = function(assert, done) {
  var error = Error('Boom!!')
  var stream = delay(append(list(3, 2, 1), function(next) { next(error) }))
  var letters = list('a', 'b', 'c', 'd')
  var actual = zip(stream, letters)
  var expected = [ [ 3, 'a' ], [ 2, 'b' ], [ 1, 'c' ] ]

  test(assert, done, actual, expected, error)
}

if (module == require.main)
  require('test').run(exports)

});
