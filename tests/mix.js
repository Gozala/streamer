/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'), Stream = streamer.Stream,
    append = streamer.append, delay = streamer.delay, mix = streamer.mix

exports.Assert = require('./assert').Assert

exports['test mix empty streams'] = function(expect, complete) {
  var actual = mix(Stream.empty, Stream.empty)

  expect(actual).to.be.empty().then(complete)
}

exports['test mix with empty'] = function(expect, complete) {
  var actual = mix(Stream.of(1, 2), Stream.of())

  expect(actual).to.be(1, 2).then(complete)
}

exports['test mix to empty'] = function(expect, complete) {
  var actual = mix(Stream.empty, Stream.of(3, 4))

  expect(actual).to.be(3, 4).then(complete)
}

exports['test mix many streams'] = function(expect, complete) {
  var actual = mix.all(Stream.of(1, 2), Stream.empty, Stream.of('a', 'b'),
                       Stream.empty)

  expect(actual).to.be(1, 'a', 2, 'b').then(complete)
}

exports['test mix sync & async streams'] = function(expect, complete) {
  var async = delay(Stream.of(3, 2, 1))
  var actual = mix.all(async, Stream.empty, async, Stream.of('a', 'b'))

  expect(actual).to.be('a', 'b', 3, 3, 2, 2, 1, 1).then(complete)
}

exports['test mix & remix'] = function(expect, complete) {
  var async = delay(Stream.of(2, 1))
  var mixed = mix(async, Stream.of('a', 'b'))
  var actual = mix(mix(mixed, Stream.of('||')), mixed)

  expect(actual).to.be('a', 'a', '||', 'b', 'b', 2, 2, 1, 1).then(complete)
}

exports['test errors propagate to mixed streams'] = function(expect, complete) {
  var boom = Error('Boom!!')
  var async = delay(mix(Stream.of(3, 2, 1), Stream.error(boom)))
  var actual = mix.all(Stream.of('>'), async, Stream.of('a', 'b'), async)

  expect(actual).to.have('>', 'a', 'b', 3).and.error(boom).then(complete)
}

if (module == require.main)
  require('test').run(exports);

});
