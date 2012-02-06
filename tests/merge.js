/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'), Stream = streamer.Stream,
    append = streamer.append, delay = streamer.delay, merge = streamer.merge

exports.Assert = require('./assert').Assert

exports['test merge stream of empty streams'] = function(expect, complete) {
  var actual = merge(Stream.of(Stream.empty, Stream.empty))

  expect(actual).to.be.empty().then(complete)
}

exports['test merge empty & non-empty'] = function(expect, complete) {
  var actual = merge(Stream.of(Stream.empty, Stream.of(1, 2), Stream.empty))

  expect(actual).to.be(1, 2).then(complete)
}

exports['test merge merged'] = function(expect, complete) {
  var merged = merge(Stream.of(Stream.of(1, 2), Stream.of('a', 'b')))
  var actual = merge(Stream.of(Stream.of('>'), merged, Stream.empty))

  expect(actual).to.be('>', 1, 'a', 2, 'b').then(complete)
}

exports['test merge sync & async streams'] = function(expect, complete) {
  var async = delay(Stream.of(3, 2, 1))
  var actual = merge(Stream.of(async, Stream.empty, async, Stream.of('a', 'b')))

  expect(actual).to.be('a', 'b', 3, 3, 2, 2, 1, 1).then(complete)
}

exports['test merge with broken stream'] = function(expect, complete) {
  var boom = Error('Boom!!')
  var async = delay(append(Stream.of(2, 1), Stream.error(boom)))
  var actual = merge(Stream.of(Stream.of('>'), async, Stream.of(1, 2), async))

  expect(actual).to.have('>', 1, 2, 2, 2, 1).and.error(boom).then(complete)
}

exports['test merge async stream of streams'] = function(expect, complete) {
  var async = delay(Stream.of(3, 2, 1))
  var first = delay(Stream.of(Stream.empty, async, Stream.of(':a', ':b'), async))
  var actual = merge(append.all(first, Stream.of(Stream.of('a', 'b')), 
                     Stream.of(Stream.empty, Stream.of('C', 'D'))))

  expect(actual).to.be(3, ':a', ':b', 2, 3, 'a', 2, 'C', 'b', 'D', 1, 1).then(complete)
}

if (module == require.main)
  require('test').run(exports)

});
