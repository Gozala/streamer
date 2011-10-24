/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'),
    lazy = streamer.lazy, list = streamer.list, delay = streamer.delay,
    append = streamer.append, stream = streamer.stream, take = streamer.take

var test = require('./utils').test

exports['test lazy empty list'] = function(assert, done) {
  test(assert, done, lazy(list()), [])
}

exports['test number list'] = function(assert, done) {
  test(assert, done, lazy(list(1, 2, 3)), [ 1, 2, 3 ])
}

exports['test mixed list'] = function(assert, done) {
  var error = Error('Boom!'), object = {}, func = function() {}, exp = /foo/
  test(assert, done, lazy(list('a', 2, 'b', 4, object, func, exp, error)),
       [ 'a', 2, 'b', 4, object, func, exp, error  ])
}

exports['test caching in lazy'] = function(assert) {
  var reads = 0, errors = 0, error = Error('Boom')
  var actual = lazy(stream(1, function tail(next) {
    reads = reads + 1
    next(2, function(next) {
      errors = errors + 1
      next(error)
    })
  }))

  test(assert, function() {
    assert.equal(reads, 0, 'tail have not being accessed yet')
  }, take(1, actual), [ 1 ])

  test(assert, function() {
    assert.equal(reads, 1, 'tail was accessed once')
  }, take(2, actual), [ 1, 2 ])

  test(assert, function() {
    assert.equal(reads, 1, 'tail was cached')
    assert.equal(errors, 0, 'error is not yielded yet')
  }, take(2, actual), [ 1, 2 ])

  test(assert, function() {
    assert.equal(reads, 1, 'tail was cached')
    assert.equal(errors, 1, 'error was yielded')
  }, actual, [ 1, 2 ], error)

  test(assert, function() {
    assert.equal(reads, 1, 'tail was cached')
    assert.equal(errors, 1, 'error was cached')
  }, actual, [ 1, 2 ], error)
}

exports['test async but lazy'] = function(assert, done) {
  var reads = 0, errors = 0, error = Error('Boom')
  var actual = lazy(delay(stream(1, function tail(next) {
    reads = reads + 1
    next(2, function(next) {
      errors = errors + 1
      next(error)
    })
  })))

  var steps = [
    function on_first_read_async(next) {
      test(assert, next, take(1, actual), [ 1 ])
    },
    function on_next_read_sync(next, turned) {
      assert.ok(turned, 'element was yielded on next turn')
      test(assert, next, take(1, actual), [ 1 ])
    },
    function second_read_sync(next, turned) {
      assert.ok(!turned, 'head was cashed')
      assert.equal(reads, 0, 'tail have not being accessed yet')
      test(assert, next, take(2, actual), [ 1, 2 ])
    },
    function(next, turned) {
      assert.ok(turned, 'element was yielded on next turn')
      assert.equal(reads, 1, 'tail was accessed once')
      test(assert, next, take(2, actual), [ 1, 2 ])
    },
    function(next, turned) {
      assert.ok(!turned, 'tail was cashed')
      assert.equal(reads, 1, 'tail was cached')
      assert.equal(errors, 0, 'error is not yielded yet')
      test(assert, next, actual, [ 1, 2 ], error)
    },
    function(next, turned) {
      assert.ok(turned, 'element was yielded on next turn')
      assert.equal(reads, 1, 'tail was cached')
      assert.equal(errors, 1, 'error was yielded')

      test(assert, next, actual, [ 1, 2 ], error)
    },
    function(next, turned) {
      assert.ok(!turned, 'tail was cached')

      assert.equal(reads, 1, 'tail was cached')
      assert.equal(errors, 1, 'error was cached')
      done()
    }
  ]

  function next() {
    var turned = false
    steps.shift()(function() {
      steps.shift()(next, turned)
    }, turned)
    turned = true
  }
  next()
}

if (module == require.main)
  require('test').run(exports)

});
