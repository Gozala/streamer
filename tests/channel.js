/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'), Stream = streamer.Stream,
    take = streamer.take, append = streamer.append, delay = streamer.delay
var pushy = require('../pushy'), Channel = pushy.Channel,
    enqueue = pushy.enqueue, close = pushy.close

function channel2array(channel) {
  var array = []
  channel.then(function collect(stream) {
    array.push(stream.head)
    stream.tail.then(collect)
  })
  return array
}

exports['test empty channel'] = function(assert) {
  var channel = Channel()
  var actual = channel2array(channel)
  close(channel)

  assert.deepEqual(actual, [], 'no items in channel')
}

exports['test unsubscribed items are lost'] = function(assert) {
  var channel = Channel()
  var a1 = channel2array(channel)
  enqueue.all(1, 2, 3, 4, 5, channel)
  var a2 = channel2array(channel)
  enqueue(6, channel)
  close(channel)

  assert.deepEqual(a1, [ 1, 2, 3, 4, 5, 6 ], 'all items are collected in 1st')
  assert.deepEqual(a2, [ 6 ], 'all items after subscribiton are collected')
}

exports['test enqueue later'] = function(assert) {
  var channel = Channel()

  var a1 = channel2array(take(3, channel))
  var a2 = channel2array(channel)

  enqueue.all(1, 2, 3, 4, channel)
  enqueue(5, channel)
  close(channel)

  var a3 = channel2array(channel)

  enqueue(6, channel)
  enqueue.all(7, channel)
  close(channel)

  assert.deepEqual([ a1, a2, a3 ], [ [1, 2, 3], [ 1, 2, 3, 4, 5 ], [] ],
                   "items are collected depending on subscribtion")
}

exports['test enqueue on closed is ignored'] = function(assert) {
  var channel = Channel()

  var a1 = channel2array(channel)

  enqueue.all(1, 2, 3, channel)

  var a2 = channel2array(channel)
  close(channel)

  enqueue(4, channel)

  var a3 = channel2array(channel)

  enqueue.all(6, 7, 8, channel)
  var a4 = channel2array(channel)
  
  assert.deepEqual([ a1, a2, a3, a4 ], [ [ 1, 2, 3 ], [], [], [] ],
                   "items after close are ignored")
}

exports['test close of closed stream is ignored'] = function(assert) {
  var channel = Channel()

  var a1 = channel2array(channel)

  enqueue.all(1, 2, 3, channel)
  close(channel)

  enqueue(4, channel)
  close(channel)

  var a2 = channel2array(channel)

  assert.deepEqual([ a1, a2 ], [ [ 1, 2, 3 ], [] ],
                   "close on closed is ignored")
}

if (module == require.main)
  require('test').run(exports);

});
