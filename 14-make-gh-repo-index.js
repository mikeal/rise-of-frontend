var levelup = require('levelup')
  , mapreduce = require('level-mapreduce')
  , fs = require('fs')
  , path = require('path')
  , uniq = require('lodash.uniq')
  , pluck = require('lodash.pluck')
  , util = require('util')
  , stream = require('stream')
  , difference = require('lodash.difference')
  , noop = function () {}

  , lev = levelup(path.join(__dirname, 'gharchive.db'), {valueEncoding:'json'})
  , registry = levelup(path.join(__dirname, 'registry.db'), {valueEncoding:'json'})
  , index = levelup(path.join(__dirname, 'frontend.index'), {keyEncoding:'binary', valueEncoding:'json'})
  , frontend = mapreduce(index, 'isFrontend', noop)
  , reposet = levelup(path.join(__dirname, 'gh-reposet.db'), {valueEncoding:'json'})
  , ghIndex = levelup(path.join(__dirname, 'gh.index'), {keyEncoding: 'binary', valueEncoding:'json'})
  , byRepo = mapreduce(ghIndex, 'byRepo', noop)
  , ghInfo = mapreduce.async(ghIndex, 'ghInfo', ghInfoMap)

  , isFrontend = require('./is-frontend')
  ;


var reader = reposet.createReadStream()
reader.pipe(ghInfo)

var reponum = 0
  , pkgsnum = 0
  ;

function ghInfoMap (entry, cb) {
  reponum += 1
  if (typeof entry.value === 'object') {
    pkgsnum += 1
    var doc = entry.value
      , query = byRepo.createReadStream({key:entry.key})
      , results = []
      ;
    query.on('data', function (d) {
      results.push(d)
    })
    query.on('end', function () {
      registry.get(entry.value.name, function (e, pkg) {
        var doc = {name: entry.value.name}
        doc.pkgjson = pkg || entry.value
        doc.events = results
        doc.isFrontend = isFrontend(doc.pkgjson)
        cb(null, [[entry.key, doc]])
        console.log(pkgsnum, reponum)
      })
    })
  } else {
    cb(null, [])
    console.log(pkgsnum, reponum)
  }
}
