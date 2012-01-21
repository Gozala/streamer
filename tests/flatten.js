/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'), Stream = streamer.Stream,
    append = streamer.append, delay = streamer.delay, flatten = streamer.flatten

exports.Assert = require('./assert').Assert

exports['test flatten stream of empty streams'] = function(expect, complete) {
  var actual = flatten(Stream.of(Stream.empty, Stream.empty))

  expect(actual).to.be.empty().then(complete)
}

exports['test flatten empty & non-empty'] = function(expect, complete) {
  var actual = flatten(Stream.of(Stream.empty, Stream.of(1, 2), Stream.empty))

  expect(actual).to.be(1, 2).then(complete)
}

exports['test flatten flattened'] = function(expect, complete) {
  var stream = flatten(Stream.of(Stream.of(1, 2), Stream.of('a', 'b')))
  var actual = flatten(Stream.of(Stream.of('>'), stream, Stream.empty))

  expect(actual).to.be('>', 1, 2, 'a', 'b').then(complete)
}

exports['test flatten sync & async streams'] = function(expect, complete) {
  var async = delay(Stream.of(3, 2, 1))
  var actual = flatten(Stream.of(async, Stream.of('|'), async,
                                 Stream.of('a', 'b'), Stream.empty))

  expect(actual).to.be(3, 2, 1, '|', 3, 2, 1, 'a', 'b').then(complete)
}

exports['test flatten with broken stream'] = function(expect, complete) {
  var boom = Error('Boom!')
  var async = delay(append(Stream.of(3, 2, 1), Stream.error(boom)))
  var actual = flatten(Stream.of(Stream.of('>'), async, Stream.of(1, 2)))

  expect(actual).to.have.items('>', 3, 2, 1).and.error(boom).then(complete)
}

exports['test flatten async stream of streams'] = function(expect, complete) {
  var async = delay(Stream.of(3, 2, 1))
  var actual = flatten(Stream.of(Stream.empty, Stream.of(1, 2), async,
                                 Stream.of('a', 'b'), async))

  expect(actual).to.be(1, 2, 3, 2, 1, 'a', 'b', 3, 2, 1).then(complete)
}

if (module == require.main)
  require('test').run(exports)

});
