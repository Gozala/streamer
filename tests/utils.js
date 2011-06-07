/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true */

(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

exports.test = function test(assert, done, stream, expected) {
  var actual = []
  stream(function next(element) {
    actual.push(element)
  }, function stop(error) {
    assert.equal(error, undefined, 'stream is stopped without an error')
    assert.deepEqual(actual, expected,
                     'all elements were yielded in correct order')
    done()
  })
}

})
