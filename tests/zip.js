/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

"use strict";

var streamer = require('../streamer'),
    zip = streamer.zip, list = streamer.list
var test = require('./utils.js').test

exports['test zip with empty'] = function(assert, done) {
  var empty = list()
  var numbers = list(1, 2, 3)
  var zipped = zip(empty, numbers)
  
  test(assert, done, zipped, [])
}

exports['test zip 2 lists'] = function(assert, done) {
  var numbers = list(1, 2, 3, 4)
  var letters = list('a', 'b', 'c', 'd')
  var zipped = zip(numbers, letters)
  test(assert, done, zipped, [ [ 1, 'a' ], [ 2, 'b' ], [ 3, 'c' ], [ 4, 'd' ] ])
}

exports['test zip sync stream with async stream'] = function(assert, done) {
  function a(next, stop) {
    var x = 5
    setTimeout(function onTimeout() {
      if (!x) return stop()
      next(x--)
      setTimeout(onTimeout, 0)
    }, 0)
  }
  var b = list('a', 'b', 'c', 'd', 'e')
  var c = list('~', '@', '!', '#')

  var zipped = zip(a, b, c)

  test(assert, done, zipped, [
    [ 5, 'a', '~'  ],
    [ 4, 'b', '@' ],
    [ 3, 'c', '!' ],
    [ 2, 'd', '#' ]
  ])
}

exports['~test filter broken stream'] = function(assert, done) {
  function stream(next, stop) {
    var x = 3
    setTimeout(function onTimeout() {
      if (!x) return stop(new Error("Boom!"))
      next(x--)
      setTimeout(onTimeout, 0)
    }, 0)
  }
  var filtered = filter(stream, function(number) { return number % 2 })
  var expected = [ 3, 1 ]
  var actual = []
  filtered(function next(x) { actual.push(x) }, function stop(error) {
    assert.equal(error.message, "Boom!", "error propagated to filtered stream")
    assert.deepEqual(actual, expected, "all values were yielded before error")
    done()
  })
}

if (module == require.main)
  require("test").run(exports);

})
