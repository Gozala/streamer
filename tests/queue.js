/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'), Stream = streamer.Stream,
    take = streamer.take, append = streamer.append, delay = streamer.delay
var pushy = require('../pushy'), Queue = pushy.Queue,
    enqueue = pushy.enqueue, close = pushy.close

exports.Assert = require('./assert').Assert

exports['test empty queue'] = function(expect, complete) {
  var actual = Queue()
  close(actual)

  expect(actual).to.be.empty().then(complete)
}

exports['test enqueued elements'] = function(expect, complete) {
  var actual = Queue()
  enqueue.all(1, 2, 3, 4, 5, actual)
  close(actual)

  expect(actual).to.be(1, 2, 3, 4, 5).then(complete)
}

exports['test enqueue later'] = function(expect, complete) {
  var actual = Queue()

  expect(take(5, actual)).to.be(1, 2, 3, 4, 5)
  expect(actual).to.be(6, 7)
  expect(actual).to.be.empty().then(complete)

  enqueue.all(1, 2, 3, 4, actual)
  enqueue(5, actual)
  enqueue(6, actual)
  enqueue.all(7, actual)
  close(actual)
}

exports['test enqueue on closed is ignored'] = function(expect, complete) {
  var actual = Queue()
  enqueue.all(1, 2, 3, actual)
  close(actual)
  enqueue(4, actual)
  enqueue.all(6, 7, 8, actual)

  expect(actual).to.be(1, 2, 3).then(complete)
}

exports['test close of closed stream is ignored'] = function(expect, complete) {
    var actual = Queue()
  enqueue.all(1, 2, 3, actual)
  close(actual)
  enqueue(4, actual)
  close(actual)

  expect(actual).to.be(1, 2, 3)
  expect(actual).to.be.empty().then(complete)
}

if (module == require.main)
  require('test').run(exports);

});
