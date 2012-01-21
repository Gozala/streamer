/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'), Stream = streamer.Stream,
    take = streamer.take, iterate = streamer.iterate

exports.Assert = require('./assert').Assert
exports['test basic iterate'] = function(expect, complete) {
  var actual = iterate(function incriment(x) { return x + 1 }, 0)

  expect(take(5, actual)).to.be(0, 1, 2, 3, 4)
  expect(take(10, actual)).to.be(0, 1, 2, 3, 4, 5, 6, 7, 8, 9).then(complete)
}

if (module == require.main)
  require('test').run(exports)

});
