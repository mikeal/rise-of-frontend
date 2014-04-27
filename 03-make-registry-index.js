var levelup = require('levelup')
  , mapreduce = require('level-mapreduce')
  , mesh = require('level-mesh')
  , fs = require('fs')
  , path = require('path')
  , uniq = require('lodash.uniq')

  , registry = levelup(path.join(__dirname, 'registry.db'), {valueEncoding:'json'})
  , reader = registry.createReadStream()
  , index = levelup(path.join(__dirname, 'registry.index'), {keyEncoding:'binary', valueEncoding:'json'})
  , publishIndex = mapreduce(index, 'publish', publishMap)
  , updateIndex = mapreduce(index, 'update', updateMap)
  , tagsIndex = mapreduce(index, 'tags', tagMap)
  , depIndex = mapreduce(index, 'deps', depMap)
  , deepDepIndex = mesh(index, 'deep', deepDepMap)
  , tagTimeIndex = mesh(index, 'tag-time', tagsByTimeMap)
  ;

// reader.pipe(publishIndex)
// reader.pipe(updateIndex)
// reader.pipe(tagsIndex)
// reader.pipe(depIndex)
reader.pipe(deepDepIndex)

function publishMap (entry) {
  var doc = entry.value
  if (!doc.time || !doc.time.created) {
    console.error('no created on', entry.key)
    return []
  }

  return [[(new Date(doc.time.created)).getTime(), doc]]
}
function updateMap (entry) {
  var doc = entry.value
  if (!doc.time) {
    console.error('no time on', entry.key)
    return []
  }

  if (doc.time.unpublished) return []

  var indexes = []
  for (var i in doc.time) {
    if (i !== 'created' && i !== 'modified') {
      var time = (new Date(doc.time[i])).getTime()
        , version = doc.versions[i]
        ;
      if (time && version) indexes.push([time, version])
    }
  }

  return indexes
}
function tagMap (entry) {
  var doc = entry.value
  var otags = doc._id.split('-')
  if (doc.tags) {
    otags = doc.tags.concat(otags)
  }

  return uniq(otags).map(function (tag) {return [tag, doc._id]})
}

function depMap (entry) {
  var doc = entry.value

  if (!doc['dist-tags'] || !doc['dist-tags'].latest) return []
  var current = doc.versions[doc['dist-tags'].latest]

  if (!current) return []

  var deps = []
  if (current.dependencies) {
    deps = deps.concat(Object.keys(current.dependencies))
  }
  if (current.devDependencies) {
    deps = deps.concat(Object.keys(current.devDependencies))
  }

  deps = uniq(deps)

  return deps.map(function (key) {return [key, doc._id]})
}

function deepDepMap (entry) {
  var doc = entry.value

  if (!doc['dist-tags'] || !doc['dist-tags'].latest) return []
  var current = doc.versions[doc['dist-tags'].latest]

  if (!current) return []

  var deps = []
  if (current.dependencies) {
    deps = deps.concat(Object.keys(current.dependencies))
  }
  if (current.devDependencies) {
    deps = deps.concat(Object.keys(current.devDependencies))
  }

  deps = uniq(deps)

  return deps.map(function (key) {return [doc._id, key]})
}

function tagsByTimeMap (entry) {
  var doc = entry.value
  if (!doc.time || !doc.time.created) {
    console.error('no created on', entry.key)
    return []
  }

  var otags = doc._id.split('-')
  if (doc.tags) {
    otags = doc.tags.concat(otags)
  }

  return uniq(otags).map(function (tag) {return [[tag, (new Date(doc.time.created)).getTime()], doc._id]})
}
