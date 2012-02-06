/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false */
/*global define: true */

!(typeof define !== "function" ? function($){ $(require, exports, module); } : define)(function(require, exports, module, undefined) {

'use strict';

var core = require('./core'),
    map = core.map, merge = core.merge, list = core.list, append = core.append

function tree(isBranch, children, root) {
  /**
  Returns a lazy stream of the nodes in a tree, via a depth-first walk.
  `isBranch` must be a function that takes one argument and returns true if
  passed a node that can have children (but may not). `children` must be a
  function that takes one argument and returns a stream of the children. Will
  only be called on nodes for which `isBranch` returns true. `root` is the root
  node of the tree.
  **/

  return (function walk(node) {
    return function stream(next, stop) {
      var $ = isBranch(node)
      !(typeof($) === 'function' ? $ : list($))(function(isBranch) {
        (isBranch ?
         append(list(node), merge(map(walk, children(node)))) :
         list(node))(next, stop)
      })
    }
  })(root)
}
exports.tree = tree

function strainer(lambda, source) {
}
exports.strainer = strainer

function pipe() {
  var forward, reason, closed
  return Object.defineProperties(function stream(next) {
    forward = next
  }, {
    '-enqueue': {
      value: function enqueue(element) {
        closed = arguments.length === 0
        if (forward) closed ? forward(reason) : forward(element, this)
      }
    },
    '-close': {
      value: function close(error) {
        closed = true
        reason = error
        if (forward) forward(reason)
      }
    }
  })
}
exports.pipe = pipe

// Queue

function dequeue(items, consumers, closed, tail) {
  var readers, element
  if (!dequeue.active) {
    dequeue.active = true
    if (items.length) {
      element = items.shift()
      readers = consumers.splice(0)
      while (readers.length) readers.shift()(element, tail)
    } else if (closed) {
      readers = consumers.splice(0)
      while (readers.length) readers.shift()()
    }
    dequeue.active = false
    if ((items.length || closed) && consumers.length)
      dequeue(items, consumers, closed, tail)
  }
}

function queue() {
  /**
  @examples

    use('./experimental', { reload: true })
    q1 = queue(1, 2, 3)
    m1 = map(function($) { return 'm1 -> ' + $ }, q1)
    m2 = map(function($) { return 'm2 -> ' + $ }, q1)

    print(m1)
    print(m2)

    enqueue(q1, 4)

    enqueue(q1, 5, 6, 7)

    m3 = map(function($) { return 'm3 -> ' + $ }, q1)
    print(take(2, m3))

    enqueue(q1, 8, 9, 10)

    enqueue(q1)
  **/

  var error, closed, consumers = [],
      items = Array.prototype.slice.call(arguments)

  function stream(next) {
    if (closed) return next(error)
    consumers.push(next)
    dequeue(items, consumers, closed, stream)
  }

  return Object.defineProperties(stream, {
    '-enqueue': {
      value: function enqueue() {
        // If enqueue is called with no arguments then we close a queue.
        // If queue is still open (not closed) we put all the arguments
        // into it. Also we spawn dequeue process to forward all enqueued
        // messages to the consumers.
        closed = closed || arguments.length === 0
        if (!closed) items.push.apply(items, arguments)
        dequeue(items, consumers, closed, stream)
      }
    },
    '-close': {
      value: function stop(reason) {
        // Closes down the stream optionally error reason may be provided.
        error = reason
        closed = true
        dequeue(items, consumers, closed, stream)
      }
    }
  })
}
exports.queue = queue

exports.attempt = exports['try'] = attempt
function attempt(catcher, f, stream) {
  /**
  Exception handling in streams may be performed by wrapping potential `stream`
  via `attempt`. It takes optional `catcher` function performing catch clause
  and required `f` function performing `finally` clause. This way given `stream`
  may be repaired by substituting error with other stream using `catcher` and
  some finalization may be done once stream reaches it's end.


  ## Examples

  via.open = function withOpen(path, exectue) {
    return attempt(function() {
      return fs.closer(path)
    }, flatten(map(fs.opener(path), exectue)))
  }
  **/

  return stream ? finalize(f, capture ? capture(catcher, stream) : stream)
                : attempt(null, catcher, f)
}

function enqueue(queue) {
  if (!('-enqueue' in queue)) throw Error('Can not enqueue into non-queue')
  queue['-enqueue'].apply(queue, Array.prototype.slice.call(arguments, 1))
}
exports.enqueue = enqueue

function close(queue, error) {
  if (!('-close' in queue)) throw Error('Can not close non-queue')
  queue['-close'](error)
}
exports.close = close

// Examples

exports.fibs = function(fibs) {
  return (fibs = Stream(0, Stream(1, function rest() {
    return map.all(function(a, b) { return a + b }, fibs, tail(fibs))
  })))
}

});
