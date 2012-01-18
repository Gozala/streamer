/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true setTimeout: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';


var Stream = require('../core').Stream

exports.Assert = require('./assert').Assert

exports['test zip with empty'] = function(expect, complete) {
  var actual = Stream.empty.zip(Stream.of(1, 2))

  expect(actual).to.be.empty().then(complete)
}

exports['test zip 2 lists'] = function(expect, complete) {
  var actual = Stream.of(1, 2, 3, 4).zip(Stream.of('a', 'b', 'c', 'd'))

  expect(actual).to.be([ 1, 'a' ], [ 2, 'b' ], [ 3, 'c' ], [ 4, 'd' ]).
  then(complete)
}

/*
exports['test zip sync stream with async stream'] = function(expect, complete) {
  var a = delay(list(5, 4, 3, 2, 1))
  var b = list('a', 'b', 'c', 'd', 'e')
  var c = list('~', '@', '!', '#')

  var zipped = zip(a, b, c)

  test(expect, complete, zipped, [
    [ 5, 'a', '~'  ],
    [ 4, 'b', '@' ],
    [ 3, 'c', '!' ],
    [ 2, 'd', '#' ]
  ])
}
*/

exports['test zip with late error'] = function(expect, complete) {
  var boom = Error('boom')
  var actual = Stream.of(3, 2, 1).append(Stream.error(boom)).delay().
               zip(Stream.of('a', 'b', 'c'))

  expect(actual).to.have.elements([ 3, 'a' ], [ 2, 'b' ], [ 1, 'c' ]).
                 and.then(complete)
}

exports['test zip with early error'] = function(expect, complete) {
  var boom = Error('Boom!!')
  var actual = Stream.of(1, 2, 3).append(Stream.error(boom)).delay().
               zip(Stream.of('a', 'b', 'c', 'd'))

  expect(actual).to.have.elements([ 1, 'a' ], [ 2, 'b' ], [ 3, 'c' ]).
                 and.error(boom).then(complete)
}

if (module == require.main)
  require('test').run(exports)

});
