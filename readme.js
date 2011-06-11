/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false globalstrict: true */
/*global define: true setInterval: true */

/* html version: http://jeditoolkit.com/streamer/docs/readme.html */

'use strict';

// In computing, the term stream is used in a number of ways, in all cases
// referring to a sequence of elements made available over time.


// Let's create a very basic stream representing sequence of elements from 1 to
// 3.

function stream(next) {
  [ 1, 2, 3 ].forEach(function(element) {
    next(element)
  })
}

// From this example we can define stream as:
// function representing sequence of elements. It can be read by calling with
// one function argument, which will be called back with each element of
// sequence.

// So we can print our stream like this:
stream(function onEach(element) {
  console.log(element)
})
//
//      1
//      2
//      3
//

// Or, we can create a convenience
// [high-order function](http://en.wikipedia.org/wiki/Higher-order_function)
// for printing streams.

function print(stream) {
  stream(function onEach(element) {
    console.log(element)            // Print each element of the sequence.
  })
}

// And, print stream with it:
print(stream)
//
//      1
//      2
//      3
//

// Good, but!
// Stream is a sequence of elements **made available over time**.
// In other words sequence may be lazy, and our stream definition needs
// refinement:
//
// Stream is a function representing sequence of elements. It MAY be read by
// calling it with one function argument, that will be called back with each
// element when it becomes available.

// Let's create a function `numbers`, that takes `min` and
// `max` numbers and returns a lazy stream of random numbers in a given range.
// To make stream lazy, we will make it's new elements available every 20ms.
function numbers(min, max) { // Another high-order function to makes streams
  var delta = max - min
  return function stream(next) { // Actual stream that generates 
    setInterval(function generate() {
      // We yield random number in given range every 20ms.
      next(min + Math.round(Math.random() * delta))
    }, 20)
  }
}

// Make a stream of random numbers in 0 - 100 range.
var numberStream = numbers(0, 100)
// And we print it!!
print(numberStream)
//
//      29
//      33
//      45
//      ....
//

// Oops! Stream keeps printing this numbers infinitely. Right, that's because
// stream is infinite! So we may have finite and infinite streams and difference
// is that finite streams end / stop at some point. And if stream stops we need
// to know when that happens. To do that we will add second, optional `stop`
// callback argument that MUST be called once stream reach is it's end. Let's
// redefine our `print` function with this in mind:

function print(stream) {
  console.log(">>>")                    // Opening stream for reading
  stream(function onElement(element) {
    console.log(element)                // Print each element of stream.
  }, function onStop() {
    console.log("<<<")                  // Stream is stopped.
  })
}

// Now we need a stream to print. Instead of creating another basic stream,
// this time we will take more generic approach, by defining a function that
// takes array as an argument and returns stream of it's elements:

function list(array) {
  return function stream(next, stop) {
    array.forEach(function(element) {
      next(element)
    })
    stop()
  }
}

// Great lets print something now!

print(list(1, 2, 3))

// Right, we should have passed, array to the list. Yeah, so shit happens! And
// when it happens to the stream, it needs to do something about it. Only
// reasonable thing is to recover, and if not possible then stop itself and
// report reason of failure. This means that `stop` callback MAY be called
// with an error argument, indicating a reason of failure!

// Let's adjust our print and streams to do that:

function print(stream) {
  console.log(">>>")                      // Opening stream for reading
  stream(function onElement(element) {
    console.log(element)                  // Print each element of stream.
  }, function onStop(error) {
    if (!error) return console.log('<<<') // If no error is passed, stream ended
    // If there is an error print it out as well.
    console.log('!!!')
    console.error(error)
  })
}

// Lets make another version of function that returns stream of given elements,
// in this case though we will use arguments instead of requiring array
// argument.
function list() {
  // Capture arguments as an array.
  var elements = Array.prototype.slice.call(arguments, 0)
  // Stream takes two callback arguments, first is called with each element,
  // when it becomes available, and second after calling first with all the
  // elements of the stream.
  return function stream(next, stop) {
    // Yield each element of the stream by calling `next`. callback.
    elements.forEach(function(element) {
      next(element)
    })
    // When we reach end we stop a stream by calling `stop` callback if it's
    // passed.
    if (stop) stop()
  }
}

// Another attempt to print:
print(list(1, 2, 3))
//
//      >>>
//      1
//      2
//      3
//      <<<
//

// Lets refine our stream definition again:

// _Stream is a function representing sequence of elements. It MAY be read by
// calling it with one function argument, that will be called every time element
// when becomes available. Stream takes second optional function argument which
// is called once stream is stopped, either without arguments when stream runs
// out of elements or with an error indicating a reason of failure why stream
// was stopped._

// Let's do something interesting from a real life, like stream of all directory
// entries including entries from all nested directories (lstree).
//
// First we will have to create few stream based wrappers around node's fs
// functions. We will start with a function that takes path for a directory
// and returns lazy stream of it's entries. If reading a directory fails we
// will stop stream with an error:

var fs = require("fs")
function ls(path) {
  return function stream(next, stop) {
    //see: [http://nodejs.org/docs/v0.4.8/api/fs.html#fs.readdir](http://nodejs.org/docs/v0.4.8/api/fs.html#fs.readdir)
    fs.readdir(path, function onEntries(error, entries) {
      var entry
      // On error we stop a stream with that error.
      if (error) return stop(error)
      // Otherwise we yield each entry.
      while ((entry = entries.shift())) next(entry)
      // Once we yielded all entries we stop a stream.
      stop()
    })
  }
}

// Try it out for current working directory:
print(ls('./'))

//      >>>
//      .gitignore
//      History.md
//      package.json
//      readme.js
//      Readme.md
//      streamer.js
//      tests
//      <<<

// Next wrapper we will need is, `fs.stat`. We define function that `takes` path
// and returns lazy stream with only element representing `stat` of the given
// `path`. Lazy steam with one element can been seen as a promise or deferred,
// but if don't worry if you are not familiar with that pattern.
function stat(path) {
  return function stream(next, stop) {
    //see: [http://nodejs.org/docs/v0.4.8/api/fs.html#fs.stat](http://nodejs.org/docs/v0.4.8/api/fs.html#fs.stat)
    fs.stat(path, function onStat(error, stats) {
      // On error we stop a stream with that error.
      if (error) return stop(error)
      // We add path to the stat itself as it will be very convenient.
      stats.path = path
      // We yield `stats` and stop a stream.
      next(stats)
      stop()
    })
  }
}

// Try it out for current working directory:
print(stat('./'))
//
//      >>>
//      { dev: 234881026,
//      ino: 19933437,
//      mode: 16877,
//      nlink: 17,
//      uid: 502,
//      gid: 20,
//      rdev: 0,
//      size: 578,
//      blksize: 4096,
//      blocks: 0,
//      atime: Thu, 09 Jun 2011 10:51:25 GMT,
//      mtime: Thu, 09 Jun 2011 12:48:32 GMT,
//      ctime: Thu, 09 Jun 2011 12:48:32 GMT,
//      path: './' }
//      <<<
//

// Great now we are done with a wrappers. Now we can list entries of the
// directory, in order to list nested entries we need to distinguish directories
// form files. To do that we will create a function that takes directory entries
// stream and returns filtered stream containing only entries that are
// directories. We already can get stats from paths, so we just need to map entry
// paths to stats. Let's make a generic map function that takes stream and mapper
// function and returns stream of mapped elements.

function map(source, mapper) {
  return function stream(next, stop) {
    source(function onElement(element) {
      next(mapper(element))
    }, stop)
  }
}

// Lets try to map numbers into doubled values:
print(map(list(1, 2, 3), function(x) { return x * 2 }))
//
//      >>>
//      2
//      4
//      6
//      <<<
//

// Implementing a function now that is equivalent of `ls` with a diff that it
// returns stream of paths instead of entry filenames.

var join = require("path").join
function paths(path) { return map(ls(path), join.bind(null, path)) }

// Test drive:
print(paths(process.cwd()))
//
//      >>>
//      /Users/gozala/Projects/streamer/History.md
//      /Users/gozala/Projects/streamer/package.json
//      ...
//      <<<
//

// Now we need another equivalent of `paths` that returns stream of directory
// paths only. To do that we need to filter out directories. So let's implement
// generic filter function that takes stream of elements and filterer function
// and returns steam of elements for which filterer returned true.
function filter(source, filterer) {
  return function stream(next, stop) {
    source(function onElement(element) {
      if (filterer(element)) next(element)
    }, stop)
  }
}
// Simple example for filtering out odd numbers from number stream.
print(filter(list(1, 2, 3, 4), function(x) { return x % 2 }))
//
//      >>>
//      1
//      3
//      <<<
//

// Awesome, going back to our problem, to figure out weather we have a file
// path or directory path we need to map paths to stats and then filter out
// only ones from there that are directories:
function dirs(paths) { 
  var stats = map(paths, stat)
  var dirStats = filter(stats, function(stat) { return stat.isDirectory() })
  return map(dirStats, function(stat) { return stat.path })
}

// Unfortunately dir's not going to work, that's because `stats` stream is not
// a stream of `stat` elements, it is a stream of streams that are streams of
// `stat` elements. So what we need is sort of flattened version of that stream.
// This easy to do with another core `merge` function:
function merge(source) {
  return function stream(next, stop) {
    var open = 1
    function onStop(error) {
      if (!open) return false
      if (error) open = 0
      else open --

      if (!open) stop(error)
    }
    source(function onStream(stream) {
      open ++
      stream(function onNext(value) { if (open) next(value) }, onStop)
    }, onStop)
  }
}

// Let's try simple example:
print(merge(list(list(1, 2), list('a', 'b'))))
//
//      >>>
//      1
//      2
//      a
//      b
//      <<<
//

// Now we can refine our dirs function:
function dirs(paths) {
  var stats = merge(map(paths, stat))
  var dirStats = filter(stats, function(stat) { return stat.isDirectory() })
  return map(dirStats, function(stat) { return stat.path })
}

// Test drive:
print(dirs(paths(process.cwd())))
//
//      >>>
//      /Users/gozala/Projects/streamer/.git
//      /Users/gozala/Projects/streamer/node_modules
//      ...
//      <<<
//

// Finally we have all we need to implement `lstree`:
function lstree(path) {
  var entries = paths(path)
  var nested = merge(map(dirs(entries), lstree))
  return merge(list(entries, nested))
}

// Crossing a fingers!!
print(lstree('./'))
//
//      >>>
//      .git
//      .git/COMMIT_EDITMSG
//      .git/config
//      ....
//      <<<
//

// So let's take a look back now, if we ignore all the core stream functions
// that are part of [streamer library](https://github.com/Gozala/streamer) and
// some node `fs` wrappers, we have written code that does deals with recursive
// asynchronous code, but with code that has a very linear flow. Take another
// look at it with all the noise removed:

function paths(path) { return map(ls(path), join.bind(null, path)) }
function dirs(paths) { 
  var stats = map(paths, stat)
  var dirStats = filter(stats, function(stat) { return stat.isDirectory() })
  return map(dirStats, function(stat) { return stat.path })
}
function lstree(path) {
  var entries = paths(path)
  var nested = merge(map(dirs(entries), lstree))
  return merge(list(entries, nested))
}

// Feel free to take a look at another example of using [streams in browser]
// (http://jeditoolkit.com/streamer/demos/axis.html). Or discover even more
// utility functions [in the source](https://github.com/Gozala/streamer/blob/master/streamer.js)
