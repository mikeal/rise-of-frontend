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
  , frontend = mapreduce(index, 'isFrontend', noop)
  , reader = frontend.createReadStream()
  , monthlyTags = mapreduce(index, 'montlyTags', monthlyTagMap)
  , monthlyUpdateTags = mapreduce(index, 'montlyUpdateTags', monthlyUpdateTagMap)
  ;

function monthlyTagMap (entry) {
  var key = entry.key
    , doc = entry.value
    , tags = doc.keywords || []
    ;
  tags = tags.concat(doc._id.split('-')).map(function (t) {return t.toLowerCase()})

  if (!doc.time || !doc.time.created) {
    console.error('no created on', entry.key)
    return []
  }

  var indexs = []
    , t = (new Date(doc.time.created)).toJSON().slice(0,7)
    ;

  tags.forEach(function (tag) {
    indexs.push([[t, tag], 1])
  })

  return indexs
}

function monthlyUpdateTagMap (entry) {
  var key = entry.key
    , doc = entry.value
    , tags = doc.keywords || []
    ;
  tags = tags.concat(doc._id.split('-')).map(function (t) {return t.toLowerCase()})

  var indexs = []

  if (!doc.versions) return []

  tags.forEach(function (tag) {
    for (var i in doc.time) {
      if (i !== 'created' && i !== 'modified') {
        var time = (new Date(doc.time[i])).getTime()
          , version = doc.versions[i]
          ;
        if (time && version) {
          indexs.push([[(new Date(time)).toJSON().slice(0,7), tag], 1])
        }
      }
    }
  })

  return indexs
}



reader.pipe(monthlyTags)
reader.pipe(monthlyUpdateTags)
