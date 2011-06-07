/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../streamer.js'),
    map = streamer.map, list = streamer.list
var test = require('./utils.js').test

exports['test map empty'] = function(assert, done) {
  var empty = list()
  var mapped = map(empty, function onEach(element) {
    assert.fail('mapper was executed')
  })
  test(assert, done, mapped, [])
}

exports['test number map'] = function(assert, done) {
  var numbers = list(1, 2, 3, 4)
  var doubled = map(numbers, function onElement(number) { return number * 2 })
  test(assert, done, doubled, [2, 4, 6, 8])
}

exports['test map with async stream'] = function(assert, done) {
  function stream(next, stop) {
    var x = 5
    setTimeout(function onTimeout() {
      if (!x) return stop()
      next(x--)
      setTimeout(onTimeout, 0)
    }, 0)
  }
  var mapped = map(stream, function(x) { return x + 1 })
  test(assert, done, mapped, [ 6, 5, 4, 3, 2 ])
}

exports['test map broken stream'] = function(assert, done) {
  function stream(next, stop) {
    var x = 3
    setTimeout(function onTimeout() {
      if (!x) return stop(new Error('Boom!'))
      next(x--)
      setTimeout(onTimeout, 0)
    }, 0)
  }
  var mapped = map(stream, function(x) { return x * x })
  var expected = [ 9, 4, 1]
  var actual = []
  mapped(function next(x) { actual.push(x) }, function stop(error) {
    assert.equal(error.message, 'Boom!', 'error propagated to mapped stream')
    assert.deepEqual(actual, expected, 'all values were yielded before error')
    done()
  })
}

if (module == require.main)
  require('test').run(exports);

})
