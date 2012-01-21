/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';


var streamer = require('../core'), Stream = streamer.Stream,
    take = streamer.take, delay = streamer.delay, append = streamer.append,
    capture = streamer.capture

exports.Assert = require('./assert').Assert

exports['test substitution on empty'] = function(expect, complete) {
  var calls = 0, value
  var actual = capture(function(error) {
    calls = calls + 1
  }, Stream.empty)

  expect(actual).to.be.empty().then(function(assert) {
    assert.equal(calls, 0, 'handler was not called as there was no error')
    complete()
  })
}

exports['test capture error every time'] = function(expect, complete) {
  var boom = Error('Boom!!')
  var calls = 0, reason
  var actual = capture(function(error) {
    calls = calls + 1
    reason = error
  }, Stream.error(boom))

  expect(actual).to.be.empty().then(function(assert) {
    assert.equal(calls, 1, 'error captured once')
    assert.equal(reason, boom, 'captured raised error')
  })

  expect(actual).to.be.empty().then(function(assert) {
    assert.equal(calls, 2, 'error captured on each read')
    complete()
  })
}

exports['test substitution is lazy'] = function(expect, complete) {
  var calls = 0
  var actual = capture(function(error) {
    calls = calls + 1
    return Stream.of(5, 6, 7)
  }, append(Stream.of(1, 2, 3, 4), Stream.error('boom!')))

  expect(take(1, actual)).to.be(1).then(function(assert) {
    assert.equal(calls, 0, 'no errors were raised')
  })
  expect(actual).to.be(1, 2, 3, 4, 5, 6, 7).then(function(assert) {
    assert.equal(calls, 1, 'error was captured once')
    complete()
  })
}

exports['test ignore error'] = function(expect, complete) {
  var boom = Error('Boom!')
  var actual = capture(function() {
    return null
  }, append(Stream.of(1, 2, 3), Stream.error(boom)))

  expect(actual).to.be(1, 2, 3).then(complete)
}

exports['test rethrow error'] = function(expect, complete) {
  var boom = Error('Boom!'), brax = Error('BraaXxxx')
  var actual = capture(function() {
    return Stream.error(brax)
  }, append(Stream.of(1, 2, 3), Stream.error(boom)))

  expect(actual).to.have(1, 2, 3).and.error(brax).then(complete)
}

if (module == require.main)
  require('test').run(exports)

});
