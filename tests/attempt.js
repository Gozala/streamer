/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'), Stream = streamer.Stream,
    take = streamer.take, delay = streamer.delay, defer = streamer.defer,
    append = streamer.append, attempt = streamer.attempt

exports.Assert = require('./assert').Assert

exports['test attempt empty stream'] = function(expect, complete) {
  var called = 0
  var actual = attempt(function final() {
    called = called + 1
  }, Stream.empty)

  expect(actual).to.be.empty().then(function(assert) {
    assert.equal(called, 1, 'attemptr was called')
    complete()
  })
}

exports['test attempt with a non-empty stream'] = function(expect, complete) {
  var actual = attempt(function() {
    return Stream.of(3, 4)
  }, Stream.of(1, 2))

  expect(actual).to.be(1, 2, 3, 4).then(complete)
}

exports['test error recovery'] = function(expect, complete) {
  var boom = Error('Boom!')
  var actual = attempt(function catcher(error) {
    return Stream.of('catch', error)
  }, function finalizer(error) {
    return Stream.of('finally', error)
  }, append(Stream.of(1, 2), Stream.error(boom)))

  expect(actual).to.be(1, 2, 'catch', boom, 'finally', undefined).then(complete)
}

exports['test errors can be ignored'] = function(expect, complete) {
  var called = 0
  var boom = Error('Boom!'), brax = Error('brax')
  var actual = attempt(function cacher(error) {
    return Stream.error(brax)
  }, function finilizer(error) {
    return Stream.of('finally', error)
  }, append(Stream.from('hi'), Stream.error(boom)))

  expect(actual).to.be('h', 'i', 'finally', brax).then(complete)
}

if (module == require.main)
  require('test').run(exports);

});


