/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'),
    map = streamer.map, list = streamer.list, append = streamer.append,
    on = streamer.on, delay = streamer.delay
var test = require('./utils').test

exports['test map empty'] = function(assert, done) {
  var empty = list()
  var mapped = map(function onEach(element) {
    assert.fail('mapper was executed')
  }, empty)
  test(assert, done, mapped, [])
}

exports['test number map'] = function(assert, done) {
  var numbers = list(1, 2, 3, 4)
  var doubled = map(function onElement(number) { return number * 2 }, numbers)
  test(assert, done, doubled, [2, 4, 6, 8])
}

exports['test map with async stream'] = function(assert, done) {
  var stream = delay(list(5, 4, 3, 2, 1))
  var mapped = map(function(x) { return x + 1 }, stream)
  test(assert, done, mapped, [ 6, 5, 4, 3, 2 ])
}

exports['test map broken stream'] = function(assert, done) {
  var error = Error('Boom!')
  var stream = delay(append(list(3, 2, 1), function(next) {
    next(error)
  }))
  var mapped = map(function(x) { return x * x }, stream)
  var expected = [ 9, 4, 1]

  test(assert, done, mapped, expected, error);
}

if (module == require.main)
  require('test').run(exports)

});
