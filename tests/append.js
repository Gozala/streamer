/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var Stream = require('../core').Stream

exports.Assert = require('./assert').Assert

exports['test append empty streams'] = function(test, complete) {
  var actual = Stream.empty.append(Stream.empty)
  test(actual).to.be.empty().then(complete)
}

exports['test append empty'] = function(test, complete) {
  var actual = Stream.of(1, 2).append(Stream.empty)
  test(actual).to.be(1, 2).then(complete)
}

exports['test append to empty'] = function(test, complete) {
  var actual = Stream.empty.append(Stream.of(3, 4))
  test(actual).to.be(3, 4).then(complete)
}

exports['test append many streams'] = function(test, complete) {
  var actual = Stream.of(1, 2).append(Stream.empty).
                               append(Stream.of('a', 'b')).
                               append(Stream.empty)
  test(actual).to.be(1, 2, 'a', 'b').then(complete)
}

exports['test append sync & async streams'] = function(test, complete) {
  var async = Stream.of(3, 2, 1).delay()
  var actual = async.append(Stream.empty).
                     append(async).
                     append(Stream.of('a', 'b'))
  test(actual).to.be(3, 2, 1, 3, 2, 1, 'a', 'b').then(complete)
}

exports['test append & reappend'] = function(test, complete) {
  var async = Stream.of(3, 2, 1).delay()
  var stream = async.append(Stream.of('a', 'b'))
  var actual = stream.append(Stream.of('||').append(stream))
  test(actual).to.be(3, 2, 1, 'a', 'b', '||', 3, 2, 1, 'a', 'b').then(complete)
}

exports['test map broken stream'] = function(test, complete) {
  var boom = Error('Boom!')
  var async = Stream.of(3, 2, 1).append(Stream.error(boom)).delay()
  var actual = Stream.of('>').append(async).
                              append(Stream.of(1, 2)).
                              append(async)

  test(actual).to.have.elements('>', 3, 2, 1).and.error(boom).then(complete)
}

if (module == require.main)
  require('test').run(exports);

});
