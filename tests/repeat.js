/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'), Stream = streamer.Stream,
    take = streamer.take, repeat = streamer.repeat

exports.Assert = require('./assert').Assert
exports['test basic repeat'] = function(expect, complete) {
  var actual = repeat(1)

  expect(take(5, actual)).to.be(1, 1, 1, 1, 1)
  expect(take(8, actual)).to.be(1, 1, 1, 1, 1, 1, 1, 1).then(complete)
}

if (module == require.main)
  require('test').run(exports)

});
