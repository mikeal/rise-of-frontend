var csv = require('csv-stream')
  , fs = require('fs')
  , path = require('path')
  , csvWriteStream = require('csv-write-stream')
  , writer = csvWriteStream()
  , basedir = '/Users/mikeal/Dropbox/feops'
  , _ = require('lodash')
  , stream = fs.createReadStream(path.join(__dirname, 'modulecounts.csv')).pipe(csv.createStream())
  ;

var last = {}
  , allByDate = {}
  , quarters = []
  , qkeys = ['03/31', '06/30', '09/30', '12/31']
  ;

writer.pipe(fs.createWriteStream(path.join(basedir, 'modulecounts-clean.csv')))

stream.on('data', function (entry) {
  if (entry.date.slice(0,4) === '2010') return

  allByDate[entry.date] = entry

  for (var i in entry) {
    if (entry[i] === '0') entry[i] = false

    if (!last[i] && !entry[i]) last[i] = '0'
    if (!entry[i]) entry[i] = last[i]
    else last[i] = entry[i]
  }

  delete entry["MELPA (Emacs)"]

  writer.write(entry)

  if (qkeys.indexOf(entry.date.slice(5)) !== -1) quarters.push(entry)
})
stream.on('end', function () {
  writer.end()

  var quarterlyAbsolute = csvWriteStream()
    , quarterlyGrowth = csvWriteStream()
    , quarterlyPercentage = csvWriteStream()
    , quarterlyGrowthFutures = csvWriteStream()
    , quarterlyFutures = csvWriteStream()
    , last
    ;

  quarterlyAbsolute.pipe(fs.createWriteStream(path.join(basedir, 'modulecounts-quarterly.csv')))
  quarterlyGrowth.pipe(fs.createWriteStream(path.join(basedir, 'modulecounts-quarterly-growth.csv')))
  quarterlyPercentage.pipe(fs.createWriteStream(path.join(basedir, 'modulecounts-quarterly-perc.csv')))
  quarterlyGrowthFutures.pipe(fs.createWriteStream(path.join(basedir, 'modulecounts-quarterly-growth-fu.csv')))
  quarterlyFutures.pipe(fs.createWriteStream(path.join(basedir, 'modulecounts-quarterly-fu.csv')))

  var l = quarters[0]
    , lines = _.keys(l).filter(function (k) {return k !== 'date'}).map(function (k) { return {'Lang': k} })
    , glines = []
    , plines = []
    ;
  quarters.forEach(function (q) {
    lines.forEach(function (line) {
      line[q.date] = q[line.Lang]
      if (q.date.slice(0,4) === '2010') return
      if (line[q.date] === '0') line[q.date] = ''
    })
  })
  lines.forEach(quarterlyAbsolute.write.bind(quarterlyAbsolute))

  quarterlyAbsolute.end()

  lines.forEach(function (line) {
    var growth = {}
      , percentage = {}
      , last
      ;
    for (var i in line) {
      if (i === 'Lang') {
        growth[i] = percentage[i] = line[i]
      } else {
        if (last) {
          growth[i] = parseInt(line[i]) - last
          percentage[i] = parseInt(((parseInt(line[i]) - last) / last) * 100) + '%'
        }
        last = parseInt(line[i])
      }
    }

    glines.push(growth)
    plines.push(percentage)
  })

  glines = _.sortBy(glines, function (l) {return _.keys(l).length}).reverse()
  plines = _.sortBy(plines, function (l) {return _.keys(l).length}).reverse()

  glines.forEach(quarterlyGrowth.write.bind(quarterlyGrowth))
  plines.forEach(quarterlyPercentage.write.bind(quarterlyPercentage))

  quarterlyGrowth.end()
  quarterlyPercentage.end()

  var getPercentage = function (lang) {
    return (allByDate['2014/03/31'][lang] - allByDate['2013/12/31'][lang]) / allByDate['2013/12/31'][lang]
  }

  var futureIndex = {}

  glines.forEach(function (line) {
    var lang = line.Lang
      , percentage = getPercentage(lang)
      , base = parseInt(allByDate['2014/03/31'][lang])
      , dates =
        [ '2014/06/30'
        , '2014/09/30'
        , '2014/12/31'
        , '2015/06/30'
        , '2015/09/30'
        , '2015/12/31'
        ]
      ;

    for (var i in line) {
      if (i.slice(0,4) === '2011') delete line[i]
      if (i.slice(0,4) === '2012') delete line[i]
    }

    dates.forEach(function (date) {
      line[date] = parseInt(base * percentage)
      base = base + line[date]
    })
    futureIndex[lang] = line
  })
  glines.forEach(quarterlyGrowthFutures.write.bind(quarterlyGrowthFutures))
  quarterlyGrowthFutures.end()

  lines.forEach(function (line) {
    var lang = line.Lang
      , percentage = getPercentage(lang)
      , base = parseInt(allByDate['2014/03/31'][lang])
      , dates =
        [ '2014/06/30'
        , '2014/09/30'
        , '2014/12/31'
        , '2015/06/30'
        , '2015/09/30'
        , '2015/12/31'
        ]
      ;

    for (var i in line) {
      if (i.slice(0,4) === '2011') delete line[i]
      if (i.slice(0,4) === '2012') delete line[i]
    }

    dates.forEach(function (date) {
      var increase = parseInt(base * percentage)
      line[date] = base + increase
      base = line[date]
    })
    console.log(lang, parseInt(base * percentage))
  })

  lines.forEach(quarterlyFutures.write.bind(quarterlyFutures))
  quarterlyFutures.end()

})
