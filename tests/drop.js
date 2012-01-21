/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'), Stream = streamer.Stream,
    append = streamer.append, delay = streamer.delay, drop = streamer.drop

exports.Assert = require('./assert').Assert

exports['test drop empty'] = function(expect, complete) {
  var actual = drop(100, Stream.empty)
  expect(actual).to.be.empty().then(complete)
}

exports['test drop on sync stream'] = function(expect, complete) {
  var actual = drop(3, Stream.of(1, 2, 3, 4))

  expect(actual).to.be(4).then(complete)
}

exports['test drop falls back to 1'] = function(expect, complete) {
  var actual = drop(Infinity, Stream.of(1, 2, 3, 4))

  expect(actual).to.be.empty().then(complete)
}

exports['test drop can take 0'] = function(expect, complete) {
  var actual = drop(0, Stream.of(1, 2, 3, 4))

  expect(actual).to.be(1, 2, 3, 4).then(complete)
}

exports['test drop more than have'] = function(expect, complete) {
  var actual = drop(5, Stream.of(1, 2, 3, 4))

  expect(actual).to.be.empty().then(complete)
}

exports['test drop of async stream'] = function(expect, complete) {
  var actual = drop(2, delay(Stream.of(5, 4, 3, 2, 1)))

  expect(actual).to.be(3, 2, 1).then(complete)
}

exports['test drop on stream with error'] = function(expect, complete) {
  var boom = Error('Boom!')
  var actual = drop(2, delay(append(Stream.of(4, 3, 2, 1), Stream.error(boom))))

  expect(actual).to.have.elements(2, 1).and.error(boom).then(complete)
}

exports['test drop on stream with error in head'] = function(expect, complete) {
  var boom = Error('Boom!')
  var actual = drop(2, delay(append(Stream.error(boom), Stream.of(4, 3, 2, 1))))

  expect(actual).to.have.elements().and.error(boom).then(complete)
}

if (module == require.main)
  require('test').run(exports)

});
