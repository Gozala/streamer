/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../streamer.js'),
    filter = streamer.filter, list = streamer.list
var test = require('./utils.js').test

exports['test filter empty'] = function(assert, done) {
  var empty = list()
  var mapped = filter(empty, function onEach(element) {
    assert.fail('filterer was executed')
  })
  test(assert, done, mapped, [])
}

exports['test number filter'] = function(assert, done) {
  var numbers = list(1, 2, 3, 4)
  var evens = filter(numbers, function onElement(number) {
    return !(number % 2)
  })
  test(assert, done, evens, [2, 4])
}

exports['test filter with async stream'] = function(assert, done) {
  function stream(next, stop) {
    var x = 5
    setTimeout(function onTimeout() {
      if (!x) return stop()
      next(x--)
      setTimeout(onTimeout, 0)
    }, 0)
  }
  var odds = filter(stream, function(number) { return number % 2 })
  test(assert, done, odds, [ 5, 3, 1 ])
}

exports['test filter broken stream'] = function(assert, done) {
  function stream(next, stop) {
    var x = 3
    setTimeout(function onTimeout() {
      if (!x) return stop(new Error('Boom!'))
      next(x--)
      setTimeout(onTimeout, 0)
    }, 0)
  }
  var filtered = filter(stream, function(number) { return number % 2 })
  var expected = [ 3, 1 ]
  var actual = []
  filtered(function next(x) { actual.push(x) }, function stop(error) {
    assert.equal(error.message, 'Boom!', 'error propagated to filtered stream')
    assert.deepEqual(actual, expected, 'all values were yielded before error')
    done()
  })
}

if (module == require.main)
  require('test').run(exports);

})
