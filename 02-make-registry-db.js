var levelup = require('levelup')
  , jsonstream = require('JSONStream')
  , fs = require('fs')
  , path = require('path')

  , logParser = jsonstream.parse()
  , log = fs.createReadStream(path.join(__dirname, 'registry.json'))
  , lev = levelup(path.join(__dirname, 'registry.db'), {valueEncoding:'json'})
  , count = 0
  ;

log.pipe(logParser).on('data', function (entry) {
  if (entry.deleted) return
  if (entry.doc._deleted) return
  count += 1
  lev.put(entry.doc._id, entry.doc)
}).on('end', function () {
  console.log('finished, added', count, 'entries')
})
