var levelup = require('levelup')
  , mesh = require('level-mesh')
  , fs = require('fs')
  , path = require('path')
  , uniq = require('lodash.uniq')
  , pluck = require('lodash.pluck')
  , util = require('util')
  , stream = require('stream')
  , difference = require('lodash.difference')
  , noop = function () {}

  , registry = levelup(path.join(__dirname, 'registry.db'), {valueEncoding:'json'})
  , deepdb = levelup(path.join(__dirname, 'deep.db'), {valueEncoding:'json'})
  , index = levelup(path.join(__dirname, 'registry.index'), {keyEncoding:'binary', valueEncoding:'json'})
  , deepDepIndex = mesh(index, 'deep')
  ;

function MutationStream (mutate) {
  this.mutate = mutate
  stream.Transform.call(this, {objectMode:true})
}
util.inherits(MutationStream, stream.Transform)
MutationStream.prototype._transform = function (chunk, encoding, cb) {
  var self = this
  self.mutate(chunk, function (e, _new) {
    if (e) return cb(e)
    self.push(_new)
    cb()
  })
}

function getDeepIndex (chunk, cb) {
  console.log('getting', chunk.key)
  deepDepIndex.leftMesh(chunk.key, function (e, results) {
    if (e) return cb(e)
    results.key = chunk.key
    delete results.mesh
    cb(null, results)
  })
}

registry.createReadStream().pipe(new MutationStream(getDeepIndex)).on('data', function (chunk) {
  deepdb.put(chunk.key, chunk)
})
