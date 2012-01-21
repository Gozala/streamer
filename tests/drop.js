/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'), Stream = streamer.Stream,
    append = streamer.append, delay = streamer.delay, drop = streamer.drop

exports.Assert = require('./assert').Assert

exports['test drop empty'] = function(expect, complete) {
  var actual = drop(100, Stream.empty)
  expect(actual).to.be.empty().then(complete)
}

exports['test take.while on empty'] = function(expect, complete) {
  var called = 0
  var actual = drop['while'](function(n) {
    called = called + 1
    return n <= 9
  }, Stream.empty)

  expect(actual).to.be.empty().then(function(assert) {
    assert.equal(called, 0, 'nothing to take')
    complete()
  })
}

exports['test drop on sync stream'] = function(expect, complete) {
  var actual = drop(3, Stream.of(1, 2, 3, 4))

  expect(actual).to.be(4).then(complete)
}

exports['test drop falls back to 1'] = function(expect, complete) {
  var actual = drop(Infinity, Stream.of(1, 2, 3, 4))

  expect(actual).to.be.empty().then(complete)
}

exports['test drop can take 0'] = function(expect, complete) {
  var actual = drop(0, Stream.of(1, 2, 3, 4))

  expect(actual).to.be(1, 2, 3, 4).then(complete)
}

exports['test drop.while'] = function(expect, complete) {
  var called = 0
  var actual = drop['while'](function(n) {
    called = called + 1
    return n <= 9
  }, Stream.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12))

  expect(actual).to.be(10, 11, 12).then(function(assert) {
    assert.equal(called, 10, 'called until returned false')
    complete()
  })
}

exports['test drop.while end'] = function(expect, complete) {
  var called = 0
  var actual = drop['while'](function(n) {
    called = called + 1
    return n <= 9
  }, Stream.of(1, 2, 3, 4, 5, 6, 7))

  expect(actual).to.be.empty().then(function(assert) {
    assert.equal(called, 7, 'called until returned false')
    complete()
  })
}

exports['test drop more than have'] = function(expect, complete) {
  var actual = drop(5, Stream.of(1, 2, 3, 4))

  expect(actual).to.be.empty().then(complete)
}

exports['test drop of async stream'] = function(expect, complete) {
  var actual = drop(2, delay(Stream.of(5, 4, 3, 2, 1)))

  expect(actual).to.be(3, 2, 1).then(complete)
}

exports['test drop.while on async stream'] = function(expect, complete) {
  var called = 0
  var actual = drop['while'](function(n) {
    called = called + 1
    return n <= 9
  }, delay(Stream.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)))

  expect(actual).to.be(10, 11, 12).then(function(assert) {
    assert.equal(called, 10, 'called until returned false')
    complete()
  })
}

exports['test drop on stream with error'] = function(expect, complete) {
  var boom = Error('Boom!')
  var actual = drop(2, delay(append(Stream.of(4, 3, 2, 1), Stream.error(boom))))

  expect(actual).to.have.elements(2, 1).and.error(boom).then(complete)
}

exports['test drop on stream with error in head'] = function(expect, complete) {
  var boom = Error('Boom!')
  var actual = drop(2, delay(append(Stream.error(boom), Stream.of(4, 3, 2, 1))))

  expect(actual).to.have.elements().and.error(boom).then(complete)
}

exports['test error propagation in drop.while'] = function(expect, complete) {
  var called = 0, boom = Error('boom!')
  var actual = drop['while'](function(n) {
    called = called + 1
    return n <= 3
  }, append.all(Stream.of(1, 2, 3, 4, 5), Stream.error(boom), Stream.of(6, 7)))

  expect(actual).to.have(4, 5).and.error(boom).then(function(assert) {
    assert.equal(called, 4, 'called until error')
    complete()
  })
}

if (module == require.main)
  require('test').run(exports)

});
