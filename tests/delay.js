/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module) } : define)(function (require, exports, module, undefined) {

'use strict';

var streamer = require('../core'), Stream = streamer.Stream,
    delay = streamer.delay

exports.Assert = require('./assert').Assert

exports['test Stream.empty']  = function(expect, complete) {
  var actual = delay(Stream.empty), turned = false
  expect(actual).to.be.empty().and.then(function(assert) {
    assert.ok(turned, 'delay is async')
    complete()
  })
  turned = true
}

exports['test Stream.of'] = function(expect, complete) {
  var actual = delay(Stream.of(1, 2, 3, 4)), turned = false
  expect(actual).to.be(1, 2, 3, 4).and.then(function(assert) {
    assert.ok(turned, 'dealy made stream async')
    complete()
  })
  turned = true
}

exports['test empty stream via Stream.from'] = function(expect, complete) {
  var actual = delay(Stream.from('')), turned = false
  expect(actual).to.be.empty().then(function(assert) {
    assert.ok(turned, 'delay made stream async')
    complete()
  })
  turned = true
}

exports['test Stream.from string'] = function(expect, complete) {
  var actual = delay(Stream.from('hello')), turned = false
  expect(actual).to.be('h', 'e', 'l', 'l', 'o').then(function(assert) {
    assert.ok(turned, 'delay made stream async')
    complete()
  })
  turned = true
}


if (module == require.main)
  require('test').run(exports)

});
