/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false */
/*global define: true */

!(typeof define !== "function" ? function($){ $(require, exports, module); } : define)(function(require, exports, module, undefined) {

'use strict';

var core = require('./core'),
    map = core.map, merge = core.merge, list = core.list, append = core.append

function alter(lambda, source, state) {
  /*
  Returns altered copy of `source` stream, that has modified elements, size,
  behavior. Give `lambda` performs modifications depending on the curried
  `state`.
  **/
  return function stream(next) {
    source(function interfere(head, tail) {
      lambda(head, tail, function forward(head, tail) {
        next(head, tail ? alter(lambda, tail, state) : tail)
      }, state)
    })
  }
}
exports.alter = alter

function future(source) {
  /**
  Takes a stream and rushes to pre-cache it, so that for the moment returned
  stream will be read it's head and tail will be ready. This is useful when
  reading from multiple streams in parallel. Please note that only one consumer
  may read from the resulting stream.
  **/

  var stream = promise()
  source(function forward(head, tail) { deliver(stream, head, tail )})
  return stream
}
exports.future = future

/*
function reduce(reducer, source, initial) {
  /**
  Returns stream of reduced values
  @param {Function} source
     stream to reduce.
  @param {Function} reducer
     reducer function
  @param initial
     initial value
  @examples
     var numbers = list(2, 3, 8)
     var sum = reduce(function onElement(previous, current) {
       return (previous || 0) + current
     }, numbers)
     sum(console.log)
     // 13
  ** /

  return function stream(next, stop) {
    var value = initial
    source(function onElement(element) {
      value = reducer(value, element)
    }, function onStop(error) {
      if (error) return stop(error)
      next(value)
      if (stop) stop()
    })
  }
}
exports.reduce = reduce
*/

function numbers(from, to) {
  from = from || 0
  to = to || Infinity
  return function stream(next) {
    from < to ? next(from, numbers(from + 1, to)) :
    from > to ? next(from, numbers(from - 1, to)) :
           next()
  }
}
exports.numbers = numbers

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

function smash() {
  /**
  Returns a stream that contains all elements of each stream in the order they
  appear in the original streams. If any of the `source` streams is stopped
  with an error, it will just move to another stream.
  @examples
     var stream = smash(list(1, 2),
                        function(next, stop) { stop('boom') },
                        list('a', 'b'))
     stream(console.log)
     // 1
     // 2
     // 'a'
     // 'b'
  **/

  var streams = Array.prototype.slice.call(arguments, 0)
  return function stream(next, stop) {
    var source, sources = streams.slice(0)
    function onStop(error) {
      if ((source = sources.shift())) source(next, onStop)
      else return stop && stop(error)
    }
    onStop()
  }
}
exports.smash = smash

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

function dequeue(elements, consumers, closed, tail) {
  var readers, element
  if (!dequeue.active) {
    dequeue.active = true
    if (elements.length) {
      element = elements.shift()
      readers = consumers.splice(0)
      while (readers.length) readers.shift()(element, tail)
    } else if (closed) {
      readers = consumers.splice(0)
      while (readers.length) readers.shift()()
    }
    dequeue.active = false
    if ((elements.length || closed) && consumers.length)
      dequeue(elements, consumers, closed, tail)
  }
}

function queue() {
  var error, closed, consumers = [],
      elements = Array.prototype.slice.call(arguments)

  function stream(next) {
    if (closed) return next(error)
    consumers.push(next)
    dequeue(elements, consumers, closed, stream)
  }

  return Object.defineProperties(stream, {
    '-enqueue': {
      value: function enqueue() {
        // If enqueue is called with no arguments then we close a queue.
        // If queue is still open (not closed) we put all the arguments
        // into it. Also we spawn dequeue process to forward all enqueued
        // messages to the consumers.
        closed = closed || arguments.length === 0
        if (!closed) elements.push.apply(elements, arguments)
        dequeue(elements, consumers, closed, stream)
      }
    },
    '-close': {
      value: function stop(reason) {
        // Closes down the stream optionally error reason may be provided.
        error = reason
        closed = true
        dequeue(elements, consumers, closed, stream)
      }
    }
  })
}
exports.queue = queue

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

function ones(next) {
  return next(1, ones)
}

function increment(number) { return ++number }

function numbers(next) {
  next(1, map(increment, numbers))
}

function sum(a, b) {
  return a + b
}

/*
var fibs = lazy(append(list(1, 2), function(next) {
  map(sum, fibs, tail(fibs))(next)
}))


/** examples
use('./lazy', { reload: true })
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
*/


});
