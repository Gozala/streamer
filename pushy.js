/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true esnext: true
         forin: false latedef: false */
/*global define: true */

!(typeof(define) !== "function" ? function($){ $(typeof(require) !== 'function' ? (function() { throw Error('require unsupported'); }) : require, typeof(exports) === 'undefined' ? this : exports); } : define)(function(require, exports) {

'use strict';

var streamer = require('./core'), Stream = streamer.Stream,
    defer = streamer.defer



var unbind = Function.call.bind(Function.bind, Function.call)
// Convenience shortcut for Array.prototype.slice.call(args, n)
var slice = unbind(Array.prototype.slice)
// Convenience shortcut for Array.prototype.concat.apply([], [ [1], [2] ])

function Queue() {
  /**
  Creates a queue.
  **/
  var queued = [], pending = [], next = function next() {
    var deferred = defer()
    if (queued.length) deferred.resolve(queued.shift())
    else if (pending) pending.push(deferred)
    else deferred.resolve(null)
    return deferred.promise
  }

  return Object.create(Queue.prototype, {
    then: { value: function then(resolve, reject) {
      return next().then(resolve, reject)
    }},
    enqueue: { value: function enqueue(item) {
      if (!pending) return
      if (pending.length) pending.shift().resolve(Stream(item, next))
      else queued.push(Stream(item, next))
    }},
    close: { value: function close() {
      if (!pending) return
      while (pending.length) pending.shift().resolve(null)
      pending = null
    }}
  })
}
exports.Queue = Queue

function Channel() {
  var next = defer(), pending = true
  return Object.create(Channel.prototype, {
    then: { value: function then(resolve, reject) {
      return next.promise.then(resolve, reject)
    }},
    enqueue: { value: function enqueue(item) {
      if (pending) next.resolve(Stream(item, (next = defer()).promise))
    }},
    close: { value: function close() {
      pending = false
      next.resolve(null)
    }}
  })
}
exports.Channel = Channel

function enqueue(item, queue) {
  queue.enqueue(item)
}
enqueue.all = function enqueueall(item1, item2, item3, queue) {
  var items = slice(arguments)
  queue = items.pop()
  while (items.length) queue.enqueue(items.shift())
}
exports.enqueue = enqueue
exports.push = enqueue

function close(channel) {
  channel.close()
}
exports.close = close


});
