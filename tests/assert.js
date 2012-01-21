/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false */
/*global define: true */

!(typeof(define) !== "function" ? function($){ $(typeof(require) !== 'function' ? (function() { throw Error('require unsupported'); }) : require, typeof(exports) === 'undefined' ? this : exports); } : define)(function(require, exports) {

'use strict';

var BaseAssert = require('test').Assert;

function runAsserts(assert, assertions) {
  if (!assertions.length) return
  var assertion = assertions.shift()
  var actual = []
  function stop(error) {
    var display = JSON.stringify(assertion.expected) || '';
    display = display.length > 60 ? display.substr(0, 60) + '...' : display
    assert.deepEqual(actual, assertion.expected,
                     !assertion.expected.length ? 'stream is empty' :
                     'stream has expected items: ' + display)

    if (assertion.error) {
      assert.throws(function() {
        throw error
      }, assertion.error, 'stream stopped with error: ' + error.message)
    } else {
      assert.ok(!error, 'stream stopped without error')
    }

    if (assertion.task) assertion.task(assert)
    setTimeout(runAsserts, 1, assert, assertions)
  }
  assertion.actual.then(function next(stream) {
    if (!stream) return stop()
    actual.push(stream.head)
    stream.tail.then(next, stop)
  }, stop)
  if (assertion.setup) assertion.setup()
}

function dsl(api) {
  var dsl = {}, keys = Object.keys(api), model

  keys.forEach(function(key) {
    dsl[key] = function method() {
      if (arguments.length && typeof(api[key] === 'function'))
        api[key].apply(model, arguments)

      return method
    }
  })

  keys.forEach(function(key) {
    keys.forEach(function(key) {
      this[key] = dsl[key]
    }, dsl[key])
  })

  return function(value) {
    model = value
    return dsl
  }
}

var assert = dsl({
  and: function and(setup) {
    this.setup = setup
  },
  have: function have() {
    this.expected = Array.prototype.slice.call(arguments)
  },
  items: function items() {
    this.expected = Array.prototype.slice.call(arguments)
  },
  expect: function expect(actual) {
    this.actual = actual
  },
  assert: function assert(actual) {
    this.actual = actual
  },
  stream: function stream(source) {
    this.actual = source
  },
  to: function to() {
    this.expected = Array.prototype.slice.call(arguments)
  },
  be: function be() {
    this.expected = Array.prototype.slice.call(arguments)
  },
  an: function an(expected) {
    this.expected = an
  },
  a: function a(expected) {
    this.expected = expected
  },
  empty: function empty() {
    this.expected = []
  },
  error: function error(pattern) {
    this.error = pattern
  },
  match: function match(pattern) {
    this.error = pattern
  },
  matching: function matching(pattern) {
    this.error = pattern
  },
  then: function then(task) {
    this.task = task;
  },
  with: null,
  stop: null
})

exports.Assert = function Assert() {
  var test = BaseAssert.apply(this, arguments)
  var assertions = []
  setTimeout(runAsserts, 10, test, assertions)

  function expect(actual) {
    var assertion = {
      actual: actual,
      expected: [],
      error: null,
      expect: expect
    }
    assertions.push(assertion)
    return assert(assertion)
  }
  expect.assert = test
  return expect
}

});
