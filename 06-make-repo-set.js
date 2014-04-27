var levelup = require('levelup')
  , mapreduce = require('level-mapreduce')
  , jsonstream = require('JSONStream')
  , fs = require('fs')
  , path = require('path')
  , zlib = require('zlib')
  , lev = levelup(path.join(__dirname, 'gharchive.db'), {valueEncoding:'json'})
  , reposet = levelup(path.join(__dirname, 'gh-reposet.db'), {valueEncoding:'json'})
  , ghIndex = levelup(path.join(__dirname, 'gh.index'), {keyEncoding: 'binary', valueEncoding:'json'})
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

lev.createReadStream().on('data', function(entry) {
  var doc = entry.value
    , url = doc.url
    ;
  if (!str(url).startsWith('https://github.com/')) return
  console.log(strip(url))
  reposet.get(strip(url), function (e, v) {
    if (e) {
      reposet.put(strip(url), true)
    }
  })
})
