/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'), Stream = streamer.Stream

exports.Assert = require('./assert').Assert

exports['test chain map / filter'] = function(expect, complete) {
  var actual = ((streamer.run)
    (streamer.iterate, function(x) { return x + 1 }, 0)
    (streamer.filter, function(x) { return x % 2 })
    (streamer.map, function(x) { return x * x })
    (streamer.take, 5))

  expect(actual).to.be(1, 9, 25, 49, 81).then(complete)
}

exports['test append and capture'] = function(expect, complete) {
  var boom = Error('Boom!')
  var actual = ((streamer.run.on)
    (Stream.of(1, 2))
    (streamer.mix, Stream.of('a', 'b', 'c'))
    (streamer.append.all, Stream.of(4, 5), Stream.error(boom))
    (streamer.capture, function(error) {
      return Stream.of(6, 7)
    }))

  expect(actual).to.be(1, 'a', 2, 'b', 'c', 4, 5, 6, 7).
    and.then(complete)
}

if (module == require.main)
  require('test').run(exports)

});

