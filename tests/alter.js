/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';


var streamer = require('../core'),
    Stream = streamer.Stream, alter = streamer.alter, take = streamer.take

exports.Assert = require('./assert').Assert

exports['test substitution on empty'] = function(expect, complete) {
  var calls = 0, value
  var actual = alter(function(stream) {
    calls = calls + 1
    value = stream
    return stream
  }, Stream.empty)

  expect(actual).to.be.empty().then(function(assert) {
    assert.equal(value, null, 'empty stream resolves to null')
    assert.equal(calls, 1, 'stream was altered once only')
    complete()
  })
}

exports['test alters is lazy'] = function(expect, complete) {
  var calls = 0
  var actual = alter(function(stream) {
    calls = calls + 1
    return stream
  }, Stream.empty)

  expect(actual).to.be.empty().then(function(assert) {
    assert.equal(calls, 1, 'stream was altered once')
  })
  expect(actual).to.be.empty().then(function(assert) {
    assert.equal(calls, 1, 'stream is altered once')
    complete()
  })
}

exports['test substitution is lazy'] = function(expect, complete) {
  var calls = 0, source = Stream.of(1, 2, 3, 4)
  function power(n, stream) {
    return alter(function(stream) {
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
    assert.equal(calls, 4, 'alter is called on end as well')
    complete()
  })
}

exports['test substitute an end'] = function(expect, complete) {
  function append(a, b) {
    return alter(function(stream) {
      // If not an end then append `b` to a tail, otherwise substitute `null`
      // with `b`.
      return stream ? Stream(stream.head, append(stream.tail, b)) : b
    }, a)
  }
  var actual = append(Stream.of(1, 2, 3), Stream.of(4, 5, 6, 7))

  expect(actual).to.be(1, 2, 3, 4, 5, 6, 7).then(complete)
}

exports['test errors propagate'] = function(expect, complete) {
  var boom = Error('boom!'), source = Stream(1, Stream(2, Stream.error(boom)))
  var actual = alter(function edit(stream) {
    return stream && Stream(stream.head + 1, alter(edit, stream.tail))
  }, source)

  expect(actual).to.have(2, 3).and.error(boom).then(complete)
}

if (module == require.main)
  require('test').run(exports)

});

