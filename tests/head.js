/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'), Stream = streamer.Stream,
    delay = streamer.delay, append = streamer.append, head = streamer.head

exports.Assert = require('./assert').Assert

exports['test head empty'] = function(expect, complete) {
  var actual = head(Stream.empty)

  expect(actual).to.be.empty().then(complete)
}

exports['test head default to 1'] = function(expect, complete) {
  var actual = head(Stream.of(1, 2, 3, 4))

  expect(actual).to.be(1).then(complete)
}


exports['test head of async stream'] = function(expect, complete) {
  var actual = head(delay(Stream.of(5, 4, 3, 3, 1)))

  expect(actual).to.be(5).then(complete)
}

exports['test head before stream error'] = function(expect, complete) {
  var boom = Error('Boom!')
  var actual = head(delay(append(Stream.of(3, 2), Stream.error(boom))))

  expect(actual).to.have.items(3).then(complete)
}

exports['test head on broken stream'] = function(expect, complete) {
  var boom = Error('Boom!')
  var actual = head(delay(append(Stream.error(boom), Stream.of(1, 2, 3))))

  expect(actual).to.have.error(boom).then(complete)
}

if (module == require.main)
  require('test').run(exports)

});
