/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';


var streamer = require('../core'), Stream = streamer.Stream,
    take = streamer.take, delay = streamer.delay, append = streamer.append

exports.Assert = require('./assert').Assert

exports['test take empty'] = function(expect, complete) {
  var actual = take(100, Stream.empty)

  expect(actual).to.be.empty().then(complete)
}

exports['test take.while on empty'] = function(expect, complete) {
  var called = 0
  var actual = take['while'](function(n) {
    called = called + 1
    return n <= 9
  }, Stream.empty)

  expect(actual).to.be.empty().then(function(assert) {
    assert.equal(called, 0, 'nothing to take')
    complete()
  })
}

exports['test take more than have'] = function(expect, complete) {
  var actual = Stream.of(1, 2, 3)

  expect(take(5, actual)).to.be(1, 2, 3).then(complete)
}

exports['test take falls back to all'] = function(expect, complete) {
  var actual = Stream.of(1, 2, 3)

  expect(take(Infinity, actual)).to.be(1, 2, 3).then(complete)
}

exports['test take may be given 0'] = function(expect, complete) {
  var actual = Stream.of(1, 2, 3)

  expect(take(0, actual)).to.be.empty().then(complete)
}

exports['test take.while'] = function(expect, complete) {
  var called = 0
  var actual = take['while'](function(n) {
    called = called + 1
    return n <= 9
  }, Stream.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12))

  expect(actual).to.be(1, 2, 3, 4, 5, 6, 7, 8, 9).then(function(assert) {
    assert.equal(called, 10, 'called until returned false')
    complete()
  })
}

exports['test take.while end'] = function(expect, complete) {
  var called = 0
  var actual = take['while'](function(n) {
    called = called + 1
    return n <= 9
  }, Stream.of(1, 2, 3, 4, 5, 6, 7))

  expect(actual).to.be(1, 2, 3, 4, 5, 6, 7).then(function(assert) {
    assert.equal(called, 7, 'called until returned false')
    complete()
  })
}

exports['test take on async stream'] = function(expect, complete) {
  var actual = delay(Stream.of(5, 4, 3, 2, 1))
  expect(take(3, actual)).to.be(5, 4, 3).then(complete)
}

exports['test take.while on async stream'] = function(expect, complete) {
  var called = 0
  var actual = take['while'](function(n) {
    called = called + 1
    return n <= 9
  }, delay(Stream.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)))

  expect(actual).to.be(1, 2, 3, 4, 5, 6, 7, 8, 9).then(function(assert) {
    assert.equal(called, 10, 'called until returned false')
    complete()
  })
}

exports['test take before error'] = function(expect, complete) {
  var boom = Error('Boom!')
  var actual = delay(append(Stream.of(3, 2, 1), Stream.error(boom)))

  expect(take(3, actual)).to.be(3, 2, 1).then(complete)
}

exports['test error propagation'] = function(expect, complete) {
  var boom = Error('Boom!')
  var actual = delay(append(Stream.of(3, 2, 1), Stream.error(boom)))

  expect(take(5, actual)).to.have.elements(3, 2, 1).and.error(boom).then(complete)
}

exports['test error propagation in take.while'] = function(expect, complete) {
  var called = 0, boom = Error('boom!')
  var actual = take['while'](function(n) {
    called = called + 1
    return n <= 9
  }, append.all(Stream.of(1, 2, 3, 4, 5), Stream.error(boom), Stream.of(6, 7)))

  expect(actual).to.have(1, 2, 3, 4, 5).and.error(boom).then(function(assert) {
    assert.equal(called, 5, 'called until error')
    complete()
  })
}

if (module == require.main)
  require('test').run(exports)

});
