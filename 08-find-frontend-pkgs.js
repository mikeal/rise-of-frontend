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
  , frontend = mapreduce(index, 'isFrontend', isFrontendMap)
  , reader1 = registry.createReadStream()
  , isFrontend = require('./is-frontend')
  ;

function isFrontendMap (entry, cb) {
  if (!entry.value) return []
  if (isFrontend(entry.value)) {
    console.log(entry.key)
    return [[entry.key, entry.value]]
  }
  return []
}

reader1.pipe(frontend)
