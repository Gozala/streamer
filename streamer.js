/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false */
/*global define: true */

(typeof define !== "function" ? function($){ $(require, exports, module); } : define)(function(require, exports, module, undefined) {

"use strict";

/**
 * Creates range stream that streams values from the given range.
 * @examples
 *    range(1, 3)(console.log)
 *    // 1
 *    // 2
 *    // 3
 */
exports.range = function range(from, to) {
  return function stream(next, stop) {
    // While elements are in range we yield them.
    while (from <= to) next(from ++)
    // Once all elements are yielded we stop the stream if there is a listener
    // for that.
    if (stop) stop()
  }
}

/**
 * Creates stream of given objects keys.
 * @examples
 *    keys({ a: 1, b: 2 })(console.log)
 *    // a
 *    // b
 */
exports.keys = function keys(object) {
  return function stream(next, stop) {
    for (var key in object) next(key)
    if (stop) stop()
  }
}

/**
 * Creates stream of values for the given object.
 * @examples
 *    values({ a: 1, b: 2 })(console.log)
 *    // 1
 *    // 2
 */
exports.values = function values(object) {
  return function stream(next, stop) {
    for (var key in object) next(object[key])
    if (stop) stop()
  }
}


/**
 * Creates stream of array values.
 * @examples
 *    list([ 'a', 2, {} ])(console.log)
 */
exports.list = function list(elements) {
  return function stream(next, stop) {
    elements.forEach(next)
    if (stop) stop()
  }
}

exports.enumerate = function enumerate(object) {
  return function stream(next, stop) {
    for (var key in object) next([ key, object[key] ])
    if (stop) stop()
  }
}

/**
 * Returns stream of mapped values.
 * @param {Function} input
 *    source stream to be mapped
 * @param {Function} map
 *    function that maps each value
 * @examples
 *    var stream = list([ { name: 'foo' },  { name: 'bar' } ])
 *    var names = map(stream, function(value) { return value.name })
 *    names(console.log)
 *    // 'foo'
 *    // 'bar'
 */
exports.map = function map(input, map) {
  return function stream(next, stop) {
    input(function onValue(value) { next(map(value)) }, stop)
  }
}

/**
 * Returns stream of filtered values.
 * @param {Function} input
 *    source stream to be filtered
 * @param {Function} filter
 * @examples
 *    var numbers = list([ 10, 23, 2, 7, 17 ])
 *    var digits = filter(numbers, function(value) {
 *      return value >= 0 && value <= 9
 *    })
 *    digits(console.log)
 *    // 2
 *    // 7
 */
exports.filter = function filter(input, filter) {
  return function stream(next, stop) {
    input(function onValue(value) { if (filter(value)) next(value) }, stop)
  }
}

/**
 * Returns stream of reduced values
 */
function reduce(source, reducer, initial) {
  return function input(next, stop) {
    var result = initial
    input(function reduce(value) {
      next(result = reducer(value, result))
    }, function end(error) {
      stop(error, result)
    })
  }
}

/**
 * The zip function takes varied number of streams and returns a single stream
 * where each value is the combination of all streams.
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
exports.zip = function zip() {
  var inputs = Array.prototype.slice.call(arguments)
  return function stream(next, stop) {
    var values = [], ended = [], id
    function isReady() {
      var id = values.length
      while (0 <= --id) { if (!values[id].length) return false }
      return true
    }
    function isEnded() {
      var id = ended.length
      while (0 <= --id) { if (!ended[id]) return false }
      return true
    }
    function shift() {
      var id = values.length, value = []
      while (0 <= --id) { value.unshift(values[id].shift()) }
      return value
    }
    function end(id, error) {
      ended[id] = true
      if (error || isEnded()) {
        values = ended = null
        if (stop) stop(error)
      }
    }
    function push(id, value) {
      if (values) {
        values[id].push(value)
        if (isReady()) next(shift())
      }
    }

    id = inputs.length
    while (0 <= --id) {
      values.push([])
      ended.push(false)
    }
    id = values.length
    while (0 <= --id) inputs[id](push.bind(null, id), end.bind(null, id))
  }
}

exports.limit = function limit(input, max) {
  return function stream(next, stop) {
    var limit = max
    input(function onNext(value) {
      // Already have reached limit
      if (!limit) return false
      if (--limit) next(value)
      else stop()
    }, function onStop(error) {
      if (limit) stop(error)
    })
  }
}

exports.once = function once(input) {
  return exports.limit(input, 1)
}

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

/**
 * Returns stream of values of all the given streams. Values of each stream
 * starting from the first one is streamed until it's stopped. If stream is just
 * ended values from the following stream are streamed if stream was stopped
 * with an error then joined stream is also stopped with an error.
 * @examples
 *    var stream = join(list([1, 2]), list(['a', 'b']))
 *    stream(console.log)
 *    // 1
 *    // 2
 *    // 'a'
 *    // 'b'
 */
exports.join = function join() {
  var inputs = Array.prototype.slice.call(arguments)
  return function stream(next, stop) {
    var input
    function end(error) {
      if (error) return stop && stop(error)
      if ((input = inputs.shift())) input(next, end)
      else return stop && stop()
    }
    end()
  }
}

})
