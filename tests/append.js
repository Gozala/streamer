/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'),
    append = streamer.append, list = streamer.list, delay = streamer.delay
var test = require('./utils').test

exports['test append empty streams'] = function(assert, done) {
  test(assert, done, append(list(), list()), [])
}

exports['test append empty'] = function(assert, done) {
  test(assert, done, append(list(1, 2), list()), [1, 2])
}

exports['test append to empty'] = function(assert, done) {
  test(assert, done, append(list(), list(3, 4)), [3, 4])
}

exports['test append many streams'] = function(assert, done) {
  var stream = append(list(1, 2), list(), list('a', 'b'), list())
  test(assert, done, stream, [1, 2, 'a', 'b'])
}

exports['test append sync & async streams'] = function(assert, done) {
  var async = delay(list(3, 2, 1))
  var stream = append(async, list(), async, list('a', 'b'))
  test(assert, done, stream, [ 3, 2, 1, 3, 2, 1, 'a', 'b' ])
}

exports['test append & reappend'] = function(assert, done) {
  var async = delay(list(3, 2, 1))
  var stream = append(async, list('a', 'b'))
  stream = append(stream, list('||'), stream)
  test(assert, done, stream, [ 3, 2, 1, 'a', 'b', '||', 3, 2, 1, 'a', 'b' ])
}

exports['test map broken stream'] = function(assert, done) {
  var boom = Error('Boom!!')
  function broken(next) { next(boom) }
  var async = delay(append(list(3, 2, 1), broken))

  var stream = append(list('>'), async, list(1, 2), async)

  test(assert, done, stream, [ '>', 3, 2, 1 ], boom)
}

if (module == require.main)
  require('test').run(exports);

});
