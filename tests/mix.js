/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var Stream = require('../core').Stream

exports.Assert = require('./assert').Assert

exports['test mix empty streams'] = function(expect, complete) {
  var actual = Stream.empty.mix(Stream.empty)
  expect(actual).to.be.empty().and.then(complete)
}

exports['test mix with empty'] = function(expect, complete) {
  var actual = Stream.of(1, 2).mix(Stream.of())
  expect(actual).to.be(1, 2).then(complete)
}

exports['test mix to empty'] = function(expect, complete) {
  var actual = Stream.empty.mix(Stream.of(3, 4))
  expect(actual).to.be(3, 4).then(complete)
}

exports['test mix many streams'] = function(expect, complete) {
  var actual = Stream.of(1, 2).mix(Stream.empty).
                               mix(Stream.of('a', 'b')).
                               mix(Stream.empty)

  expect(actual).to.be(1, 'a', 2, 'b').then(complete)
}

exports['test mix sync & async streams'] = function(expect, complete) {
  var async = Stream.of(3, 2, 1).delay()
  var actual = async.mix(Stream.empty).
                     mix(async).
                     mix(Stream.of('a', 'b'))
  expect(actual).to.be('a', 'b', 3, 3, 2, 2, 1, 1).then(complete)
}

exports['test mix & remix'] = function(expect, complete) {
  var async = Stream.of(3, 2, 1).delay()
  var mixed = async.mix(Stream.of('a', 'b'))
  var actual = mixed.mix(Stream.of('||').mix(mixed))

  expect(actual).to.be('a', '||', 'b', 'a', 'b', 3, 3, 2, 2, 1, 1).then(complete)
}

exports['test mix broken stream'] = function(expect, complete) {
  var boom = Error('Boom!!')
  var broken = Stream.error(boom)
  var async = Stream.of(3, 2, 1).mix(broken).delay()
  var actual = Stream.of('>').mix(async).mix(Stream.of('a', 'b')).mix(async)

  expect(actual).to.have.elements('>', 'a', 'b', 3).and.error(boom).then(complete)
}

if (module == require.main)
  require('test').run(exports);

});
