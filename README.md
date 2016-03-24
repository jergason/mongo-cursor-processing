# mongo-cursor-processing

Easily and efficiently process large sets of mongodb documents from a cursor
without loading the entire result set in memory at once.

mongo-cursor-processing is a module for iterating through results from a
mongodb cursor with a set level of concurrency.

You could just grab the result set and put it in an
[async queue](https://github.com/caolan/async#queue), but that would load every
object in memory at once, which might not be possible for large data sets. You
could add a small number of documents to a queue, wait until they are all done,
and then add more, but once the number of items in the queue is less than the
concurrency of the queue you are wasting some processing time waiting for those
last items to be done.

`mongo-cursor-processing` to the rescue!

## API

Install with `npm install mongo-cursor-processing`. It exports a single
function that looks like this:

### `function mp(cursor, task, [concurrency], cb)

* `cursor` Object - a mongodb cursor, as returned from a mongodb query.
* `task` Function - `function(item, done)` - a worker function that will be
   called once with each item that comes off the cursor. Call the `done`
   function when you are done with the item.
* `concurrency` Number - number of worker functions to be running at the same time.
   Defaults to 10 if unspecified.
* `cb` Function - `function(err)` that will be called when all items from the
   cursor have been processed, or any of them were processed with an error.

## Example


```JavaScript
var mp = require('mongo-cursor-processing')
var mongo = require('mongoskin')
var db = mongo.db('mongodb://localhost:27017/my_db', {w:1})


// cursors get returned from queries
var cursor = db.collection('people').find({name: 'John'})

function workOnPerson(person, cb) {
  // do some async work with the person
  cb()
}

mp(cursor, workOnPerson, function(err) {
  if (err) {
    console.error('on noes, an error', err)
    process.exit(1)
  }
  console.log('we did it team')
  db.close()
})
```
