/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

'use strict';

var Stream = require('../core').Stream

exports.Assert = require('./assert').Assert
exports['test filter empty'] = function(test, complete) {
  var actual = Stream.empty.filter(function onEach(element) {
    assert.fail('filter function was executed')
  })
  test(actual).to.be.empty().and.then(complete)
}

exports['test number filter'] = function(test, complete) {
  var numbers = Stream.of(1, 2, 3, 4)
  var evens = numbers.filter(function onElement(number) {
    return !(number % 2)
  })
  test(evens).to.be(2, 4).then(complete)
}

exports['test filter with async stream'] = function(test, complete) {
  var stream = Stream.of(5, 4, 3, 2, 1).delay()
  var odds = stream.filter(function(number) { return number % 2 })
  test(odds).to.be(5, 3, 1).then(complete)
}

exports['test filter broken stream'] = function(test, complete) {
  var boom = Error('Boom!')
  var stream = Stream.of(3, 2, 1).append(Stream.error(boom)).delay()
  var actual = stream.filter(function(number) { return number % 2 })

  test(actual).to.have.elements(3, 1).and.error(boom).then(complete)
}

if (module == require.main)
  require('test').run(exports);

});
