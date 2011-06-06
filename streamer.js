/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false */
/*global define: true */

(typeof define !== "function" ? function($){ $(require, exports, module); } : define)(function(require, exports, module, undefined) {

"use strict";


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
function map(input, mapper) {
  return function stream(next, stop) {
    input(function onElement(element) {
      next(mapper(element))
    }, stop)
  }
}
exports.map = map

/**
 * Returns stream of filtered values.
 * @param {Function} input
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
function filter(input, filterer) {
  return function stream(next, stop) {
    input(function onElement(element) {
      if (filterer(element)) next(element)
    }, stop)
  }
}
exports.filter = filter

/**
 * Returns stream of reduced values
 * @param {Function} input
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
function reduce(input, reducer, initial) {
  return function stream(next, stop) {
    var value = initial
    input(function onElement(element) {
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
