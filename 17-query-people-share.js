var levelup = require('levelup')
  , mapreduce = require('level-mapreduce')
  , fs = require('fs')
  , path = require('path')
  , uniq = require('lodash.uniq')
  , pluck = require('lodash.pluck')
  , util = require('util')
  , stream = require('stream')
  , _ = require('lodash')
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
  , allpeople = {front:[], back:[], notnode:[]}
  , current
  , currentSet
  ;

function process () {
  if (!current) return
  var _current = current
    , _currentSet = currentSet
  // console.log('processing', current)
  var people = _.uniq(_currentSet.map(function (entry) {
    if (entry.login) return entry.login
    if (entry.actor) return entry.actor
  }))

  ghInfo.get(_current, function (e, info) {
    if (e || info.length == 0) {
      var r = results.notnode
        , p = allpeople.notnode
        ;
    } else {
      // console.log(info[0].isFrontend)
      var r = results[ info[0].isFrontend ? 'front' : 'back' ]
        , p = allpeople[ info[0].isFrontend ? 'front' : 'back' ]
        ;
    }
    var types = []

    r.total[0] += people.length
    r.total[1] += 1
    people.forEach(function (person) {
      if (p.indexOf(person) === -1) p.push(person)
    })
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
  var activityShare = fs.createWriteStream(path.join(__dirname, 'people-activity.json'))

  results.front.uniq = allpeople.front.length
  results.back.uniq = allpeople.back.length
  results.notnode.uniq = allpeople.notnode.length

  activityShare.write(JSON.stringify(results))
  activityShare.end()
  console.log(results)
}, 30 * 1000)
