/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: false undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'), Stream = streamer.Stream,
    take = streamer.take, delay = streamer.delay, defer = streamer.defer,
    append = streamer.append, finalize = streamer.finalize

exports.Assert = require('./assert').Assert

exports['test finalize empty stream'] = function(expect, complete) {
  var called = 0
  var actual = finalize(function final() {
    called = called + 1
  }, Stream.empty)

  expect(actual).to.be.empty().then(function(assert) {
    assert.equal(called, 1, 'finalizer was called')
    complete()
  })
}

exports['test finalize empty with more items'] = function(expect, complete) {
  var actual = finalize(function() {
    return Stream.of(3, 4)
  }, Stream.of(1, 2))

  expect(actual).to.be(1, 2, 3, 4).then(complete)
}

exports['test async finilize'] = function(expect, complete) {
  var finilized = false
  var actual = finalize(function() {
    var deferred = defer()
    setTimeout(function() {
      finilized = true
      deferred.resolve(null)
    }, 10, null)
    return deferred.promise
  }, Stream.from('hello'))

  expect(actual).to.be('h', 'e', 'l', 'l', 'o').then(function(assert) {
    assert.ok(finilized, 'finalizer completed async')
    complete()
  })
}

exports['test errors propagate'] = function(expect, complete) {
  var boom = Error('Boom!')
  var actual = finalize(function() {
    return Stream.of(3, 4)
  }, append(Stream.of(1, 2), Stream.error(boom)))

  expect(actual).to.have.items(1, 2, 3, 4).and.error(boom).then(complete)
}

exports['test finilazed may introduce errors'] = function(expect, complete) {
  var boom = Error('Boom!'), brax = Error('BraxXXx!!')
  var actual = finalize(function() {
    return append(Stream.of('!'), Stream.error(brax))
  }, append(Stream.from('hi'), Stream.error(boom)))

  expect(actual).to.be('h', 'i', '!').with.error(brax).then(complete)
}

if (module == require.main)
  require('test').run(exports);

});

