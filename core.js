/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true esnext: true
         forin: false latedef: false */
/*global define: true */

!(typeof(define) !== "function" ? function($){ $(typeof(require) !== 'function' ? (function() { throw Error('require unsupported'); }) : require, typeof(exports) === 'undefined' ? this : exports); } : define)(function(require, exports) {

'use strict';

function signal(observer, error, value) {
  // If error argument is passed then promise is rejected, otherwise it will
  // be fulfilled with a given value
  var handler = error ? observer.reject : observer.deliver

  // If handler is defined then `forwardValue` is a return value of the handler,
  // otherwise it's a given value.
  observer.forwardValue = handler ? handler(error || value) : value
  // If handler is defined then `forwardError` is null (since it was handled
  // via handler), otherwise it's a given error.
  observer.forwardError = handler ? null : error

  // If promise forwarder is already defined then forward values.
  observer.forward && observer.forward(observer.forwardError, observer.forwardValue)
}

function Promise(run) {
  var observers = [], pending = true, reason, result
  return Object.create(this && this.prototype || Promise.prototype, {
    then: { value: function then(deliver, reject) {
      var observer = { deliver: deliver, reject: reject, forward: null }
      // If promise is pending then register observer.
      if (pending) observers.push(observer)
      // If promise is already delivered then just signal observer.
      else signal(observer, reason, result)

      // If promise was not run to completion yet then run it.
      if (run) run(function(error, value) {
        run = null
        pending = false
        reason = error
        result = value
        observers.splice(0).forEach(function(observer) {
          signal(observer, reason, result)
        })
      })

      // Create a new promise that will be resolved with a value returned
      // by a deliver / reject handlers.
      return new this.constructor(function(forward) {
        if (pending) observer.forward = forward
        else forward(observer.forwardError, observer.forwardValue)
      })
    }}
  })
}

function Stream(head, tail) {
  var next = typeof(tail) === 'function' ? tail :
             !tail && typeof(head) === 'function' ? head : null
  head = head === next ? null : head
  tail = tail === next ? null : tail || next ? tail : Stream.empty

  return Object.create(Stream.prototype, {
    // If next is not defined then it's head is next.
    head: { value: head, enumerable: true },
    tail: { value: tail, enumerable: true, writable: true },
    next: { value: next }
  })
}

/**
  Empty stream. Faster equivalent of `list()`.
**/
Stream.empty = Stream()

Stream.of = function of() {
  /**
  Creates stream of given elements.
  @examples
    Stream.of('a', 2, {})       // => <'a', 2, {}>
  **/
  return Stream.from(arguments)
}

Stream.from = function from(value) {
  /**
  Creates stream from the given array / string.
  @examples
    Stream.from([ 1, 2, 3, 4 ])   // => <1, 2, 3, 4>
    Stream.from('hello')          // => <'h', 'e', 'l', 'l', 'o'>
  **/

  return !value.length ? Stream.empty : Stream(value[0], function() {
    return Stream.from(Array.prototype.slice.call(value, 1))
  })
}

Stream.promise = Promise
Stream.map = function map(fn) {
  var streams = Array.prototype.slice.call(arguments, 1)
  var stream = streams.reduce(function(stream, source) {
    stream.zip(source)
  }, streams.shift())
  return stream.map(Array.flatten).map(fn)
}

Stream.prototype.next = function next() { return this.tail }
Stream.prototype.then = function then(deliver, reject) {
  this.tail = this.tail || this.next && this.next()
  return this.head && this.tail ? (deliver ? deliver(this) : this) :
  this.head ? this.tail.then(deliver, reject) :
  (deliver ? deliver(null) : null)
}
Stream.prototype.take = function take(n) {
  return this.then(function forward(stream) {
    return !stream ? null :
           n - 1 > 0 ? Stream(stream.head, stream.tail.take(n - 1)) :
           Stream(stream.head, Stream.empty)
  })
}
Stream.prototype.drop = function drop(n) {
  return this.then(function forward(stream) {
    return !stream ? null :
           n > 0 ? stream.tail.drop(n - 1) :
           stream.tail
  })
}
Stream.prototype.filter = function filter(fn) {
  return  this.then(function forward(stream) {
    return !stream ? null :
           fn(stream.head) ? Stream(stream.head, stream.tail.filter(fn)) :
           stream.tail.filter(fn)
  })
}
Stream.prototype.map = function map(fn) {
  return this.then(function forward(stream) {
    return !stream ? null : Stream(fn(stream.head), stream.tail.map(fn))
  })
}
Stream.prototype.zip = function zip(source1, source2, source3) {
  var sources = Array.prototype.slice.call(arguments)
  sources.unshift(this)
  sources.unshift(Array)
  return Stream.map.apply(sources)
}
Stream.prototype.append = function append(source) {
  return this.then(function(stream) {
    return stream.isEmpty() ? source
                            : Stream.new(stream.head, stream.tail.append(source))
  })
}
Stream.prototype.flatten = function flatten() {
  return this.then(function(stream) {
    return stream.isEmpty() ? Stream.empty
                            : stream.head.append(stream.tail.flatten())
  })
}
Stream.prototype.mix = function mix(source) {
  var self = this
  return Stream(function rest() {
    var first = Stream.promise()
    var last = Stream.promise()
    var streams = [ first, last ]
    function deliver(stream) { Stream.deliver(streams.shift(), stream) }

    self.then(deliver)
    source.then(deliver)

    return first.then(function(first) {
      return first.isEmpty() ? last : Stream(first.head, first.tail.mix(last))
    })
  })
}
Stream.prototype.merge = function merge() {
  return this.then(function(stream) {
    return stream.isEmpty() ? stream
                            : stream.head.mix(stream.tail.merge())
  })
}
Stream.prototype.handle = function handle(fn) {
  return this.then(function forward(stream) {
    return stream.isEmpty() ? stream
                            : Stream.new(stream.head, stream.tail.handle(fn))
  }, function error(stream) {
    return fn(stream) || stream
  })
}
Stream.prototype.delay = function delay(ms) {
  return this.then(function forward() {
    return this.isEmpty() ? stream : Stream.new(function rest(next) {
      setTimeout(next, ms || 1, Stream.new(stream.head, stream.tail.delay(ms)))
    })
  })
}
Stream.prototype.lazy = function lazy() {
  return this.then(function forward(stream) {
    return Stream.new(stream.head, stream.tail.lazy())
  })
}

function print(stream, continuation) {
  /**
  Utility function to print streams.
  @param {Function} stream
     stream to print
  @examples
     print(list('Hello', 'world'))
  **/
  stream.when(function(stream) {
    if (!stream) return console.log('>')
    console.log((continuation ? '  :' : '<stream\n :') + stream.head)
    setTimeout(print, 1, stream.tail, true)
  })
}
exports.print = print

Stream.iterate = function iterate(lambda, value) {
  /**
  Returns a stream of `value, lambda(value), lambda(lambda(value))` etc.
  `lambda` must be free of side-effects.
  **/

  return Stream(value, iterate(lambda, lambda(value)))
}

function repeat(value, n) {
  /**
  Returns a stream of `n` `value`s. If `n` is not provided returns infinite
  stream of `value`s.
  **/

  n = n || Infinity
  return function stream(next) {
    n ? next(value, repeat(value, n - 1)) : next()
  }
}
exports.repeat = repeat

function head(source, number) {
  /**
  Returns a stream containing only first `number` of elements of the given
  `source` stream or all elements, if `source` stream has less than `number`
  of elements. If `number` is not passed it defaults to `1`.
  @param {Function} source
     source stream
  @param {Number} number=1
     number of elements to take from stream
  **/

  return function stream(next) {
    source(function interfere(head, tail) {
      next(head, tail ? empty : tail)
    })
  }
}
exports.head = exports.first = exports.peek = head

function tail(source, number) {
  /**
  Returns a stream equivalent to given `source` stream, except that the first
  `number` of elements are omitted. If `source` stream has less than `number`
  of elements, then empty stream is returned. `number` defaults to `1` if it's
  not passed.
  @param {Function} source
     source stream to return tail of.
  @param {Number} number=1
     Number of elements that will be omitted.
  **/

  return function stream(next) {
    source(function interfere(head, tail) {
      tail ? tail(next) : next(head)
    })
  }
}
exports.tail = exports.rest = tail

function take(n, source) {
  /**
  Returns stream containing first `n` elements of given `source` stream.

  @param {Number} n
    Number of elements to take.
  @param {Function} source
    source stream to take elements from.
  @examples
     var numbers = list(10, 23, 2, 7, 17)
     take(2, numbers)(console.log)
     // 10
     // 23
  **/
  return function stream(next) {
    !n ? next() : source(function(head, tail) {
      next(head, tail ? take(n - 1, tail) : tail)
    })
  }
}
exports.take = take

function drop(n, source) {
  /**
  Returns stream of all, but the first `n` elements of the given `source`
  stream.
  @param {Number} n
    Number of elements to take.
  @param {Function} source
    source stream to take elements from.
  @examples
     var numbers = list(10, 23, 2, 7, 17)
     drop(3, numbers)(console.log)
     // 10
     // 23
  **/
  return function stream(next) {
    source(function(head, tail) {
      (tail && n) ? drop(n - 1, tail)(next) : next(head, tail)
    })
  }
}
exports.drop = drop

function filter(lambda, source) {
  /**
  Returns stream of filtered values.
  @param {Function} lambda
    function that filters values
  @param {Function} source
    source stream to be filtered
  @examples
    var numbers = list(10, 23, 2, 7, 17)
    var digits = filter(function(value) {
      return value >= 0 && value <= 9
    }, numbers)
    digits(console.log)
    // 2
    // 7
  **/

  return function stream(next) {
    source(function interfere(head, tail) {
      !tail ? next(head, tail) :
      lambda(head) ? next(head, filter(lambda, tail)) :
      filter(lambda, tail)(next)
    })
  }
}
exports.filter = filter

function mapone(lambda, source) {
  /**
  Returns stream of mapped values.
  @param {Function} lambda
     function that maps each value
  @param {Function} input
     source stream to be mapped
  @examples
     var stream = list({ name: 'foo' },  { name: 'bar' })
     var names = map(function(value) { return value.name }, stream)
     names(console.log)
     // 'foo'
     // 'bar'
     var numbers = list(1, 2, 3)
     var mapped = map(function onEach(number) { return number * 2 }, numbers)
     mapped(console.log)
     // 2
     // 4
     // 6
  **/

  return function stream(next) {
    source(function interfere(head, tail) {
      tail ? next(lambda(head), mapone(lambda, tail)) : next(head, tail)
    })
  }
}
exports.mapone = mapone

function zipmap(lambda) {
  /**
  Returns a stream consisting of the result of applying `lambda` to the
  set of first elements of each stream, followed by applying `lambda` to the
  set of second elements in each stream, until any one of the streams is
  exhausted. Any remaining elements in other streams are ignored. Function
  `lambda` should accept number of stream arguments.
  @examples
    var s1 = list(1, 2, 3)
    var s2 = list(3, 4, 5, 6)
    var sums = mapmapStreams(function(a, b) { a + b }, s1, s2)
    sums(console.log)
     // 4
     // 6
     // 8
     // 2
     // 4
     // 6
  **/

  var sources = Array.prototype.slice.call(arguments, 1)
  return function steam(next) {
    var heads = [], tails = [ lambda ], closed, reason,
    index = -1, length = sources.length, waiting = length

    while (++index < length) {
      sources[index](function interfere(index, head, tail) {
        if (!closed) {
          if (tail) {
            heads[index] = head
            tails[index + 1] = tail
            if (--waiting === 0)
              next(lambda.apply(null, heads), zipmap.apply(null, tails))
          } else {
            closed = true
            next(reason = head, tail)
          }
        }
      }.bind(null, index))
    }
  }
}
exports.zipmap = zipmap

function map(lambda, source) {
  /**
  Returns a stream consisting of the result of applying `lambda` to the
  set of first elements of each stream, followed by applying `lambda` to the
  set of second elements in each stream, until any one of the streams is
  exhausted. Any remaining elements in other streams are ignored. Function
  `lambda` should accept number of stream arguments.
  @examples
    var s1 = list(1, 2, 3)
    var s2 = list(3, 4, 5, 6)
    var sums = map(function(a, b) { a + b }, s1, s2)
    sums(console.log)
     // 4
     // 6
     // 8
     // 2
     // 4
     // 6
  **/
  return arguments.length === 2 ? mapone(lambda, source)
                                : zipmap.apply(null, arguments)
}
exports.map = map

function zip() {
  /**
  This function returns stream of tuples, where the n-th tuple contains the
  n-th element from each of the argument streams. The returned stream is
  truncated in length to the length of the shortest argument stream.
  @params {Function}
     source steams to be combined
  @examples
     var a = list([ 'a', 'b', 'c' ])
     var b = list([ 1, 2, 3, 4 ])
     var c = list([ '!', '@', '#', '$', '%' ])
     var abc = zip(a, b, c)
     abs(console.log)
     // [ 'a', 1, '!' ]
     // [ 'b', 2, '@' ]
     // [ 'c', 3, '#' ]
  **/
  var args = Array.prototype.slice.call(arguments)
  args.unshift(Array)
  return zipmap.apply(null, args)
}
exports.zip = zip

function on(source) {
  /**
  Function takes a stream and returns function that can register `next` and
  `stop` listeners. `next` listener is called with each element of the given
  stream or until it returns `false`. `stop` listener is called once `source`
  stream is exhausted without arguments or with an error arguments error
  occurs. `stop` listener is optional, it won't be called if `next` will return
  `false`. Function will basically read stream until it's exhausted or `false`
  is returned.
  **/
  return function(next, stop) {
    source(function forward(head, tail) {
      tail ? false !== next(head) && tail(forward) : stop && stop(head)
    })
  }
}
exports.on = on


function append(source1, source2, source3) {
  /**
  Returns a stream that contains all elements of each stream in the order they
  appear in the original streams. If any of the `source` streams is stopped
  with an error than it propagates to the resulting stream and it also get's
  stopped.
  @examples
     var stream = append(list(1, 2), list('a', 'b'))
     stream(console.log)
     // 1
     // 2
     // 'a'
     // 'b'
  **/
  var sources = Array.prototype.slice.call(arguments)
  return function stream(next) {
    !sources.length ? next() : sources[0](function forward(head, tail) {
      tail ? next(head, append.apply(null, [tail].concat(sources.slice(1)))) :
      head ? next(head, tail) : append.apply(null, sources.slice(1))(next)
    })
  }
}
exports.append = append

function flatten(sources) {
  /**
  Takes `source` stream of streams and returns stream that contains all
  elements of each element stream in the order they appear there. Any error
  from any stream will propagate up to the resulting stream consumer.
  @param {Function} source
     Stream of streams.
  @examples
     function async(next, stop) {
       setTimeout(function() {
         next('async')
         stop()
       }, 10)
     }
     var stream = flatten(list(async, list(1, 2, 3)))
     stream(console.log)
     // 'async'
     // 1
     // 2
     // 3
  **/
  return function stream(next) {
    sources(function forward(source, sources) {
      !sources ? next(source, sources) : source(function interfere(head, tail) {
        tail ? next(head, flatten(exports.stream(tail, sources))) :
        head ? next(head, tail) : flatten(sources)(next)
      })
    })
  }
}
exports.flatten = flatten

function promise() {
  /**
  Creates stream promise, that will yield it's head, tail once promise as soon
  as promise is delivered, by calling `deliver` on promise with a desired
  `head` and `tail`.
  **/
  var observers = [], head, tail, delivered
  return Object.defineProperties(function stream(next) {
    delivered ? next(head, tail) : observers.push(next)
  }, {
    _deliver: { value: function deliver(first, rest) {
      if (delivered) return
      delivered = true
      head = first
      tail = rest
      while (observers.length) observers.shift()(head, tail)
    }
  }})
}
exports.promise = promise

function deliver(promise, head, tail) {
  /**
  Deliver given `head` & `tail` to the given `promise`.
  **/
  promise._deliver(head, tail)
}
exports.deliver = deliver

function mix(source, source2, source3) {
  /**
  Returns a stream that contains all elements of each stream in the order those
  elements are delivered. This is somewhat parallel version of `append`, since
  it starts reading from all sources simultaneously and yields head that comes
  first. If sources are synchronous, first come firs serve makes no real sense,
  in such case, resulting stream contains first elements of each source stream,
  followed by second elements of each source stream, etc.. Any error from any
  source stream will propagate up to the resulting stream consumer.
  @examples
     var stream = append(list(1, 2), list('a', 'b'))
     stream(console.log)
     // 1
     // 'a'
     // 2
     // 'b'
  **/
  var sources = Array.prototype.slice.call(arguments, 1)
  return function stream(next) {
    // Nothing to mix
    if (!source) return next()
    // Mix of one stream is a stream itself.
    if (!sources.length) return source(next)

    var first, second, promises = [ first = promise(), second = promise() ]
    function forward(head, tail) { deliver(promises.shift(), head, tail) }

    source(forward)
    mix.apply(null, sources)(forward)

    first(function forward(head, tail) {
      tail ? next(head, mix(second, tail)) :
      head ? next(head) : second(next)
    })
  }
}
exports.mix = mix

function merge(sources) {
  /**
  Takes `source` stream of streams and returns stream that contains all
  elements of each element stream in the order they are delivered. This is
  somewhat parallel version of `flatten`, since it starts reading from all
  element streams simultaneously and yields head that comes first. If sources
  are synchronous, first come firs serve makes no real sense, in such case,
  this is exact equivalent of flatten. Any error from any source stream will
  propagate up to the resulting stream consumer.
  @param {Function} source
     Stream of streams.
  @examples
     function async(next, stop) {
       setTimeout(function() {
         next('async')
         stop()
       }, 10)
     }
     var stream = merge(list(async, list(1, 2, 3)))
     stream(console.log)
     // 1
     // 2
     // 3
     // 'async'
  **/
  return function stream(next) {
    sources(function forward(source, sources) {
      !sources ? next(source, sources) : mix(source, merge(sources))(next)
    })
  }
}
exports.merge = merge

function hub(source) {
  /**
  Returns a stream equivalent to a given `source`, with difference that it
  has a state. Each new consumers will start reading it from the point it is
  at the moment. This is basically a [publish/subscribe]
  (http://en.wikipedia.org/wiki/Publish/subscribe) model for streams, useful
  with streams that represent some events (clicks, keypress, etc..)
  @param {Function} source
     Stream whose elements get published to a subscribers.
  @return {Function}
     Stream whose consumers become subscribers.
  @examples

     function range(from, to) {
       from = from || 0
       to = to || Infinity
       return function stream(next) {
         from < to ? setTimeout(next, 2, from, numbers(from + 1, to)) : next()
        }
     }

     var numbers = range(1, 5)
     print(function($) { '#1>' + $ }, numbers)
     setTimeout(function() { print(function($) { '#2>' + $ }, numbers) }, 5)

     // Output will look something like this:
     <stream>
     #1> 1
     #1> 2
     #1> 3
     <stream>
     #2> 1
     #1> 4
     #2> 2
     </stream>
     #2> 3
     #2> 4
     </stream>

     // If you noticed second print started form the first `1` element. Now
     // lets do similar thing with a hub.

     var numbers = range(1, 5)
     print(function($) { '#1>' + $ }, numbers)
     setTimeout(function() { print(function($) { '#2>' + $ }, numbers) }, 5)

     // In this case output will be different:

     <stream>
     #1> 1
     #1> 2
     #1> 3
     #1> 4
     <stream>
     #2> 4
     </stream>
     </stream>

     // Notice this time second print only printed only following elements.
  **/
  return function stream(next) {
    // Create promise for the head, tail pair of the source stream.
    var promised = promise()
    source(function(head, tail) {
      // If `tail` exists, then update state (override `source`, so that all
      // new subscribers start reading from there). Otherwise `source` is
      // exhausted, in this case keep `source` as is so that all new
      // subscribers get same end.
      source = tail || source
      // Deliver the `promise`, with `head` and same hub `stream`, but with
      // updated state. If there is no tail just forward it.
      deliver(promised, head, tail ? stream : tail)
    })
    // Register `subscriber` by reading from stream promise.
    promised(next)
  }
}
exports.hub = hub

function lazy(source) {
  /**
  Returns a stream equivalent to a given `source`, with a difference that it
  returned stream will cache it's head on first call and will wrap it's tail
  into lazy as well. While this boost subsequent reads it can have side effect
  of high memory usage. So it should be used with care for expensive
  computations (that require network access for example). Wrapping infinite 
  streams with this may not be the best idea, but possible since stream is lazy
  it will only cache part that was read.
  @param {Function} source
     source stream to cache.
  @returns {Function}
     lazy equivalent of the given source.
  **/

  var promised
  return function stream(next) {
    if (!promised) {
      promised = promise()
      source(function(head, tail) {
        deliver(promised, head, tail ? lazy(tail) : tail)
      })
    }
    promised(next)
  }
}
exports.lazy = lazy

function delay(source, time) {
  /**
  Takes a `source` stream and return stream of it's elements, such that each
  element yield is delayed with a given `time` (defaults to 1) in milliseconds.
  **/
  time = time || 1
  return function stream(next) {
    source(function forward(head, tail) {
      setTimeout(next, time, head, tail ? delay(tail, time) : tail)
    })
  }
}
exports.delay = delay

function handle(handler, source) {
  /**
  Takes an error `handler` function that is called on error in the given
  source stream. `lambda` will be called with an error value and a sub-stream
  reading which caused an error. If error handler returns a stream it will be
  used as tail of the given stream from that point on, otherwise error will
  propagate.
  **/
  return function stream(next) {
    source(function interfere(head, tail) {
      if (tail) return next(head, handle(handler, tail))
      tail = head ? handler(head, source) : tail
      tail ? tail(next) : next(head)
    })
  }
}
exports.handle = handle

});
