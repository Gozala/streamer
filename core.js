/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true esnext: true
         forin: false latedef: false */
/*global define: true */

!(typeof(define) !== "function" ? function($){ $(typeof(require) !== 'function' ? (function() { throw Error('require unsupported'); }) : require, typeof(exports) === 'undefined' ? this : exports); } : define)(function(require, exports) {

'use strict';

exports.Promise = Promise
function Promise() {
  /**
  Returns object containing following properties:
  - `promise` Eventual value representation implementing CommonJS [Promises/A]
    (http://wiki.commonjs.org/wiki/Promises/A) API.
  - `resolve` Single shot function that resolves returned `promise` with a given
    `value` argument.
  - `reject` Single shot function that rejects returned `promise` with a given
    `reason` argument.

  If `this` pseudo-variable is passed, then `this.prototype` is used as a
  prototype of the returned `promise` allowing one to implement additional API.

  ## Examples

  // Simple usage.
  var deferred = Promise()
  deferred.promise.then(console.log, console.error)
  deferred.resolve(value)

  // Advanced usage
  function Foo() {
    // Details...
  }
  Foo.prototype.get = function get(name) {
    return this.then(function(value) {
      return value[name];
    })
  }
  Foo.defer = Promise

  var foo = Foo.defer()
  deferred.promise.get('name').then(console.log)
  deferred.resolve({ name: 'Foo' })
  //=> 'Foo'
  **/
  var pending = [], result
  var promise = Object.create(this && this.prototype || Promise.prototype, {
    then: { value: function then(resolve, reject) {
      var deferred = Promise.call(this.constructor)
      resolve = resolve || Promise.resolution
      reject = reject || Promise.rejection
      function resolved(value) {
        deferred.resolve(resolve.call(value, value))
      }
      function rejected(reason) { deferred.resolve(reject(reason)) }
      if (pending) pending.push({ resolve: resolved, reject: rejected })
      else result.then(resolved, rejected)

      return deferred.promise
    }, enumerable: true }
  })

  var deferred = Object.create(promise, {
    promise: { value: promise, enumerable: true },
    resolve: { value: function resolve(value) {
      /**
      Resolves associated `promise` to a given `value`, unless it's already
      resolved or rejected.
      **/
      if (pending) {
        result = Promise.it(value)
        pending.forEach(function onEach(observer) {
          result.then(observer.resolve, observer.reject)
        })
        pending = null
      }
    }, enumerable: true },
    reject: { value: function reject(reason) {
      /**
      Rejects associated `promise` with a given `reason`, unless it's already
      resolved or rejected.
      **/
      deferred.resolve(Promise.rejection(reason))
    }, enumerable: true }
  })
  return deferred
}
Promise.isPromise = function isPromise(value) {
  /**
  Returns true if given `value` is promise. Value is assumed to be promise if
  it implements `then` method.
  **/
  return value && typeof(value.then) === 'function'
}
Promise.resolution = function resolution(value) {
  /**
  Returns promise that resolves to a given `value`.
  **/
  return { then: function then(resolve) { resolve.call(value, value) } }
}
Promise.rejection = function rejection(reason) {
  /**
  Returns promise that rejects with a given `reason`.
  **/
  return { then: function then(resolve, reject) { reject(reason) } }
}
Promise.it = function it(value) {
  /**
  Returns `value` back if it's a promise or returns a promise that resolves to
  a given `value`.
  **/
  return Promise.isPromise(value) ? value : Promise.resolution(value)
}

exports.Stream = Stream
function Stream(head, tail) {
  /**
  Returns stream that has given `head` and `tail`. If `tail` is not a stream
  then it's assumed to be a function that returns `tail` stream once called.

  ## examples

  var one2four = Stream(1, Stream(2, Stream(3, Stream(4))))
  one2four.print() // <stream 1 2 3 4 />

  // Lazy
  var ones = Stream(1, function() { return this })
  ones.take(5).print()    // <stream 1 1 1 1 1 />
  **/
  tail = tail || Stream.empty
  return Promise.isPromise(tail) ? Object.create(Stream.prototype, {
    head: { enumerable: true, value: head },
    tail: { enumerable: true, value: tail }
  }) : Stream.lazy(head, tail)
}
Stream.defer = Promise
Stream.promise = function promise(task, self) {
  /**
  Creates a stream promise that will call `task` once it's consumed.
  Returned stream promise is resolved / rejected with a value that is passed to
  a `task` callback.
  @param {Function} task
      Function is passed `resolve` and `reject` callbacks.
  @param {Object} [self]
      Optional argument that will be passed to the `task` as this
      pseudo-variable.

  ## examples

  var async = Stream.promise(function(resolve, reject) {
    setTimeout(resolve, 1000, Stream('hello', Stream('world')))
  })
  // will print in 1000ms
  async.print() // <stream hello world />
  **/
  return Object.create(this && this.prototype || Stream.prototype, {
    then: { value: function then(resolve, reject) {
      var deferred = this.constructor.defer()
      task.call(self || this, deferred.resolve, deferred.reject)
      return deferred.promise.then(resolve, reject)
    }, enumerable: true }
  })
}
Stream.lazy = function lazy(head, rest) {
  /**
  Creates a stream out of `head` and a given `rest` function that is
  expected to return stream `tail` once called. This makes it possible to
  create infinite lazy recursive streams. Function `rest` will be passed
  a stream it should return tail for as a first argument and `this`
  pseudo-variable.

  ## Examples

  var ones = Stream.lazy(1, function rest() { return this })
  **/
  var stream = Object.create(this.prototype)
  return Object.defineProperties(stream, {
    head: { enumerable: true, value: head },
    tail: { enumerable: true, value: this.promise(function(deliver, reject) {
      var tail = rest.call(this, this) || Stream.error('Invalid tail: ' + rest)
      tail.then(deliver, reject)
    }, stream) }
  })
}
Stream.error = function error(reason) {
  /**
  Returns a stream that will error with a given `reason`.


  ## Examples

  var boom = Stream.error('Boom!')
  Stream.of(1, 2, 3).append(boom).print() // <stream 1 2 3 /Boom!>
  **/
  var deferred = this.defer()
  deferred.reject(reason)
  return deferred.promise
}
/**
Empty stream. Empty stream resolves to `null`.
**/
Stream.empty = Stream.promise(function(resolve) { resolve(null) })
Stream.repeat = function repeat(value) {
  /**
  Returns an infinite stream of a given `value`.

  ## Examples

  var ones = Stream.repeat(1)
  ones.take(5).print()  // <stream 1 1 1 1 1 />
  ones.take(11).print() // <stream 1 1 1 1 1 1 1 1 1 1 1 />
  **/
  return this(value, function rest() { return this })
}
Stream.iterate = function iterate(fn, value) {
  /**
  Returns an infinite stream of `value, fn(value), fn(fn(value)), ....`.
  (`fn` must be free of side-effects).


  ## Examples

  var numbers = Stream.iterate(function(n) { return n + 1 }, 0)
  numbers.take(5).print()   // <stream 0 1 2 3 4 />
  numbers.take(15).print()  // <stream 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 />
  **/
  return this(value, function rest() {
    return this.constructor.iterate(fn, fn(this.head))
  })
}
Stream.from = function from(value) {
  /**
  Creates stream from the given array, string or arguments object.

  ## Examples

  Stream.from([ 1, 2, 3, 4 ]).print()   // <stream 1 2 3 4 />
  Stream.from('hello').print()          // <stream h e l l o />
  **/
  return !value.length ? this.empty : this(value[0], function rest() {
    return this.constructor.from(Array.prototype.slice.call(value, 1))
  })
}
Stream.of = function of() {
  /**
  Returns stream of given arguments.

  ## Examples

  Stream.of('a', 2, {}) // <stream a 2 [object Object] />
  **/
  return this.from(arguments)
}
/*
Stream.map = function map(fn) {
  /**
  Returns a stream consisting of the result of applying `fn` to the
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
  ** /
  var streams = Array.prototype.slice.call(arguments, 1)
  var stream = streams.reduce(function(stream, source) {
    stream.zip(source)
  }, streams.shift())
  return stream.map(Array.flatten).map(fn)
}
*/

Stream.prototype.then = function then(resolve, reject) {
  /**
  Streams implement [Promises/A](http://wiki.commonjs.org/wiki/Promises/A) API.
  Given `resolve` callback is passed `this` stream as first argument and `this`
  pseudo-variable once it's head is accumulated. In case of error reject handler
  is called with a reason of error. Function returns stream that is resolved
  with a return value of `resolve(stream)` or `reject(reason)` in case of error.
  **/
  var deferred = this.constructor.defer()
  resolve = resolve || Promise.resolution
  deferred.resolve(resolve.call(this, this))
  return deferred.promise
}
Stream.prototype.alter = function alter(transform, handle) {
  /**
  Primary function for composing streams out of `this` stream. This method is
  pretty much like `then` with a difference that it's lazy. In other words this
  method returns a stream that wraps `this` one and lazily `transform` it once
  resulting stream is consumed (`then` is being called on it). Given `transform`
  is called on each `then` and is passed accumulated stream with a `head` and
  `tail` properties via first argument and `this` pseudo-variable (If stream is
  empty `null` is passed instead). Returned stream will resolve to a return
  value of `transform`. In other words result of this function is an equivalent
  of the stream returned by the `transform` function (Please not that `alter`
  returns stream immediately, but `transform` is called only on demand).

  ## Examples

  function power(stream) {
    "use strict"
    // In non-strict use `self` argument instead of `this`.
    return stream.alter(function fn(self) {
      console.log('!')
      return this && this.constructor(this.head * this.head, this.tail.alter(fn))
    })
  }
  var powered = power(Stream.of(1, 2, 3))
  // Notice that there were no `!` logged.
  powered.take(1).print()     // ! <stream 1 />
  // Notice that only one `!` logged that's because `fn` is called only once.
  **/
  return this.constructor.promise(function(resolve, reject) {
    var promise = this.then(transform, handle)
    promise.then(resolve, reject)
  }, this)
}
Stream.prototype.print = function(fallback) {
  // `print` may be passed a writer function but if not (common case) then it
  // should print with existing facilities. On node use `process.stdout.write`
  // to avoid line breaks that `console.log` uses. If there is no `process`
  // then fallback to `console.log`.
  fallback = typeof(process) !== 'undefined' ? function write() {
    process.stdout.write(Array.prototype.slice.call(arguments).join(' '))
  } : console.log.bind(console)

  return function print(write, continuation) {
    /**
    Utility method for printing streams. Optionally print may be passed a
    `write` function that will be used for writing. If `write` not passed it
    will fallback to `process.stdout.write` on node or to `console.log` if not
    on node.
    @param {Function} [write]
    **/
    write = write || fallback
    this.then(function() {
      setTimeout(function(stream) {
        if (!continuation) write('<stream')
        if (!stream) return write(' />')
        write('', stream.head)
        stream.tail.print(write, true)
      }, 1, this)
    }, function(reason) {
      write('', '/' + reason + '>')
    })
  }
}()
Stream.prototype.take = function take(n) {
  /**
  Returns stream containing first `n` (or all if has less) elements of `this`
  stream.
  @param {Number} n
    Number of elements to take.

  ## Examples

  var numbers = Stream.of(10, 23, 2, 7, 17)
  numbers.take(2).print()           // <stream 10 23 />
  numbers.take(100).print()         // <stream 10 23 2 7 17 />
  numbers.take().print()            // <stream 10 23 2 7 17 />
  numbers.take(0).print()           // <stream />
  **/
  n = n === undefined ? Infinity : n   // `n` falls back to infinity.
  return n === 0 ? Stream.empty : this.alter(function() {
    return n - 1 > 0 ? this && this.constructor(this.head, this.tail.take(n - 1))
                     : this && this.constructor(this.head, Stream.empty)
  })
}
Stream.prototype.drop = function drop(n) {
  /**
  Returns stream of this elements except first `n` ones. Returns empty stream
  has less than `n` elements.
  @param {Number} n
    Number of elements to drop.

  ## Examples

  var numbers = Stream.of(10, 23, 2, 7, 17)
  numbers.drop(3).print()         // <stream 7 17 />
  numbers.drop(100).print()       // <stream />
  numbers.drop().print()          // <stream 23 2 7 17 />
  numbers.drop(0).print()         // <stream 10 23 2 7 17 />
  **/
  n = n === undefined ? 1 : n       // `n` falls back to `1`.
  return this.alter(function() {
    return this && n > 0 ? this.tail.drop(n - 1) : this
  })
}
Stream.prototype.map = function map(f) {
  /**
  Returns a stream consisting of the result of applying `f` to the
  elements of `this` stream.
  @param {Function} fn
     function that maps each value

  ## Examples

  var objects = Stream.of({ name: 'foo' },  { name: 'bar' })
  var names = objects.map(function($) { return $.name })
  names.print()       // <stream foo bar />

  var numbers = Stream.of(1, 2, 3)
  var doubles = numbers.map(function onEach(number) { return number * 2 })
  doubles.print()     // <stream 2 4 6 />
  **/
  return this.alter(function() {
    return this && this.constructor(f(this.head), this.tail.map(f))
  })
}
Stream.prototype.filter = function filter(f) {
  /**
  Returns a stream of elements of this stream on which `f` returned `true`.
  @param {Function} f
    function that filters values

  ## Examples
  var numbers = Stream.of(10, 23, 2, 7, 17)
  var digits = numbers.filter(function(value) {
    return value >= 0 && value <= 9
  })
  digits.print()      // <stream 2 7 />
  **/
  return  this.alter(function() {
    return !this ? this :
           f(this.head) ? this.constructor(this.head, this.tail.filter(f)) :
           this.tail.filter(f)
  })
}
Stream.prototype.zip = function zip(source) {
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
  return Stream.promise(function() {
    var self = this.then()
    return source.then(function(source) {
      return source && self.then(function() {
        return this && this.constructor([ this.head, source.head ],
                                          this.tail.zip(source.tail))
      })
    })
  }, this)
}
Stream.prototype.append = function append(source) {
  /**
  Returns a stream consisting of elements of `this` stream followed by
  elements of the given `source` stream. Any errors from `this` or `source`
  stream propagate to the resulting stream.

  ## Examples

  var stream = Stream.of(1, 2).append('a', 'b')
  stream.print() // <stream 1 2 'a' 'b' />
  **/
  return this.alter(function() {
    return this ? this.constructor(this.head, this.tail.append(source)) : source
  })
}
Stream.prototype.flatten = function flatten() {
  /**
  Expects `this` to be a stream of streams and returns stream consisting of
  elements of each element stream in the same order as they appear there. All
  errors propagate up to the resulting stream.

  ## Examples

  var stream = Stream.of(Stream.of('async').delay(), Stream.of(1, 2)).flatten()
  stream.print()      // <stream async 1 2 />
  **/
  return this.alter(function(stream) {
    return this && this.head.append(this.tail.flatten())
  })
}
Stream.prototype.mix = function mix(source) {
  /**
  Returns a stream consisting of all elements of `this` and `source` stream in
  order of their accumulation. This is somewhat parallel version of `append`,
  since it starts reading both streams simultaneously and yields head that
  comes first. If streams are synchronous, first come firs serve makes no real
  sense, in which case, resulting stream contains first elements of both stream,
  followed by second elements of both streams, etc.. All errors will propagate
  to the resulting.
  @param {Stream} source
      Stream to mix elements of `this` stream with.

  ## Examples

  var stream = Stream.of(1, 2).mix(Stream.of('a', 'b'))
  stream.print()   // <stream 1 a 2 b />
  Stream.of(1, 2).delay().mix(Stream.of(3, 4)).print() // <stream 3 4 1 2 />
  **/
  return Stream.promise(function(resolve, reject) {
    var pending = [ this.constructor.defer(), this.constructor.defer() ]
    var first = pending[0].promise
    var last = pending[1].promise
    var result = first.alter(function() {
      return this ? this.constructor(this.head, last.mix(this.tail)) : last
    })

    function resolved(value) { pending.shift().resolve(value) }
    function rejected(reason) { pending.shift().reject(reason) }

    this.then(resolved, rejected)
    source.then(resolved, rejected)
    result.then(resolve, reject)
  }, this)
}
Stream.prototype.merge = function merge() {
  /**
  Expects `this` to be a stream of streams and returns stream consisting of
  elements of each element stream in the order of their accumulation. This is
  somewhat parallel version of `flatten`, since it starts reading from all
  element streams simultaneously and yields head that comes first. If streams
  are synchronous, first come first serve makes no real sense, in which case,
  this is exact equivalent of flatten. All errors will propagate to the
  resulting stream.

  ## Examples

  var async = Stream.of('async', 'stream').delay()
  var stream = Stream.of(async, Stream.of(1, 2, 3))
  stream.print()    // <stream 1 2 3 async stream />
  **/
  return this.alter(function() {
    return this && this.head.mix(this.tail.merge())
  })
}
Stream.prototype.handle = function handle(handler) {
  /**
  Takes an error `handler` function that is called with an error when it occurs
  in `this` stream. `handler` is expected to return a stream which will be used
  from that point on. Please note that `handler` wont automatically handle error
  that occur in streams returned by it.


  ## Examples

  var suspect = Stream.of(1, 2, 3, 4).append(Stream.error('Boom'))
  var fixed = suspect.handle(function(reason) {
    return reason === 'Boom' ? Stream(5) : Stream.error(reason)
  })
  fixed.print()   // <stream 1 2 3 4 5 />
  **/
  return this.alter(null, handler)
}
Stream.prototype.delay = function delay(ms) {
  /**
  Takes a `source` stream and return stream of it's elements, such that each
  element yield is delayed with a given `time` (defaults to 1) in milliseconds.
  **/
  return this.alter(function forward() {
    return this && Stream.promise(function(resolve) {
      setTimeout(resolve, ms || 1,
                 this.constructor(this.head, this.tail.delay(ms)))
    }, this)
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
  var value = this, error = this
  return Stream.promise(function forward(deliver, reject) {
    value !== this ? deliver(value) :
    error !== this ? reject(error) :
    this.then(function() {
      deliver((value = this && this.constructor(this.head, this.tail.lazy())))
    }, function(reason) {
      reject((error = reason))
    })
  }, this)
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
    if (!this) stop && stop()
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
