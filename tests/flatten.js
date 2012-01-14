/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var Stream = require('../core').Stream

exports.Assert = require('./assert').Assert

exports['test flatten stream of empty streams'] = function(test, complete) {
  var actual = Stream.of(Stream.empty, Stream.empty).flatten()
  test(actual).to.be.empty().then(complete)
}

exports['test flatten empty & non-empty'] = function(test, complete) {
  var actual = Stream.of(Stream.empty, Stream.of(1, 2), Stream.empty).flatten()
  test(actual).to.be(1, 2).then(complete)
}

exports['test flatten flattened'] = function(test, complete) {
  var stream = Stream.of(Stream.of(1, 2), Stream.of('a', 'b')).flatten()
  var actual = Stream.of(Stream.of('>'), stream, Stream.empty).flatten()
  test(actual).to.be('>', 1, 2, 'a', 'b').then(complete)
}

exports['test flatten sync & async streams'] = function(test, complete) {
  var async = Stream.of(3, 2, 1).delay()
  var actual = Stream.of(async, Stream.of('|'), async, Stream.of('a', 'b'),
                         Stream.empty).flatten()
  test(actual).to.be(3, 2, 1, '|', 3, 2, 1, 'a', 'b').then(complete)
}

exports['test flatten with broken stream'] = function(test, complete) {
  var boom = Error('Boom!')
  var async = Stream.of(3, 2, 1).append(Stream.error(boom)).delay()
  var actual = Stream.of(Stream.of('>'), async, Stream.of(1, 2)).flatten()

  test(actual).to.have.elements('>', 3, 2, 1).and.error(boom).then(complete)
}

exports['test flatten async stream of streams'] = function(test, complete) {
  var async = Stream.of(3, 2, 1).delay()
  var actual = Stream.of(Stream.empty, Stream.of(1, 2), async,
                         Stream.of('a', 'b'), async).flatten()

  test(actual).to.be(1, 2, 3, 2, 1, 'a', 'b', 3, 2, 1).then(complete)
}

if (module == require.main)
  require('test').run(exports)

});
