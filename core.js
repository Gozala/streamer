/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false */
/*global define: true */

!(typeof(define) !== "function" ? function($){ $(typeof(require) !== 'function' ? (function() { throw Error('require unsupported'); }) : require, typeof(exports) === 'undefined' ? this : exports); } : define)(function(require, exports) {

'use strict';

function iterate(lambda, x) {
  return function stream(next) {
    next(x, iterate(lambda, lambda(x)))
  }
}
exports.iterate = iterate

function stream(first, rest) {
  return function stream(next) {
    next(first, rest)
  }
}
exports.stream = stream

function loop(lambda, condition, source) {
  source(function(head, tail) {
    if (condition(head, tail)) {
      lambda(head)
      loop(lambda, condition, tail)
    }
  })
}

function list() {
  /**
  Creates stream of given elements.
  @examples
    list('a', 2, {})(console.log)
  **/

  var elements = Array.prototype.slice.call(arguments)
  return function stream(next) {
    elements.length ? next(elements[0], list.apply(null, elements.slice(1)))
                    : next()
  }
}
exports.list = list

function empty(next) {
  /**
  Empty stream. Faster equivalent of `list()`.
  **/
  next()
}
exports.empty = empty

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
    source(function(head, tail) {
      n ? next(head, tail ? take(n - 1, tail) : tail) : next()
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

  return alter(function forward(head, tail, next, sources) {
    head || tail ? next(head, tail) :
    !sources.length ? next() :
    alter(forward, sources.shift(), sources)(next)
  }, arguments[0], Array.prototype.slice.call(arguments, 1))
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
  return alter(function forward(head, tail, next, state) {
    head || tail ? next(head, tail) :
    !state.tail ? next() :
    state.tail(function(head, tail) {
      (state.tail = tail) ? alter(forward, head, tail)(next) : next(head, tail)
    })
  }, empty, { tail: sources })
}
exports.flatten = flatten


function mix(source1, source2, source3) {
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
     // 2
     // 'a'
     // 'b'
  **/
  var sources = Array.prototype.slice.call(arguments)
  return function stream(next) {
    var tails = sources.slice(), heads = [], error, closed, waiting = 0

    !function rest(next) {
      next = [ next ]
      // If closed just pass the error.
      if (closed) return next.shift()(error)
      // If head is already cached just forward it.
      if (heads.length) return next.shift()(heads.shift(), rest)

      // If tails are already enqueued & head has not being forwarded yet
      // we start reading from each until we get a head.
      while (tails.length && next.length) {
        waiting = waiting + 1
        tails.shift()(function(head, tail) {
          waiting = waiting - 1
          if (tail) {
            tails.push(tail)
            heads.push(head)
          } else if (head) {
            closed = true
            error = head
          }
          if (next.length) rest(next.shift())
        })
      }

      // If item has not being forwarded yet and there's nothing left to
      // wait for we close the stream.
      if (!waiting && next.length) next.shift()()
    }(next)
  }
}
exports.mix = mix

function merge(source) {
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
    var sources = streams, heads = [], tails = [], waiting = 0, error, closed

    !function rest(next) {
      next = [ next ]

      if (closed) return next.shift()(error)
      if (heads.length) return next.shift()(heads.shift(), rest)

      while (tails.length && next.length) {
        waiting = waiting + 1
        tails.shift()(function(head, tail) {
          waiting = waiting - 1
          if (tail) {
            tails.push(tail)
            heads.push(head)
          } else if (head) {
            closed = true
            error = head
          }

          if (next.length) rest(next.shift())
        })
      }

      while (next.length && sources) {
        waiting = waiting + 1
        sources(function(head, tail) {
          waiting = waiting - 1
          sources = tail

          if (!tail && head) {
            closed = true
            error = head
          } else if (head) {
            tails.push(head)
          }

          if (next.length) rest(next.shift())
        })
      }

      if (!waiting && next.length) next.shift()()
    }(next)
  }
}
exports.merge = merge

function print(stream) {
  /**
  Utility function to print streams.
  @param {Function} stream
     stream to print
  @examples
     print(list('Hello', 'world'))
  **/

  console.log('<stream>')
  on(stream)(function next(element) {
    console.log(element)
  }, function stop(error) {
    error ? console.error('!!!', error, '!!!') : console.log('</stream>')
  })
}
exports.print = print


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

  var consumers = [], active
  return function stream(next) {
    consumers.push(next)
    if (!active) {
      active = true
      source(function(head, tail) {
        source = tail
        var observers = consumers.splice(0)
        while (observers.length) observers.shift()(head, tail ? stream : tail)
      })
    }
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

  var first, rest, ready = null, observers = []

  function deliver(head, tail) {
    if (!ready) {
      first = head
      rest = tail ? lazy(tail) : tail
      ready = true

      while (observers.length) observers.shift()(first, rest)
    }
  }

  return function stream(next) {
    ready ? next(first, rest) : observers.push(next)
    if (ready === null) (ready = false, source(deliver))
  }
}
exports.lazy = lazy

function delay(source, time) {
  time = time || 1
  return function stream(next) {
    source(function forward(head, tail) {
      setTimeout(next, time, head, tail ? delay(tail, time) : tail)
    })
  }
}
exports.delay = delay

});
