var assert = require('assert')
var mongoStream = require('../index.js')

describe('mongoStream', function() {
  describe('when given a worker function, a mongo cursor and a callback', function() {
    it('calls the worker function for each cursor item', function(done) {
      var timesCalled = 0
      function worker(item, cb) {
        process.nextTick(function() {
          timesCalled++
          cb()
        })
      }


      var timesNextObjectCalled = 0
      var mockCursor = {
        nextObject: function(cb) {
          if (timesNextObjectCalled < 10) {
            cb(null, timesNextObjectCalled++)
          }
          else {
            cb()
          }
        }
      }

      mongoStream(mockCursor, worker, function(err) {
        assert.ifError(err)
        assert.equal(timesCalled, 10)
        done()
      })
    })

    it('calls the callback with any errors from the cursor', function(done) {
      function worker(item, cb) {
        process.nextTick(cb)
      }


      var timesNextObjectCalled = 0
      var mockCursor = {
        nextObject: function(cb) {
          if (timesNextObjectCalled < 10) {
            cb(null, timesNextObjectCalled++)
          }
          else {
            cb(new Error('aaaahh got an error!'))
          }
        }
      }

      mongoStream(mockCursor, worker, function(err) {
        assert(err)
        done()
      })
    })
  })
})
