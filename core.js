/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true esnext: true
         forin: false latedef: false */
/*global define: true */

!(typeof(define) !== "function" ? function($){ $(typeof(require) !== 'function' ? (function() { throw Error('require unsupported'); }) : require, typeof(exports) === 'undefined' ? this : exports); } : define)(function(require, exports) {

'use strict';

var unbind = Function.call.bind(Function.bind, Function.call)
// Convenience shortcut for Array.prototype.slice.call(args, n)
var slice = unbind(Array.prototype.slice)
// Convenience shortcut for Array.prototype.concat.apply([], [ [1], [2] ])
var unzip = Function.apply.bind(Array.prototype.concat, Array.prototype)

function reducer(f) {
  /**
  Takes `f` function and returns wrapped one instead that reduces arguments
  to it via `f`. For example `reducer(f)(a, b, c, d)` is equivalent of
  `f(a, f(b, f(c, d)))`.
  **/
  return function reduced(first) { return slice(arguments, 1).reduce(f, first) }
}

function pack(f) {
  /**
  Takes `f` function and returns a wrapper function that will pass all the
  arguments starting from `f.length - 1` via array under last argument.

  ## Examples

  var sum = pack(function(x, rest) {
    return rest.reduce(function(a, b) { return a + b }, x)
  })
  **/
  var arity = f.length - 1
  return function packed() {
    var args = slice(arguments, 0, arity)
    args[arity] = slice(arguments, arity)
    return f.apply(this, args)
  }
}
exports.utils = { reducer: reducer, pack: pack }

function resolution(value) {
  /**
  Returns non-standard compliant (`then` does not returns a promise) promise
  that resolves to a given `value`. Used just internally only.
  **/
  return { then: function then(resolve) { resolve(value) } }
}

function rejection(reason) {
  /**
  Returns non-standard compliant promise (`then` does not returns a promise)
  that rejects with a given `reason`. This is used internally only.
  **/
  return { then: function then(resolve, reject) { reject(reason) } }
}

function attempt(f) {
  /**
  Returns wrapper function that delegates to `f`. If `f` throws then captures
  error and returns promise that rejects with a thrown error. Otherwise returns
  return value. (Internal utility)
  **/
  return function attempt(options) {
    try { return f(options) }
    catch(error) { return rejection(error) }
  }
}

function isPromise(value) {
  /**
  Returns true if given `value` is promise. Value is assumed to be promise if
  it implements `then` method.
  **/
  return value && typeof(value.then) === 'function'
}

function defer(prototype) {
  /**
  Returns object containing following properties:
  - `promise` Eventual value representation implementing CommonJS [Promises/A]
    (http://wiki.commonjs.org/wiki/Promises/A) API.
  - `resolve` Single shot function that resolves returned `promise` with a given
    `value` argument.
  - `reject` Single shot function that rejects returned `promise` with a given
    `reason` argument.

  Given `prototype` argument is used as a prototype of the returned `promise`
  allowing one to implement additional API. If prototype is not passed then
  it falls back to `Object.prototype`.

  ## Examples

  // Simple usage.
  var deferred = defer()
  deferred.promise.then(console.log, console.error)
  deferred.resolve(value)

  // Advanced usage
  var prototype = {
    get: function get(name) {
      return this.then(function(value) {
        return value[name];
      })
    }
  }

  var foo = defer(prototype)
  deferred.promise.get('name').then(console.log)
  deferred.resolve({ name: 'Foo' })
  //=> 'Foo'
  */
  var pending = [], result
  prototype = (prototype || prototype === null) ? prototype : Object.prototype

  // Create an object implementing promise API.
  var promise = Object.create(prototype, {
    then: { value: function then(resolve, reject) {
      // create a new deferred using a same `prototype`.
      var deferred = defer(prototype)
      // If `resolve / reject` callbacks are not provided.
      resolve = resolve ? attempt(resolve) : resolution
      reject = reject ? attempt(reject) : rejection

      // Create a listeners for a enclosed promise resolution / rejection that
      // delegate to an actual callbacks and resolve / reject returned promise.
      function resolved(value) { deferred.resolve(resolve(value)) }
      function rejected(reason) { deferred.resolve(reject(reason)) }

      // If promise is pending register listeners. Otherwise forward them to
      // resulting resolution.
      if (pending) pending.push([ resolved, rejected ])
      else result.then(resolved, rejected)

      return deferred.promise
    }}
  })

  var deferred = {
    promise: promise,
    resolve: function resolve(value) {
      /**
      Resolves associated `promise` to a given `value`, unless it's already
      resolved or rejected.
      **/
      if (pending) {
        // store resolution `value` as a promise (`value` itself may be a
        // promise), so that all subsequent listeners can be forwarded to it,
        // which either resolves immediately or forwards if `value` is
        // a promise.
        result = isPromise(value) ? value : resolution(value)
        // forward all pending observers.
        while (pending.length) result.then.apply(result, pending.shift())
        // mark promise as resolved.
        pending = null
      }
    },
    reject: function reject(reason) {
      /**
      Rejects associated `promise` with a given `reason`, unless it's already
      resolved / rejected.
      **/
      deferred.resolve(rejection(reason))
    }
  }

  return deferred
}
exports.defer = defer

function promise(value, prototype) {
  /**
  Returns a promise resolved to a given `value`. Optionally second `prototype`
  arguments my be provided to be used as a prototype for a returned promise.
  **/
  var deferred = defer(prototype)
  deferred.resolve(value)
  return deferred.promise
}
exports.promise = promise

function future(f, options, prototype) {
  /**
  Returned a promise that immediately resolves to `f(options)` or
  rejects on exception. If third argument optional `prototype` is
  provided it will be used as prototype for a return promise.
  **/
  return promise(options, prototype).then(f)
}
exports.future = future

function lazy(f, options, prototype) {
  /**
  This is just like future with a difference that it will call `f` on demand
  deferring this until (if ever) `then` of the returned promise is called.
  **/
  var result
  prototype = (prototype || prototype === null) ? prototype : Object.prototype
  return Object.create(prototype, {
    then: { value: function then(resolve, reject) {
      result = result || future(f, options)
      return result.then(resolve, reject)
    }}
  })
}
exports.lazy = lazy

exports.run = run
function run(task) {
  /**
  (fabjs) like API for chaining stream operations into more readable forms.

  ## Examples

  !((run)
    (Stream.of, 1, 2, 3, 4)
    (filter, function(x) { return x % 2 })
    (map, function(x) { return x * x })
    (print))    // <stream 1 9 />
  **/
  var result, index, then, fab
  fab = pack(function runner(task, params) {
    index = run.index in task ? task[run.index] : params.length
    if (then) params.splice(index, 0, { then: then })
    result = task.apply(null, params)
    fab.then = then = result && result.then
    return fab
  })
  return fab.apply(null, arguments)
}
run.on = function runon(stream) {
  /**
  API similar to `run` with a difference that first argument passed to it will
  be used as a target to which all following operations will be performed.

  ## Examples

  !((run.on)
    (Stream.of(1, 2, 3, 4))
    (filter, function(x) { return x % 2 })
    (map, function(x) { return x * x })
    (print))    // <stream 1 9 />
  **/
  return run(function task() { return stream })
}
run.index = ':this-index'

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
  print(take(5, ones))    // <stream 1 1 1 1 1 />
  **/
  tail = tail || Stream.empty
  var stream = { head: head }
  stream.tail = isPromise(tail) ? tail : lazy(tail, stream)
  return promise(stream)
}

Stream.error = function error(reason) {
  /**
  Returns a stream that will error with a given `reason`.


  ## Examples

  var boom = Stream.error('Boom!')
  print(append(Stream.of(1, 2, 3), boom)) // <stream 1 2 3 /Boom!>
  **/
  var deferred = defer()
  deferred.reject(reason)
  return deferred.promise
}
/**
Empty stream. Empty stream resolves to `null`.
**/
Stream.empty = promise(null)

exports.repeat = repeat
function repeat(value) {
  /**
  Returns an infinite stream of a given `value`.

  ## Examples

  var ones = Stream.repeat(1)
  print(take(5, ones))  // <stream 1 1 1 1 1 />
  print(take(11, ones)) // <stream 1 1 1 1 1 1 1 1 1 1 1 />
  **/
  return Stream(value, function rest(stream) { return stream })
}

exports.iterate = iterate
function iterate(f, value) {
  /**
  Returns an infinite stream of `value, fn(value), fn(fn(value)), ....`.
  (`fn` must be free of side-effects).


  ## Examples

  var numbers = Stream.iterate(function(n) { return n + 1 }, 0)
  print(take(5, numbers)    // <stream 0 1 2 3 4 />
  print(take(15, numbers))  // <stream 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 />
  **/
  return Stream(value, function rest(stream) {
    return iterate(f, f(stream.head))
  })
}

Stream.from = function from(value) {
  /**
  Creates stream from the given array, string or arguments object.

  ## Examples

  print(Stream.from([ 1, 2, 3, 4 ]))   // <stream 1 2 3 4 />
  print(Stream.from('hello'))          // <stream h e l l o />
  **/
  return !value.length ? Stream.empty : Stream(value[0], function rest() {
    return Stream.from(slice(value, 1))
  })
}

Stream.of = function of() {
  /**
  Returns stream of given arguments.

  ## Examples

  Stream.of('a', 2, {}) // <stream a 2 [object Object] />
  **/
  return Stream.from(arguments)
}

exports.capture = exports['catch'] = capture
function capture(f, stream) {
  /**
  Returns new stream created from the given `stream` by lazily handling it's
  each item until an error occurs, in which case it's passed to given `f`
  handler that is expected to return a substitution stream containing items
  from that point on or `null` to stop a stream.

  ## Examples

  var source = capture(function(error) {
    // Swap error with -1
    return Stream.of(-1)
  }, append(Stream.of(1, 2, 3, 4), Stream.error('Boom!')))
  print(source)                 // <stream 1 2 3 4 -1 />
  **/

  return lazy(function() {
    return stream.then(function(stream) {
      return stream && Stream(stream.head, capture(f, stream.tail))
    }, f)
  })
}

exports.finalize = finalize
function finalize(f, stream) {
  /**
  Returns new stream that contains all items at of the given `stream` followed
  by all items of a stream returned by a `f` function if it returns anything.
  If given `stream` has an error, it's substituted with an items of a stream
  retuned by the `f` and followed by the same error. This makes it a perfect
  fit for a cleanup tasks without capturing original errors.
  **/

  return append(capture(function(error) {
    return append(future(f), Stream.error(error))
  }, stream), lazy(f))
}

exports.alter = alter
function alter(f, stream) {
  /**
  Returns new stream created from the given `stream` by lazily applying given
  `f` to each element resolution (`[head, tail]` pair or `null` in the end).
  Each element resolution (including `null` identifying an end) is passed to
  `f` function that **must** return substitution. Which is either stream or
  `null` (identifying end). Please note that even though `alter` returns result
  immediately, `stream` is still altered on demand.

  ## Examples

  function power(n, stream) {
    return alter(function(stream) {
      console.log('!')
      // If not an end substitute head and tail with power of `n`. Otherwise
      // return an end.
      return stream && Stream(Math.pow(stream.head, n), power(n, stream.tail))
    }, stream)
  }

  var powered = power(2, Stream.of(1, 2, 3, 4))
  // Notice that only one `!` logged. That's because one element is processed.
  print(take(1, powered))   // ! <stream 1 />

  function append(a, b) {
    return alter(function(stream) {
      // If not an end then append `b` to a tail, otherwise substitute `null`
      // with `b`.
      return stream ? Stream(stream.head, append(stream.tail, b)) : b
    }, a)
  }
  var ab = append(Stream.of(1, 2, 3), Stream.of(4, 5, 6, 7))
  print(ab)                 // <stream 1 2 3 4 5 6 7 />
  **/
  return lazy(function() { return stream.then(f) })
}

exports.edit = edit
function edit(f, stream) {
  /**
  Returns new edited form of the given `stream` by lazily applying given `f`
  function to each element resolution except end `null`. This is function is
  just like alter with only difference that stream end `null` propagates to the
  resulting stream bypassing `f` (This simplifies `f` interface, since it's
  guaranteed to be called only with an objects that contain `head` and `tail`
  properties).

  ## Examples

  function power(n, stream) {
    return edit(function(stream) {
      return Stream(Math.pow(stream.head, n), power(n, stream.tail))
    }, stream)
  }

  var powered = power(2, Stream.of(1, 2, 3, 4))
  print(powered)   // ! <stream 1 4 9 16 />
  **/
  return alter(function(stream) {
    return stream && f(stream)
  }, stream)
}

exports.print = (function(fallback) {
  // `print` may be passed a writer function but if not (common case) then it
  // should print with existing facilities. On node use `process.stdout.write`
  // to avoid line breaks that `console.log` uses. If there is no `process`
  // then fallback to `console.log`.
  fallback = typeof(process) !== 'undefined' ? function write() {
    process.stdout.write(slice(arguments).join(' '))
  } : console.log.bind(console)

  return function print(stream, write, continuation) {
    /**
    Utility method for printing streams. Optionally print may be passed a
    `write` function that will be used for writing. If `write` not passed it
    will fallback to `process.stdout.write` on node or to `console.log` if not
    on node.
    @param {Function} [write]
    **/
    write = write || fallback
    if (!continuation) setTimeout(write, 1, '<stream')
    stream.then(function(stream) {
      setTimeout(write, 1, '', stream ? stream.head : '/>')
      if (stream) print(stream.tail, write, true)
    }, function(reason) {
      setTimeout(write, 1, '/', reason, '>')
    })
  }
})()
exports.print[run.index] = 0

exports.take = take
function take(n, stream) {
  /**
  Returns stream containing first `n` (or all if has less) items of `this`
  stream. For more generic API see `take.while`.
  @param {Number} n
    Number of items to take.

  ## Examples

  var numbers = Stream.of(10, 23, 2, 7, 17)
  print(take(2, numbers))             // <stream 10 23 />
  print(take(100, numbers))           // <stream 10 23 2 7 17 />
  print(take(Infinity, numbers))      // <stream 10 23 2 7 17 />
  print(take(0, numbers))             // <stream />
  **/
  return n <= 0 ? Stream.empty : edit(function(stream) {
    return Stream(stream.head, take(n - 1, stream.tail))
  }, stream)
}
// Note, that we quote 'while` & provide `until` alias since use of keywords
// like `while` is forbidden in older JS engines.
take['while'] = take.until = function takewhile(f, stream) {
  /**
  Returns stream containing only first `n` items on which given `f` predicate
  returns `true`. Since older JS engines do not allow keywords as properties,
  this function is also exposed via `take.until` function.


  ## Examples

  var numbers = Stream.iterate(function(n) { return n + 1 }, 0)
  var digits = take.while(function(n) {
    return n <= 9
  }, numbers)
  print(digits)                 // <stream 0 1 2 3 4 5 6 7 8 9 />
  **/
  return edit(function(stream) {
    return f(stream.head) ? Stream(stream.head, takewhile(f, stream.tail)) : null
  }, stream)
}

exports.drop = drop
function drop(n, stream) {
  /**
  Returns stream of this items except first `n` ones. Returns empty stream
  has less than `n` items.
  @param {Number} n
    Number of items to drop.

  ## Examples

  var numbers = Stream.of(10, 23, 2, 7, 17)
  print(drop(3, numbers))         // <stream 7 17 />
  print(drop(100, numbers))       // <stream />
  print(drop(0, numbers))         // <stream 10 23 2 7 17 />
  **/
  return n <= 0 ? stream : edit(function(stream) {
    return drop(n - 1, stream.tail)
  }, stream)
}

// Note, that we quote 'while` & provide `until` alias since use of keywords
// like `while` is forbidden in older JS engines.
drop['while'] = drop.until = function dropwhile(f, stream) {
  /**
  Returns stream containing all except first `n` items on which given `f`
  predicate returns `true`. Since older JS engines do not allow keywords as
  properties, this function is also exposed via `drop.until` function.

  ## Examples

  var numbers = Stream.iterate(function(n) { return n + 1 }, -10)
  var positives = drop.while(function(n) {
    return n < 0
  }, numbers)
  print(take(5, positives))                 // <stream 0 1 2 3 4 />
  **/
  return edit(function(stream) {
    return f(stream.head) ? dropwhile(f, stream.tail) : stream
  }, stream)
}

exports.head = head
exports.first = head   // alias for people from clojure.
function head(stream) {
  /**
  Returns stream that contains only first item of the given stream.
  **/
  return edit(function(stream) {
    return Stream(stream.head, Stream.empty)
  }, stream)
}

exports.tail = tail
exports.rest = tail   // alias for people from clojure.
function tail(stream) {
  /**
  Returns stream that contains all element of the given stream except the first
  one.
  **/
  return edit(function(stream) {
    return stream.tail
  }, stream)
}

exports.map = map
function map(f, stream) {
  /**
  Returns a stream consisting of the result of applying `f` to the
  items of `this` stream.
  @param {Function} fn
     function that maps each value

  ## Examples

  var objects = Stream.of({ name: 'foo' },  { name: 'bar' })
  var names = map(function($) { return $.name }, objects)
  print(names)       // <stream foo bar />

  var numbers = Stream.of(1, 2, 3)
  var doubles = map(function onEach(number) { return number * 2 }, numbers)
  print(doubles)     // <stream 2 4 6 />
  **/
  return edit(function(stream) {
    return Stream(f(stream.head), map(f, stream.tail))
  }, stream)
}
map.all = function mapall(f) {
  return map(function(zipped) {
    return f.apply(null, zipped)
  }, zip.all.apply(null, slice(arguments, 1)))
}
map.all[run.index] = 1

exports.filter = filter
function filter(f, stream) {
  /**
  Returns a stream of items from the given `stream` on which `f` predicate
  returns `true`.
  @param {Function} f
      predicate function
  @param {Stream}
      stream to filter

  ## Examples
  var numbers = Stream.of(10, 23, 2, 7, 17)
  var digits = filter(function(value) {
    return value >= 0 && value <= 9
  }, numbers)
  print(digits)      // <stream 2 7 />
  **/
  return edit(function(stream) {
    return f(stream.head) ? Stream(stream.head, filter(f, stream.tail))
                          : filter(f, stream.tail)
  }, stream)
}

exports.reduce = reduce
function reduce(f, stream, initial) {
  /**
  returns stream containing result of applying `f` to the `initial`
  and first item of stream, then applying `f` to that result and the
  2nd item, etc.. If stream has no items then stream containing
  `initial` is retuned.

  ## Examples

  var sum = reduce(function(x, y) {
    return x + y
  }, Stream.of(1, 2, 3), 0) // <stream 6 />
  **/
  return lazy(function(result) {
    var deferred = defer()
    function accumulate(stream) {
      if (!stream) return deferred.resolve(Stream.of(result))
      result = f(result, stream.head)
      stream.tail.then(accumulate, deferred.reject)
    }
    stream.then(accumulate, deferred.reject)
    return deferred.promise
  }, initial)
}
reduce[run.index] = 1

exports.zip = zip
function zip(first, second) {
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
  return lazy(function() {
    var future = second.then()
    return capture(function(reason) {
      return alter(function(stream) {
        return stream && Stream.error(reason)
      }, future)
    }, edit(function(first) {
      return first && edit(function(second) {
        return second && Stream([ first.head, second.head ],
                                zip(first.tail, second.tail))
      }, second)
    }, first))
  })
}
zip[run.index] = 0

zip.all = reducer(function zipall(first, rest) {
  return map(unzip, zip(first, rest))
})
zip.all[run.index] = 0

exports.append = append
function append(first, rest) {
  /**
  Returns a stream consisting of all items of `first` stream followed by
  all items of `rest` stream. All errors will propagate to the resulting
  stream. To append more than two streams use `append.all(first, second, ...)`
  instead.

  ## Examples

  print(append(Stream.of(1, 2), Stream.of('a', 'b')))         // <stream 1 2 a b />
  print(append.all(Stream.of(1), Stream.of(2), Stream.of(3))) // <stream 1 2 3 />
  **/
  rest = rest || Stream.empty
  return alter(function(stream) {
    return stream ? Stream(stream.head, append(stream.tail, rest)) : rest
  }, first)
}
append[run.index] = 0

append.all = reducer(append)
append.all[run.index] = 0

exports.flatten = flatten
function flatten(stream) {
  /**
  Takes `stream` of streams and returns stream consisting of items from each
  stream in the given `stream` in order as they appear there. All errors
  propagate up to the resulting stream.

  ## Examples

  var stream = flatten(Stream.of(delay(Stream.of('async')), Stream.of(1, 2)))
  print(stream)      // <stream async 1 2 />
  **/
  return edit(function(stream) {
    return append(stream.head, flatten(stream.tail))
  }, stream)
}

function expand(f, stream) {
  /**
  Takes `stream` and expands each item in it using given `f` by returning a
  stream of expansion elements. This is just a convenience shortcut for
  `flatten(map(f, stream))`.
  **/
  return flatten(map(f, stream))
}
exports.expand = expand;

exports.mix = mix
function mix(source, rest) {
  /**
  Returns a stream consisting of all items from `source` and `rest` stream in
  order of their accumulation. This is somewhat parallel version of `append`,
  since it starts reading from both streams simultaneously and yields head that
  comes in first. If streams are synchronous, first come firs serve makes no
  real sense, in which case, resulting stream contains first items of both
  streams, followed by second items of both streams, etc.. All errors
  propagate to the resulting. In order to `mix` more than two streams use
  `mix.all(a, b, c, ...)` instead.

  ## Examples

  var stream = mix(Stream.of(1, 2), (Stream.of('a', 'b'))
  print(stream)   // <stream 1 a 2 b />
  print(mix(delay(Stream.of(1, 2)), Stream.of(3, 4)))  // <stream 3 4 1 2 />
  **/
  rest = rest || Stream.empty
  return lazy(function() {
    var pending = [ defer(), defer() ]
    var first = pending[0].promise
    var last = pending[1].promise

    function resolve(value) { pending.shift().resolve(value) }
    function reject(reason) { pending.shift().reject(reason) }

    source.then(resolve, reject)
    rest.then(resolve, reject)

    return alter(function(stream) {
      return stream ? Stream(stream.head, mix(last, stream.tail)) : last
    }, first)
  })
}
mix[run.index] = 0

mix.all = reducer(mix)
mix.all[run.index] = 0

exports.merge = merge
function merge(stream) {
  /**
  Takes `stream` of streams and returns stream consisting of all items of each
  item stream in the order of their accumulation. This is somewhat parallel
  version of `flatten`, as it starts reading from all item streams
  simultaneously and yields head that comes first. If streams are synchronous,
  first come first serve makes no real sense, in which case, this function
  will behave as flatten. All errors will propagate to the resulting stream.

  ## Examples

  var async = delay(Stream.of('async', 'stream'))
  var stream = Stream.of(async, Stream.of(1, 2, 3))
  print(stream)    // <stream 1 2 3 async stream />
  **/

  return edit(function(stream) {
    return mix(stream.head, merge(stream.tail))
  }, stream)
}

exports.delay = delay
function delay(ms, stream) {
  /**
  Takes a `source` stream and return stream of it's items, such that each
  element yield is delayed with a given `time` (defaults to 1) in milliseconds.
  **/
  return stream ? edit(function(stream) {
    var deferred = defer()
    setTimeout(deferred.resolve, ms, Stream(stream.head, delay(ms, stream.tail)))
    return deferred.promise
  }, stream) : delay(1, ms)
}

exports.each = each
function each(f, e, stream) {
  /**
  Takes `f` and optionally `e` functions and a `stream` as arguments. Calls `f`
  with each item of the given `stream`. If optional `e` is passed it's called
  whenever given `stream` reaches it's end or error occurs.
  **/
  if (!stream) return each(f, null, e)
  stream.then(function onEach(stream) {
    if (!stream) e && e(null)
    else if (false !== f(stream.head)) each(f, e, stream.tail)
  }, e)
}

});
