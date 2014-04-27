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
  , montlyTags = mapreduce(index, 'montlyUpdateTags', noop)
  ;

var results = {}
  , include =
    [ 'css'
    , 'build'
    , 'browserify'
    , 'mocha'
    , 'backbone'
    , 'generator'
    , 'angular'
    , 'grunt'
    , 'component'
    , 'yeoman-generator'
    , 'karma'
    , 'gulp'
    ]

var r = montlyTags.createReadStream()
r.on('data', function (obj) {
  var key = obj.key.toString()
    , date = key.slice(0,7)
    , tag = key.slice(8)
    , value = results[key]
    ;

  if (include.indexOf(tag) === -1) return
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
   ;

  for (var date in results) {
    Object.keys(results[date]).forEach(function (tag) {
      dates.push(date)
      if (!lines[tag]) lines[tag] = {}
      lines[tag][date] = results[date][tag]
    })
  }

  dates = _.uniq(dates)
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
