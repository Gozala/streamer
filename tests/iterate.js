/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'),
    iterate = streamer.iterate, take = streamer.take
var test = require('./utils').test

exports['test basic iterate'] = function(assert) {
  var numbers = iterate(function incriment(x) { return x + 1 }, 0)
  test(assert, Object, take(5, numbers), [ 0, 1, 2, 3, 4 ])
  test(assert, Object, take(10, numbers), [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ])
}

if (module == require.main)
  require('test').run(exports)

});
