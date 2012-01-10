/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true esnext: true
         forin: false latedef: false */
/*global define: true */

!(typeof(define) !== "function" ? function($){ $(typeof(require) !== 'function' ? (function() { throw Error('require unsupported'); }) : require, typeof(exports) === 'undefined' ? this : exports); } : define)(function(require, exports) {

'use strict';

/*
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
*/ 

exports.Stream = Stream
function Stream(head, tail) {
  var stream = Object.create(Stream.prototype)
  stream.head = head
  stream.tail = typeof(tail.then) === 'function' ? tail : Stream.tail(tail, stream)
  return stream
}

Stream.promise = function Promise(next) {
  return Object.create(this && this.prototype || Promise.prototype, {
    then: { value: function then(deliver, reject) {
      var value, error, forward, propagate, pending = true
      next.call(this, function(chunck) {
        pending = false
        value = deliver ? deliver.call(chunck, chunck) : chunck
        if (forward) forward(value)
      }, function(reason) {
        pending = false
        if (reject) value = reject(value)
        else error = reason
      })

      return Promise.call(this, function(deliver, reject) {
        if (pending) {
          forward = deliver
          propagate = reject
        }
        else if (deliver && value) deliver(value)
        else if (reject && error) reject(error)
      })
    }, enumerable: true }
  })
}

Stream.print = function() {
  var write = typeof(process) === 'undefined' ? console.log.bind(console) : function() {
    process.stdout.write(Array.prototype.slice.call(arguments).join(' '))
  }
  return function print(stream, continuation) {
    /**
    Utility function to print streams.
    @param {Function} stream
       stream to print
    @examples
       print(list('Hello', 'world'))
    **/
    stream.then(function(stream) {
      setTimeout(function(stream) {
        if (!stream) return write(':>')
        if (!continuation) write('<')
        write(':' + stream.head)
        print(stream.tail, true)
      }, 1, stream)
    })
  }
}()
exports.print = Stream.print

Stream.tail = function tail(next, stream) {
  return Stream.promise(function(deliver, reject) {
    next.call(stream).then(deliver, reject)
  })
}

Stream.repeat = function repeat(value) {
  /**
  Returns a stream of `value`s.
  **/
  return Stream(value, function rest() { return this })
}
Stream.iterate = function iterate(fn, value) {
  /**
  Returns a stream of `value, fn(value), fn(fn(value))` etc.
  `fn` must be free of side-effects.
  **/
  return Stream(value, function rest() {
    return Stream.iterate(fn, fn(this.head))
  })
}
/**
  Empty stream. Faster equivalent of `list()`.
**/
Stream.empty = Stream.promise(function(deliver) { deliver(null) })

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
  return !value.length ? Stream.empty : Stream(value[0], function rest() {
    return Stream.from(Array.prototype.slice.call(value, 1))
  })
}

Stream.map = function map(fn) {
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
  var streams = Array.prototype.slice.call(arguments, 1)
  var stream = streams.reduce(function(stream, source) {
    stream.zip(source)
  }, streams.shift())
  return stream.map(Array.flatten).map(fn)
}

Stream.prototype.then = function then(deliver) {
  var value = deliver ? deliver.call(this, this) : this
  return Stream.promise(function(deliver) {
    deliver.call(value, value)
  })
}

Stream.prototype.alter = function alter(transform, handle) {
  /**
  Returns a stream that wraps `this` one and lazily `transform` it every time
  `then` is called. Function transform is called on each `then` and passes
  accumulated `head` and `tail` via `this` pseudo variable. Stream returned
  by the `transform` will fulfill values of the returned stream by this
  function. In other words result of this function is an equivalent of the
  stream returned by the `transform` function (Difference is that `alter`
  returns stream immediately while transform is called on demand).
  **/
  return Object.create(this, {
    then: { value: function then(deliver, reject) {
      return Object.getPrototypeOf(this).then(function(value) {
        var result = transform ? transform.call(value, value) : value
        return deliver ? deliver(result) : result
      }, handle || reject)
    }}
  })
}

Stream.prototype.map = function map(fn) {
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
  return this.alter(function() {
    return this && Stream(fn(this.head), this.tail.map(fn))
  })
}
Stream.prototype.take = function take(n) {
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
  return this.alter(function() {
    return n - 1 > 0 ? this && Stream(this.head, this.tail.take(n - 1))
                     : this && Stream(this.head, Stream.empty)
  })
}

Stream.prototype.drop = function drop(n) {
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
  return this.alter(function() {
    return this && n > 0 ? this.tail.drop(n - 1) : this
  })
}

Stream.prototype.filter = function filter(fn) {
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
  return  this.alter(function() {
    return !this ? this :
           fn(this.head) ? Stream(this.head, this.tail.filter(fn)) :
           this.tail.filter(fn)
  })
}

Stream.prototype.zip = function zip(source1, source2, source3) {
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
  var sources = Array.prototype.slice.call(arguments)
  sources.unshift(this)
  sources.unshift(Array)
  return Stream.map.apply(sources)
}

Stream.prototype.append = function append(source) {
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
  return this.alter(function() {
    return this ? Stream(this.head, this.tail.append(source)) : source
  })
}

Stream.prototype.flatten = function flatten() {
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
  return this.alter(function(stream) {
    return this && this.head.append(this.tail.flatten())
  })
}

Stream.prototype.mix = function mix(source) {
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
  var self = this
  return Stream.promise(function(deliver, reject) {
    var values = [], observers = []

    function forward(deliver, reject) {
      if (values.length) deliver(values.shift())
      else observer.push(deliver)
    }

    function fulfill() {
      if (observers.length) observers.shift()(this)
      else values.push(this)
    }

    var first = Stream.promise(forward)
    var second = Stream.promise(forward)
    var mixed = first.then(function() {
      return this ? Stream(this.head, this.tail.mix(second)) : this.second
    })

    mixed.then(deliver, reject)

    self.then(fulfill)
    source.then(fulfill)
  })
}

Stream.prototype.merge = function merge() {
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
  return this.alter(function() {
    return this && this.head.mix(this.tail.merge())
  })
}
var ones = Stream.promise(function(deliver) {
  deliver(Stream(1, this))
})
var twos = ones.map(function(n) {
  return n + 1
})

Stream.prototype.handle = function handle(fn) {
  /**
  Takes an error `handler` function that is called on error in the given
  source stream. `lambda` will be called with an error value and a sub-stream
  reading which caused an error. If error handler returns a stream it will be
  used as tail of the given stream from that point on, otherwise error will
  propagate.
  **/
  return this.alter(null, fn)
}

Stream.prototype.delay = function delay(ms) {
  /**
  Takes a `source` stream and return stream of it's elements, such that each
  element yield is delayed with a given `time` (defaults to 1) in milliseconds.
  **/
  return this.alter(function forward() {
    return this && Stream.promise(function(deliver) {
      setTimeout(deliver, ms || 1, Stream(this.head, this.tail.delay(ms)))
    })
  })
}

Stream.prototype.lazy = function lazy() {
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
  return this.alter(function() {
    return Stream(this.head, this.tail.lazy())
  })
}

Stream.prototype.on = function on(next, stop) {
  /**
  Function takes a stream and returns function that can register `next` and
  `stop` listeners. `next` listener is called with each element of the given
  stream or until it returns `false`. `stop` listener is called once `source`
  stream is exhausted without arguments or with an error arguments error
  occurs. `stop` listener is optional, it won't be called if `next` will return
  `false`. Function will basically read stream until it's exhausted or `false`
  is returned.
  **/
  this.then(function() {
    if (!this) stop()
    else if (false !== next(this.head)) this.tail.on(next, stop)
  }, stop)
}

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

});
