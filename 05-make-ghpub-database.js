var levelup = require('levelup')
  , jsonstream = require('JSONStream')
  , fs = require('fs')
  , path = require('path')
  , zlib = require('zlib')
  , lev = levelup(path.join(__dirname, 'gharchive.db'), {valueEncoding:'json'})
  , crypto = require('crypto')
  ;

function md5 (str) { return crypto.createHash('md5').update(str).digest('hex') }

fs.readdir(path.join(__dirname, 'gharchive'), function (e, files) {
  if (e) throw e

  function readFile (f) {
    var s = fs.createReadStream(path.join(__dirname, 'gharchive', f)).pipe(zlib.createGunzip())
      , parser = s.pipe(jsonstream.parse())
      ;
    parser.on('data', function (entry) {
      var id = [(new Date(entry.created_at)).getTime(), md5(JSON.stringify(entry))].join('-')
      lev.put(id, entry)
    })
    parser.on('end', function () {
      if (files.length) readFile(files.shift())
    })
  }

  readFile(files.shift())

  // var log = fs.createReadStream(path.join(__dirname, 'registry.json'))
  //   , logParser = jsonstream.parse()
  // log.pipe(logParser).on('data', function (entry) {
  //   if (entry.deleted) return
  //   if (entry.doc._deleted) return
  //   count += 1
  //   lev.put(entry.doc._id, entry.doc)
  // }).on('end', function () {
  //   console.log('finished, added', count, 'entries')
  // })
})
