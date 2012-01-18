/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var Stream = require('../core').Stream

exports.Assert = require('./assert').Assert

exports['test merge stream of empty streams'] = function(expect, complete) {
  var actual = Stream.of(Stream.empty, Stream.empty).merge()

  expect(actual).to.be.empty().then(complete)
}

exports['test merge empty & non-empty'] = function(expect, complete) {
  var actual = Stream.of(Stream.empty, Stream.of(1, 2), Stream.empty).merge()

  expect(actual).to.be(1, 2).then(complete)
}

exports['test merge merged'] = function(expect, complete) {
  var merged = Stream.of(Stream.of(1, 2), Stream.of('a', 'b')).merge()
  var actual = Stream.of(Stream.of('>'), merged, Stream.empty).merge()

  expect(actual).to.be('>', 1, 'a', 2, 'b').then(complete)
}

exports['test merge sync & async streams'] = function(expect, complete) {
  var async = Stream.of(3, 2, 1).delay()
  var actual = Stream.of(async, Stream.empty, async, Stream.of('a', 'b')).merge()

  expect(actual).to.be('a', 'b', 3, 3, 2, 2, 1, 1).then(complete)
}

exports['test merge with broken stream'] = function(expect, complete) {
  var boom = Error('Boom!!')
  var broken = Stream.error(boom)
  var async = Stream.of(3, 2, 1).append(broken).delay()
  var actual = Stream.of(Stream.of('>'), async, Stream.of(1, 2), async).merge()

  expect(actual).to.have('>', 1, 2, 3, 3, 2, 2, 1).and.error(boom).then(complete)
}

exports['test merge async stream of streams'] = function(expect, complete) {
  var async = Stream.of(3, 2, 1).delay()
  var first = Stream.of(Stream.empty, async, Stream.of(':a', ':b'), async).delay()
  var actual = first.append(Stream.of(Stream.of('a', 'b'))).
                     append(Stream.of(Stream.empty, Stream.of('C', 'D'))).
                     merge()

  expect(actual).to.be(3, ':a', ':b', 2, 'a', 'C', 'b', 'D', 1, 3, 2, 1).then(complete)
}

if (module == require.main)
  require('test').run(exports)

});
