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
  , ghInfo = mapreduce.async(ghIndex, 'ghInfo', noop)

  , isFrontend = require('./is-frontend')
  ;


var reader = byRepo.createReadStream()
  , results = {front:{total:[0,0]}, back:{total:[0,0]}, notnode:{total:[0,0]}}
  , current
  , currentSet
  ;

function process () {
  if (!current) return
  var _current = current
    , _currentSet = currentSet
  // console.log('processing', current)
  ghInfo.get(_current, function (e, info) {
    if (e || info.length == 0) {
      var r = results.notnode
    } else {
      // console.log(info[0].isFrontend)
      var r = results[ info[0].isFrontend ? 'front' : 'back' ]
    }
    var types = []
    _currentSet.forEach(function (ev) {
      if (!r[ev.type]) r[ev.type] = [0,0]
      if (types.indexOf(ev.type) === -1) {
        types.push(ev.type)
        r[ev.type][1] += 1
      }
      r[ev.type][0] += 1
    })
    r.total[0] += _currentSet.length
    r.total[1] += 1
  })
}

reader.on('data', function (entry) {
  if (entry.key === 'https://github.com/') return
  if (entry.key !== current) {
    process()
    current = entry.key
    currentSet = []
  } else {
    currentSet.push(entry.value)
  }
})
.on('end', process)

setInterval(function () {
  var activityShare = fs.createWriteStream(path.join(__dirname, 'activity.json'))
  activityShare.write(JSON.stringify(results))
  activityShare.end()
  console.log(results)
}, 30 * 1000)
