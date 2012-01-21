/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'), Stream = streamer.Stream,
    append = streamer.append, delay = streamer.delay, take = streamer.take,
    lazy = streamer.lazy

exports.Assert = require('./assert').Assert

exports['test lazy empty list'] = function(expect, complete) {
  var actual = lazy(Stream.empty)

  expect(actual).to.be.empty().then(complete)
}

exports['test number list'] = function(expect, complete) {
  var actual = lazy(Stream.of(1, 2, 3))

  expect(actual).to.be(1, 2, 3).then(complete)
}

exports['test caching in lazy'] = function(expect, complete) {
  var reads = 0, errors = 0, boom = Error('Boom!')
  var actual = lazy(Stream(1, function rest() {
    reads = reads + 1
    return Stream(2, function rest() {
      errors = errors + 1
      return Stream.error(boom)
    })
  }))

  expect(take(1, actual)).to.be(1).then(function(assert) {
    assert.equal(reads, 0, 'tail have no being accessed')
  })

  expect(take(2, actual)).to.be(1, 2).then(function(assert) {
    assert.equal(reads, 1, 'tail was accessed once')
  })

  expect(take(2, actual)).to.be(1, 2).then(function(assert) {
    assert.equal(reads, 1, 'tail was cached')
    assert.equal(errors, 0, 'error is not yielded yet')
  })

  expect(actual).to.have(1, 2).and.error(boom).then(function(assert) {
    assert.equal(reads, 1, 'tail was cached')
    assert.equal(errors, 1, 'error was yielded')
  })

  expect(actual).to.have(1, 2).and.error(boom).then(function(assert) {
    assert.equal(reads, 1, 'tail was cached')
    assert.equal(errors, 1, 'error was cached')
    complete()
  })
}

exports['test async but lazy'] = function(expect, complete) {
  var reads = 0, errors = 0, boom = Error('Boom'), turned = false
  var actual = lazy(delay(Stream(1, function rest() {
    reads = reads + 1
    return Stream(2, function rest() {
      errors = errors + 1
      return Stream.error(boom)
    })
  })))

  function turn() { turned = true }

  expect(take(1, actual)).to.have.items(1).and(turn).then(function(assert) {
    assert.ok(turned, 'was async')
    turned = false
  })

  expect(take(1, actual)).to.have.items(1).and(turn).then(function(assert) {
    assert.ok(!turned, 'head was cashed')
    assert.equal(reads, 0, 'tail has not being read yet')
    turned = false
  })

  expect(take(2, actual)).to.have.items(1, 2).and(turn).then(function(assert) {
    assert.ok(turned, 'items was yielded on next turn')
    assert.equal(reads, 1, 'tail was accessed once')
    turned = false
  })

  expect(take(2, actual)).to.have.items(1, 2).and(turn).then(function(assert) {
    assert.ok(!turned, 'read in the same turn')
    assert.equal(reads, 1, 'tail was cashed')
    assert.equal(errors, 0, 'error is not yielded yet')
    turned = false
  })

  expect(actual).to.have(1, 2).and.error(boom).and(turn).then(function(assert) {
    assert.ok(turned, 'read in the same turn')
    assert.equal(reads, 1, 'tail was cached')
    assert.equal(errors, 1, 'error was propagated')
    complete()
  })
}

if (module == require.main)
  require('test').run(exports)

});
