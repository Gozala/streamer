/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var Stream = require('../core').Stream

exports.Assert = require('./assert').Assert

exports['test lazy empty list'] = function(test, complete) {
  test(Stream.empty.lazy()).to.be.empty().then(complete)
}

exports['test number list'] = function(test, complete) {
  var actual = Stream.of(1, 2, 3).lazy()

  test(actual).to.be(1, 2, 3).then(complete)
}

exports['test caching in lazy'] = function(test, complete) {
  var reads = 0, errors = 0, boom = Error('Boom')
  var actual = Stream(1, function() {
    reads = reads + 1
    return Stream(2, function() {
      errors = errors + 1
      return Stream.error(boom)
    })
  }).lazy()

  test(actual.take(1)).to.be(1).and.then(function() {
    test.assert.equal(reads, 0, 'tail have no being accessed')
  })

  test(actual.take(2)).to.be(1, 2).and.then(function() {
    test.assert.equal(reads, 1, 'tail was accessed once')
  })

  test(actual.take(2)).to.be(1, 2).and.then(function() {
    test.assert.equal(reads, 1, 'tail was cached')
    test.assert.equal(errors, 0, 'error is not yielded yet')
  })

  test(actual).to.have.elements(1, 2).and.error(boom).and.then(function() {
    test.assert.equal(reads, 1, 'tail was cached')
    test.assert.equal(errors, 1, 'error was yielded')
  })

  test(actual).to.have.elements(1, 2).and.error(boom).and.then(function() {
    test.assert.equal(reads, 1, 'tail was cached')
    test.assert.equal(errors, 1, 'error was cached')
    complete()
  })
}

exports['test async but lazy'] = function(test, complete) {
  var reads = 0, errors = 0, boom = Error('Boom'), turned = false
  var actual = Stream(1, function() {
    reads = reads + 1
    return Stream(2, function() {
      errors = errors + 1
      return Stream.error(boom)
    })
  }).delay().lazy()

  function turn() { turned = true }

  test(actual.take(1)).to.have.elements(1).and(turn).then(function() {
    test.assert.ok(turned, 'was async')
    turned = false
  })

  test(actual.take(1)).to.have.elements(1).and(turn).then(function() {
    test.assert.ok(!turned, 'head was cashed')
    test.assert.equal(reads, 0, 'tail has not being read yet')
    turned = false
  })

  test(actual.take(2)).to.have.elements(1, 2).and(turn).then(function() {
    test.assert.ok(turned, 'elements was yielded on next turn')
    test.assert.equal(reads, 1, 'tail was accessed once')
    turned = false
  })

  test(actual.take(2)).to.have.elements(1, 2).and(turn).then(function() {
    test.assert.ok(!turned, 'read in the same turn')
    test.assert.equal(reads, 1, 'tail was cashed')
    test.assert.equal(errors, 0, 'error is not yielded yet')
    turned = false
  })

  test(actual).to.have.elements(1, 2).and.error(boom).and(turn).then(function() {
    test.assert.ok(turned, 'read in the same turn')
    test.assert.equal(reads, 1, 'tail was cached')
    test.assert.equal(errors, 1, 'error was propagated')
    complete()
  })
}

if (module == require.main)
  require('test').run(exports)

});
