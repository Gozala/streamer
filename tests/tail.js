/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'), Stream = streamer.Stream,
    delay = streamer.delay, append = streamer.append, tail = streamer.tail

exports.Assert = require('./assert').Assert

exports['test tail empty'] = function(expect, complete) {
  var actual = tail(Stream.empty)

  expect(actual).to.be.empty().then(complete)
}

exports['test tail on sync stream'] = function(expect, complete) {
  var actual = tail(Stream.of(1, 2, 3, 4))

  expect(actual).to.be(2, 3, 4).then(complete)
}

exports['test tail of async stream'] = function(expect, complete) {
  var actual = tail(delay(Stream.of(5, 4, 3, 2, 1)))

  expect(actual).to.be(4, 3, 2, 1).then(complete)
}

exports['test stream with error in tail'] = function(expect, complete) {
  var boom = Error('Boom')
  var actual = tail(delay(append(Stream.of(3, 2, 1), Stream.error(boom))))

  expect(actual).to.have.items(2, 1).and.error(boom).then(complete)
}

exports['test stream with error before tail'] = function(expect, complete) {
  var boom = Error('Boom!')
  var actual = tail(delay(append(Stream.error(boom), Stream.of(3, 2, 1))))

  expect(actual).to.have.error(boom).then(complete)
}

if (module == require.main)
  require('test').run(exports)

});
