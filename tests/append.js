/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'), Stream = streamer.Stream,
    take = streamer.take, append = streamer.append, delay = streamer.delay

exports.Assert = require('./assert').Assert

exports['test append empty streams'] = function(expect, complete) {
  var actual = append(Stream.empty, Stream.empty)
  expect(actual).to.be.empty().then(complete)
}

exports['test append empty'] = function(expect, complete) {
  var actual = append(Stream.of(1, 2), Stream.empty)
  expect(actual).to.be(1, 2).then(complete)
}

exports['test append to empty'] = function(expect, complete) {
  var actual = append(Stream.empty, Stream.of(3, 4))
  expect(actual).to.be(3, 4).then(complete)
}

exports['test append many streams'] = function(expect, complete) {
  var actual = append.all(Stream.of(1, 2), Stream.empty, Stream.of('a', 'b'),
                           Stream.empty)
  expect(actual).to.be(1, 2, 'a', 'b').then(complete)
}

exports['test append sync & async streams'] = function(expect, complete) {
  var async = delay(Stream.of(3, 2, 1))
  var actual = append.all(append(async, Stream.empty), async,
                          Stream.of('a', 'b'))

  expect(actual).to.be(3, 2, 1, 3, 2, 1, 'a', 'b').then(complete)
}

exports['test append & reappend'] = function(expect, complete) {
  var async = delay(Stream.of(2, 1))
  var stream = append(async, Stream.of('a', 'b'))
  var actual = append.all(stream, Stream.of('||'), stream)
  expect(actual).to.be(2, 1, 'a', 'b', '||', 2, 1, 'a', 'b').then(complete)
}

exports['test map broken stream'] = function(expect, complete) {
  var boom = Error('Boom!')
  var async = delay(append(Stream.of(3, 2, 1), Stream.error(boom)))
  var actual = append.all(Stream.of('>'), async, Stream.of(1, 2), async)

  expect(actual).to.have.items('>', 3, 2, 1).and.error(boom).then(complete)
}

if (module == require.main)
  require('test').run(exports);

});
