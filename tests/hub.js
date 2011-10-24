/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'),
    hub = streamer.hub, delay = streamer.delay, list = streamer.list,
    append = streamer.append, take = streamer.take
var test = require('./utils').test

exports['test hub with sync steam'] = function(assert, done) {
  var source = hub(list(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14))

  var s1_3 = take(3, source)
  var s4_8 = take(5, source)
  var s9_$ = source

  test(assert, Object, s1_3, [ 1, 2, 3 ])
  test(assert, Object, s4_8, [ 4, 5, 6, 7, 8 ])
  test(assert, done, s9_$, [ 9, 10, 11, 12, 13, 14 ])
}

exports['test hub with async stream'] = function(assert, done) {
  var source = hub(delay(list(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14)))

  var steps = [
    function first_run() {
      test(assert, next, take(3, source), [ 1, 2, 3 ])
    },
    function take_0_3() {
      test(assert, next, take(5, source), [ 4, 5, 6, 7, 8 ])
      test(assert, next, take(8, source), [ 4, 5, 6, 7, 8, 9, 10, 11 ])
    },
    function take_4_8() {
      test(assert, next, source, [ 9, 10, 11, 12, 13, 14 ])
    },
    function take_4_11() {
      test(assert, next, source, [ 12, 13, 14 ])
    },
    function take_8_$() {
      test(assert, next, source, [])
    },
    function take_11_$() {
      test(assert, next, source, [])
    },
    function take_$$() {},
    function take_$$() { done() }
  ]

  function next() { steps.shift()() }
  next()
}


exports['test hub with broken stream'] = function(assert, done) {
  var error = Error('boom!')
  var source = hub(append(delay(list(1, 2, 3, 4, 5, 6, 7, 8)), function(next) {
    next(error)
  }))

  var steps = [
    function first_run() {
      test(assert, next, take(4, source), [ 1, 2, 3, 4 ])
      test(assert, next, source, [ 1, 2, 3, 4, 5, 6, 7, 8 ], error)
    },
    function take_0_4() {
      test(assert, next, take(5, source), [ 5, 6, 7, 8 ], error)
      test(assert, next, take(3, source), [ 5, 6, 7 ])
    },
    function take_5_7() {
      test(assert, next, take(1, source), [ 8 ])
      test(assert, next, take(2, source), [ 8 ], error)
    },
    function take_7_8() {},
    function take_1_$e() {},
    function take_4_8e() { test(assert, next, source, [], error) },
    function take_7_8e() {},
    function take_$_$e() { done() }
  ]

  function next() { steps.shift()() }
  next()
}

if (module == require.main)
  require('test').run(exports)

});
