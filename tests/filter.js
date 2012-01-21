/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

'use strict';

var streamer = require('../core'), Stream = streamer.Stream,
    delay = streamer.delay, append = streamer.append, filter = streamer.filter

exports.Assert = require('./assert').Assert

exports['test filter empty'] = function(expect, complete) {
  var called = 0
  var actual = filter(function onEach(element) {
    called = called + 1
  }, Stream.empty)

  expect(actual).to.be.empty().and.then(function(assert) {
    assert.equal(called, 0, 'filter `f` was not executed')
    complete()
  })
}

exports['test filter numbers'] = function(expect, complete) {
  var called = 0
  var actual = filter(function(n) {
    called = called + 1
    return n % 2
  }, Stream.of(1, 2, 3, 4))

  expect(actual).to.be(1, 3).then(function(assert) {
    assert.equal(called, 4, 'filter `f` was called once per element')
    complete()
  })
}

exports['test filter async stream'] = function(expect, complete) {
  var called = 0
  var actual = filter(function(n) {
    called = called + 1
    return n % 2
  }, delay(Stream.of(5, 4, 3, 2, 1)))

  expect(actual).to.be(5, 3, 1).then(function(assert) {
    assert.equal(called, 5, 'predicate was called once per element')
    complete()
  })
}

exports['test errors propagate'] = function(expect, complete) {
  var boom = Error('Boom!')
  var actual = filter(function(n) {
    return n % 2
  }, delay(append(Stream.of(3, 2, 1), Stream.error(boom))))

  expect(actual).to.have.items(3, 1).and.error(boom).then(complete)
}

if (module == require.main)
  require('test').run(exports);

});
