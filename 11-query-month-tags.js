var levelup = require('levelup')
  , mesh = require('level-mesh')
  , mapreduce = require('level-mapreduce')
  , fs = require('fs')
  , path = require('path')
  , uniq = require('lodash.uniq')
  , pluck = require('lodash.pluck')
  , util = require('util')
  , stream = require('stream')
  , difference = require('lodash.difference')
  , csv = require('csv-write-stream')
  , _ = require('lodash')
  , noop = function () {}

  , index =  levelup(path.join(__dirname, 'frontend.index'), {keyEncoding:'binary', valueEncoding:'json'})
  , montlyTags = mapreduce(index, 'montlyTags', noop)
  ;

var results = {}

var r = montlyTags.createReadStream()
r.on('data', function (obj) {
  var key = obj.key.toString()
    , date = key.slice(0,7)
    , tag = key.slice(8)
    , value = results[key]
    ;

  date = (date.slice(5) + '/' + date.slice(0,4))
  if (!results[date]) results[date] = {}
  if (!results[date][tag]) results[date][tag] = 0
  results[date][tag] += 1
})
r.on('end', function () {
  var s = csv()
  s.pipe(process.stdout)

  var lines = {}
   , dates = []
   , ignore =
     [ 'browser'
     , 'javascript'
     , 'node'
     , 'html'
     , 'template'
     , 'plugin'
     , 'gruntplugin'
     , 'gulpplugin'
     ]
   ;

  for (var date in results) {
    dates.push(date)
    var tops = Object.keys(results[date]).map(function (tag) { return [tag, -results[date][tag]] })
    tops = _.sortBy(tops, function (x) {return x[1]}).slice(0, 50)

    tops.forEach(function (top) {
      var tag = top[0]
        , value = results[date][top[0]]
        ;
      if (ignore.indexOf(tag) !== -1) return
      if (!lines[tag]) lines[tag] = {}
      lines[tag][date] = value
    })
  }

  dates = _.sortBy(dates, function (d) {
    return parseInt(d.slice(3)+'00') + parseInt(d.slice(0,2))
  }).slice(15)

  dates = dates.slice(0, dates.length - 1)

  for (var tag in lines) {
    var line = lines[tag]
      , n = 0
      , o = {'tag//date':tag}
      ;
    dates.forEach(function (d) {
      if (!line[d]) line[d] = '0'
      else n += line[d]
      o[d] = line[d]
    })

    if (n > 200) s.write(o)
  }

  s.end()
})
