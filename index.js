/* jshint asi:true */
var async = require('async')

module.exports = function(cursor, worker, concurrency, cb) {
  // default to concurrency of 10
  if (typeof concurrecy === 'function') {
    cb = concurrecy
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
    return cursor.nextObject(function(err, item) {
      i++;
      if (!item) {
        queue.deSaturated = null
        if (queue.tasks.length + queue.running()) {
          queue.drain = function() {
            return cb()
          }
        }
        else {
          cb()
        }
        return
      }

      queue.push(item, function(err) {
        if (err) {
          return console.error(err)
        }
      })

      if (!queue.isSaturated()) {
        fill()
      }
      else {
        queue._wasSaturated = true
      }
    })
  }
  queue.deSaturated = fill

  fill()
}
