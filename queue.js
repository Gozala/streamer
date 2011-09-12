/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false */
/*global define: true */

!(typeof define !== "function" ? function($){ $(require, exports, module); } : define)(function(require, exports, module, undefined) {

'use strict';

var nil // Shortcut for undefined.
var slice = Array.prototype.slice, push = Array.prototype.push

// Utility function for storing a privates state
function _(target) {
  if (target.valueOf.length === 0)
    _.initialize(target)
  return target.valueOf(_)
}
_.initialize = function initialize(target) {
  var _valueOf = target.valueOf;
  var privates = {};
  target.valueOf = function valueOf(privates) {
    return privates === _ ? privates : _valueOf.call(target, privates)
  }
}

function update(_stream) {
  var buffer = _stream.buffer, next = _stream.next, stop = _stream.stop
  if (next && buffer.length) {
    if (false === next(buffer.shift()) _stream.stop = _stream.next = null
  }
  return _stream.stopped ? stop && stop(_stream.reason) : update(_stream)
}

function queue() {
  var _stream
  function stream(next, stop) {
    if (_stream.next) throw new Error("stream supports one reader only")
    _stream.next = next
    _stream.stop = stop
    update(_stream)
  }
  _stream = _(stream)
  _stream.buffer = slice.call(arguments)
  _stream.stopped = false
  return stream
}
exports.queue = queue

function enqueue(queue) {
  var _stream = _(queue)
  push.apply(_stream.buffer, slice.call(arguments, 1))
  update(_stream)
}
exports.enqueue = enqueue

function stop(queue, reason) {
  var _stream = _(queue)
  _stream.stopped = true
  _stream.reason = reason
  update(_stream)
}
exports.stop = stop

});
