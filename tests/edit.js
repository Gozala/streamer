/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';


var streamer = require('../core'),
    Stream = streamer.Stream, edit = streamer.edit, take = streamer.take

exports.Assert = require('./assert').Assert

exports['test revice does nothing on empty'] = function(expect, complete) {
  var calls = 0
  var actual = edit(function(stream) {
    calls = calls + 1
    return stream
  }, Stream.empty)

  expect(actual).to.be.empty().then(function(assert) {
    assert.equal(calls, 0, 'stream was altered once only')
    complete()
  })
}

exports['test substitution is lazy'] = function(expect, complete) {
  var calls = 0, source = Stream.of(1, 2, 3, 4)
  function power(n, stream) {
    return edit(function(stream) {
      calls = calls + 1
      // If not an end substitute head and tail with power of `n`. Otherwise
      // return an end.
      return stream && Stream(Math.pow(stream.head, n), power(n, stream.tail))
    }, stream)
  }

  var actual = power(2, source)
  expect(take(1, actual)).to.be(1).then(function(assert) {
    assert.equal(calls, 1, 'alter is lazy')
    calls = 0
  })
  expect(actual).to.be(1, 4, 9, 16).then(function(assert) {
    assert.equal(calls, 3, 'alter is called on every element except end')
    complete()
  })
}

exports['test errors propagate'] = function(expect, complete) {
  var boom = Error('boom!'), source = Stream(1, Stream(2, Stream.error(boom)))
  var actual = edit(function fn(stream) {
    return stream && Stream(stream.head + 1, edit(fn, stream.tail))
  }, source)

  expect(actual).to.have(2, 3).and.error(boom).then(complete)
}

if (module == require.main)
  require('test').run(exports)

});
