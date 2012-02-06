/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'), Stream = streamer.Stream,
    map = streamer.map, take = streamer.take, delay = streamer.delay,
    append = streamer.append

exports.Assert = require('./assert').Assert
exports['test map empty'] = function(expect, complete) {
  var actual = map(function(element) {
    expect.test.fail('map fn was executed')
  }, Stream.empty)
  expect(actual).to.be.empty().then(complete)
}

exports['test map.all with empty'] = function(expect, complete) {
  var actual = map(function(a, b) {
    return a + b
  }, Stream.empty, Stream.of(1, 2, 3, 4))

  expect(actual).to.be.empty().then(complete)
}

exports['test number map'] = function(expect, complete) {
  var numbers = Stream.of(1, 2, 3, 4)
  var actual = map(function(number) { return number * 2 }, numbers)
  expect(actual).to.be(2, 4, 6, 8).then(complete)
}

exports['test map.all same length streams'] = function(expect, complete) {
  var actual = map.all(function(a, b) {
    return a + b
  }, Stream.of(1, 2, 3, 4), Stream.from('abcd'))

  expect(actual).to.be('1a', '2b', '3c', '4d').then(complete)
}

exports['test map with async stream'] = function(expect, complete) {
  var source = delay(Stream.of(5, 4, 3, 2, 1))
  var actual = map(function(x) { return x + 1 }, source)
  expect(actual).to.be(6, 5, 4, 3, 2).then(complete)
}

exports['test map.all sync & async stream'] = function(expect, complete) {
  var actual = map.all(Array, delay(Stream.of(5, 4, 3, 2, 1)),
                       Stream.from('abcde'), Stream.from('~@!#'))

  expect(actual).to.be(
    [ 5, 'a', '~' ],
    [ 4, 'b', '@' ],
    [ 3, 'c', '!' ],
    [ 2, 'd', '#' ]
  ).then(complete)
}

exports['test map broken stream'] = function(expect, complete) {
  var boom = Error('Boom!')
  var source = append(Stream.of(3, 2, 1), Stream.error(boom))
  var actual = map(function(x) { return x * x }, delay(source))

  expect(actual).to.have.items(9, 4, 1).and.an.error(boom).then(complete)
}

exports['test map.all with late error'] = function(expect, complete) {
  var boom = Error('boom')
  var actual = map.all(function(a, b) {
    return a + b
  }, Stream.from('abc'), delay(append(Stream.of(3, 2, 1), Stream.error(boom))))

  expect(actual).to.be('a3', 'b2', 'c1').then(complete)
}

exports['test map.all with early error'] = function(expect, complete) {
  var boom = Error('Boom!!')
  var actual = map.all(Array,
                       delay(append(Stream.of(3, 2, 1), Stream.error(boom))),
                       Stream.from('abcd'))


  expect(actual).to.have.items([ 3, 'a' ], [ 2, 'b' ], [ 1, 'c' ]).
                 and.error(boom).then(complete)
}

if (module == require.main)
  require('test').run(exports)

});
