/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true */

(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var hub = require('../streamer.js').hub
var test = require('./utils.js').test

function pipe(readers) {
  return function stream(next, stop) {
    readers.push({ next: next, stop: stop })
  }
}

function copy(source) {
  var buffer = [], reason;
  source(function onElement(element) {
    buffer.push(element)
  }, function onStop(error) {
    reason = error
  })
  return function stream(next, stop) {
    var index = 0, length = buffer.length
    while (index < length) next(buffer[index++])
    if (stop) stop(reason)
  }
}

exports['test hub with normal stop'] = function(assert, done) {
  var readers = [], copies = []
  var source = hub(pipe(readers)), stream = readers[0]

  stream.next(1)
  copies.push(copy(source))
  stream.next('a')
  stream.next('b')
  copies.push(copy(source))
  stream.next(2)
  stream.next('last')
  stream.stop()
  copies.push(copy(source))

  assert.equal(readers.length, 1, "stream was read only once")
  test(assert, Object, copies[0], [ 'a', 'b', 2, 'last'])
  test(assert, Object, copies[1], [ 2, 'last' ])
  test(assert, done, copies[2], [])
}

exports['test hub with error stop'] = function(assert, done) {
  var readers = [], copies = [], error = new Error('boom')
  var source = hub(pipe(readers)), stream = readers[0]

  stream.next(1)
  copies.push(copy(source))
  stream.next('a')
  stream.next('b')
  copies.push(copy(source))
  stream.next(2)
  stream.next('last')
  stream.stop(error)
  copies.push(copy(source))

  assert.equal(readers.length, 1, "stream was read only once")
  test(assert, Object, copies[0], [ 'a', 'b', 2, 'last'], error)
  test(assert, Object, copies[1], [ 2, 'last' ], error)
  test(assert, done, copies[2], [], error)
}
/*
exports['test number list'] = function(assert, done) {
  test(assert, done, list(1, 2, 3), [ 1, 2, 3 ])
}

exports['test mixed list'] = function(assert, done) {
  var object = {}, func = function() {}, exp = /foo/, error = new Error('Boom!')
  test(assert, done, list('a', 2, 'b', 4, object, func, exp, error),
       [ 'a', 2, 'b', 4, object, func, exp, error  ])
}
*/


if (module == require.main)
  require('test').run(exports);

})

