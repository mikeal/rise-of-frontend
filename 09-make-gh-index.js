var levelup = require('levelup')
  , mapreduce = require('level-mapreduce')
  , jsonstream = require('JSONStream')
  , fs = require('fs')
  , path = require('path')
  , zlib = require('zlib')
  , lev = levelup(path.join(__dirname, 'gharchive.db'), {valueEncoding:'json'})
  , ghIndex = levelup(path.join(__dirname, 'gh.index'), {keyEncoding: 'binary', valueEncoding:'json'})
  , byRepo = mapreduce(ghIndex, 'byRepo', byRepoMap)
  , str = require('string')
  ;

function strip (_string) {
  var count = 0
    , i = 8
    ;
  while (count < 3) {
    if (_string.indexOf('/', i+1) !== -1) {
      count += 1
      i = _string.indexOf('/', i+1)
    } else {
      i = _string.length
      break
    }
  }
  return _string.slice(0, i)
}

function byRepoMap (entry) {
  var doc = entry.value
    , url = doc.url
    ;
  if (!str(url).startsWith('https://github.com/')) return []
  return [[strip(url), entry.value]]
}

lev.createReadStream().pipe(byRepo)
