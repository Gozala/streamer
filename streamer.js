/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false */
/*global define: true */

(typeof define !== "function" ? function($){ $(require, exports, module); } : define)(function(require, exports, module, undefined) {

'use strict';


/**
 * Creates stream of given elements.
 * @examples
 *    list('a', 2, {})(console.log)
 */
function list() {
  var elements = Array.prototype.slice.call(arguments, 0)
  return function stream(next, stop) {
    elements.forEach(next)
    if (stop) stop()
  }
}
exports.list = list

/*
 * Creates empty stream. This is equivalent of `list()`.
 */
exports.empty = function empty() {
  return list()
}


/**
 * Returns stream of mapped values.
 * @param {Function} input
 *    source stream to be mapped
 * @param {Function} map
 *    function that maps each value
 * @examples
 *    var stream = list({ name: 'foo' },  { name: 'bar' })
 *    var names = map(stream, function(value) { return value.name })
 *    names(console.log)
 *    // 'foo'
 *    // 'bar'
 *    var numbers = list(1, 2, 3)
 *    var mapped = map(numbers, function onEach(number) { return number * 2 })
 *    mapped(console.log)
 *    // 2
 *    // 4
 *    // 6
 */
function map(source, mapper) {
  return function stream(next, stop) {
    source(function onElement(element) {
      next(mapper(element))
    }, stop)
  }
}
exports.map = map

/**
 * Returns stream of filtered values.
 * @param {Function} source
 *    source stream to be filtered
 * @param {Function} filter
 * @examples
 *    var numbers = list(10, 23, 2, 7, 17)
 *    var digits = filter(numbers, function(value) {
 *      return value >= 0 && value <= 9
 *    })
 *    digits(console.log)
 *    // 2
 *    // 7
 */
function filter(source, filterer) {
  return function stream(next, stop) {
    source(function onElement(element) {
      if (filterer(element)) next(element)
    }, stop)
  }
}
exports.filter = filter

/**
 * Returns stream of reduced values
 * @param {Function} source
 *    stream to reduce.
 * @param {Function} reducer
 *    reducer function
 * @param initial
 *    initial value
 * @examples
 *    var numbers = list(2, 3, 8)
 *    var sum = reduce(numbers, function onElement(previous, current) {
 *      return (previous || 0) + current
 *    })
 *    sum(console.log)
 *    // 13
 */
function reduce(source, reducer, initial) {
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

/**
 * This function returns stream of tuples, where the n-th tuple contains the
 * n-th element from each of the argument streams. The returned stream is
 * truncated in length to the length of the shortest argument stream.
 * @params {Function}
 *    source steams to be combined
 * @examples
 *    var a = list([ 'a', 'b', 'c' ])
 *    var b = list([ 1, 2, 3, 4 ])
 *    var c = list([ '!', '@', '#', '$', '%' ])
 *    var abc = zip(a, b, c)
 *    abs(console.log)
 *    // [ 'a', 1, '!' ]
 *    // [ 'b', 2, '@' ]
 *    // [ 'c', 3, '#' ]
 */
var zip = exports.zip = (function Zip() {
  // Returns weather array is empty or not.
  function isEmpty(array) { return !array.length }
  // Utility function that check if each array in given array of arrays
  // has at least one element (in which case we do have a tuple).
  function hasTuple(array) { return !array.some(isEmpty) }
  // Utility function that creates tuple by shifting element from each
  // array of arrays.
  function shiftTuple(array) {
    var index = array.length, tuple = []
    while (0 <= --index) tuple.unshift(array[index].shift())
    return tuple
  }

  return function zip() {
    var sources = Array.prototype.slice.call(arguments)
    return function stream(next, stop) {
      var buffers = [], id, reason, isStopped = false, shortest

      function onElement(id, element) {
        // If resulting stream is already stopped (we are in truncate mode) or
        // if this stream is stopped (we deal with badly implemented stream that
        // yields value after it's stopped) we ignore element.
        if (isStopped) return null
        // Otherwise we buffer an element.
        buffers[id].push(element)
        // If tuple is ready we yield it.
        if (hasTuple(buffers)) next(shiftTuple(buffers))
      }

      function onStop(id, error) {
        // If shortest stream was already stopped then we are in truncate mode
        // which means we ignore all the following stream stops.
        if (isStopped) return null
        // If stream being stopped is the first one to be stopped or if it's
        // shorter then the shortest one stopped, we update stop reason and
        // shortest stopped stream reference.
        if (!shortest || shortest.length > buffers[id].length) {
          shortest = buffers[id]
          reason = error
        }
        // If shortest stream has no buffered elements, we stop resulting stream
        // & do some clean up.
        if (!shortest.length) {
          // Marking stream as stopped.
          isStopped = true
          // Stopping a stream.
          stop(reason)
          // Setting all closure captured elements to `null` so that gc can
          // collect them.
          buffers = shortest = null
        }
      }

      // Initializing buffers.
      id = sources.length
      while (0 <= --id) buffers.push([])

      // Start reading streams.
      id = sources.length
      while (0 <= --id)
        sources[id](onElement.bind(null, id), onStop.bind(null, id))
    }
  }
})()

/**
 * Returns a stream containing only first `number` of elements of the given
 * `source` stream or all elements, if `source` stream has less than `number`
 * of elements. If `number` is not passed it defaults to `1`.
 * @param {Function} source
 *    source stream
 * @param {Number} number=1
 *    number of elements to take from stream
 */
function head(source, number) {
  return function stream(next, stop) {
    var left = number || 1
    source(function onElement(element) {
      if (left-- <= 0) return null
        next(element)
        if (left <= 0 && stop) stop()
    }, function onStop(error) {
      if (left <= 0) return null
      number = 0
      stop(error)
    })
  }
}
exports.head = head

/**
 * Returns a stream equivalent to given `source` stream, except that the first
 * `number` of elements are omitted. If `source` stream has less than `number`
 * of elements, then empty stream is returned. `number` defaults to `1` if it's
 * not passed.
 * @param {Function} source
 *  source stream to return tail of.
 * @param {Number} number=1
 *    Number of elements that will be omitted.
 */
function tail(source, number) {
  return function stream(next, stop) {
    var left = number || 1
    source(function onElement(element) {
      if (left-- > 0) return null
      next(element)
    }, stop)
  }
}
exports.tail = tail
}

/**
 * Returns a stream that contains all elements of each stream in the order they
 * appear in the original streams. If any of the `source` streams is stopped
 * with an error than it propagates to the resulting stream and it also get's
 * stopped.
 * @examples
 *    var stream = join(list(1, 2), list('a', 'b'))
 *    stream(console.log)
 *    // 1
 *    // 2
 *    // 'a'
 *    // 'b'
 */
function append() {
  var sources = Array.prototype.slice.call(arguments)
  return function stream(next, stop) {
    var source
    function onStop(error) {
      if (error) return stop && stop(error)
      if ((source = sources.shift())) source(next, onStop)
      else return stop && stop()
    }
    onStop()
  }
}
exports.append = append

/**
 * Merges all the streams from the given stream of streams into one.
 */
exports.merge = function merge(streams) {
  return function stream(next, stop) {
    var open = 1
    function end(error) {
      if (!open) return false
      if (error) open = 0
      else open --

      if (!open) stop(error)
    }
    streams(function onStream(stream) {
      open ++
      stream(function onNext(value) { if (open) next(value) }, end)
    }, end)
  }
}

/**
 * Utility function to print streams.
 */
exports.print = function print(stream) {
  stream(console.log.bind(console), function onStop(error) {
    if (error) console.error(error)
    else console.log('<<')
  })
}

})
