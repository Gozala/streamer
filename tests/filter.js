/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core.js'),
    filter = streamer.filter, list = streamer.list, on = streamer.on,
    delay = streamer.delay, append = streamer.append
var test = require('./utils.js').test

exports['test filter empty'] = function(assert, done) {
  var empty = list()
  var filtered = filter(function onEach(element) {
    assert.fail('filterer was executed')
  }, empty)
  test(assert, done, filtered, [])
}

exports['test number filter'] = function(assert, done) {
  var numbers = list(1, 2, 3, 4)
  var evens = filter(function onElement(number) {
    return !(number % 2)
  }, numbers)
  test(assert, done, evens, [2, 4])
}

exports['test filter with async stream'] = function(assert, done) {
  var stream = delay(list(5, 4, 3, 2, 1))
  var odds = filter(function(number) { return number % 2 }, stream)
  test(assert, done, odds, [ 5, 3, 1 ])
}

exports['test filter broken stream'] = function(assert, done) {
  var error = Error('Boom!')
  var stream = delay(append(list(3, 2, 1), function(next) {
    next(error)
  }))
  var filtered = filter(function(number) { return number % 2 }, stream)
  var expected = [ 3, 1 ]
  test(assert, done, filtered, expected, error)
}

if (module == require.main)
  require('test').run(exports);

});
