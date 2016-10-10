// var assert = require('chai').assert
var T = require('../t')

T.iter([1, 2, 3, 4, 5], async, {
  concurrency: 1000,
  timeout: 0,
  cb: next
})

function async (a, cb) {
  console.log(a)
  var timeout = Math.random() * 200
  console.log(timeout)
  setTimeout(function () {
    cb(a)
  }, timeout)
}

function next (r) {
  console.log(r)
  T.iter([1, 2, 3, 4, 5], function (a, cb) {
    console.log(a)
    cb(a)
  }, {
    concurrency: 1000
  })
}
