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
  , noop = function () {}

  , registry = levelup(path.join(__dirname, 'registry.db'), {valueEncoding:'json'})
  , index =  levelup(path.join(__dirname, 'frontend.index'), {keyEncoding:'binary', valueEncoding:'json'})
  , frontendPublish = mapreduce(index, 'frontendPublish', frontendPublishMap)
  , frontendUpdate = mapreduce(index, 'frontendUpdate', frontendUpdateMap)
  , reader = registry.createReadStream()
  , isFrontend = require('./is-frontend')
  ;

function frontendPublishMap (entry) {
  if (!entry.value) return []
  var doc = entry.value
  if (doc.time && doc.time.created) {
    var t = (new Date(doc.time.created)).toJSON().slice(0,7)
  } else {
    return []
  }

  if (isFrontend(entry.value)) {
    return [[t, true]]
  } else {
    return [[t, false]]
  }
}

function frontendUpdateMap (entry) {
  if (!entry.value) return []
  var doc = entry.value
  if (doc.time && doc.time.created) {
    var t = (new Date(doc.time.created)).toJSON().slice(0,7)
  } else {
    return []
  }

  if (!doc.versions) return []

  var indexes = []

  if (isFrontend(entry.value)) {
    var r = true
  } else {
    var r = false
  }

  for (var i in doc.time) {
    if (i !== 'created' && i !== 'modified') {
      var time = (new Date(doc.time[i])).getTime()
        , version = doc.versions[i]
        ;
      if (time && version) {
        indexes.push([[(new Date(time)).toJSON().slice(0,7), r], 1])
      }
    }
  }

  return indexes
}

reader.pipe(frontendPublish)
reader.pipe(frontendUpdate)
