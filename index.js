/* jshint asi:true */
var async = require('async')

module.exports = function(cursor, worker, concurrency, cb) {
  // default to concurrency of 10
  if (typeof concurrency === 'function') {
    cb = concurrency
    concurrency = 10
  }

  var queue = async.queue(worker, concurrency)
  queue.isSaturated = function() {
    return this.tasks.length >= this.concurrency;
  }

  queue._wasSaturated = false
  queue._push = queue.push

  queue.push = function(data, cb) {
    var _this = this
    if (!cb) {
      cb = function() {}
    }
    return this._push(data, function(err) {
      var wasSaturated = _this._wasSaturated
      _this._wasSaturated = _this.isSaturated()
      if (!_this._wasSaturated && wasSaturated) {
        _this.deSaturated()
      }
      return cb(err)
    })
  }

  var i = 0
  function fill() {
    cursor.nextObject(function(err, item) {
      i++;

      // bail out on the first error from the cursor
      if (err) {
        return cb(err)
      }

      // if we don't get anything from the cursor and there is no error,
      //   the cursor has reached the end.
      if (item == null) {
        queue.deSaturated = null

        // if there are still items in the queue, we only call the callback
        // once these items are all cleared out
        if (queue.tasks.length + queue.running()) {
          queue.drain = function() {
            return cb()
          }
        }
        // nothing left in the queue, and nothing left in the cursor.
        // we are done!
        else {
          cb()
        }
        return
      }

      // we got data from the cursor, push it on to the queue
      queue.push(item, function(err) {
        if (err) {
          return cb(err)
        }
      })

      // if we have room for more concurrency in the queue, push more data
      // on
      if (!queue.isSaturated()) {
        fill()
      }
      // mark ourselves as saturated and wait to push more data on until we
      // have room again
      else {
        queue._wasSaturated = true
      }
    })
  }
  queue.deSaturated = fill


  // kick off queue processing
  fill()
}
