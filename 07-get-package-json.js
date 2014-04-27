var levelup = require('levelup')
  , jsonstream = require('JSONStream')
  , fs = require('fs')
  , path = require('path')
  , zlib = require('zlib')
  , stream = require('stream')
  , util = require('util')
  , request = require('requestdb')(path.join(__dirname, 'request.db'))
  , reposet = levelup(path.join(__dirname, 'gh-reposet.db'), {valueEncoding:'json'})
  , str = require('string')
  , once = require('once')
  , token = process.env.GHTOKEN
  ;

function MutationStream (mutate) {
  this.mutate = mutate
  stream.Transform.call(this, {objectMode:true})
}
util.inherits(MutationStream, stream.Transform)
MutationStream.prototype._transform = function (chunk, encoding, cb) {
  var self = this
  self.mutate(chunk, function (e, _new) {
    cb()
  })
}

var live = 0

var m = new MutationStream(mutate)

function mutate (entry, cb) {
  console.log(entry.key, entry.value)
  cb = once(cb)

}


var r = reposet.createReadStream()
r.resume()

r.on('data', function (entry) {
  console.log(entry.key)
  if (typeof entry.value === 'boolean' && entry.value === true) {
    var url = entry.key.replace('https://github.com', 'https://api.github.com/repos')+'/contents/package.json?access_token='+token

    console.log(entry.value, url)
    r.pause()

    if (live < 8) {
      r.resume()
      live += 1
    }
    request.get(url, {headers:{'user-agent':'npm-in-march-0.1'}, json:true},  function (e, resp, body) {
      r.resume()
      if (e) return console.error('asdf')
      if (resp.statusCode === 200) {
        if (!body.content) return
        var x = (new Buffer(body.content, 'base64')).toString()
        try {
          var val = JSON.parse(x)
        } catch(e) {
          var val = false
        }
        if (val) reposet.put(entry.key, val)
      } else {
        reposet.put(entry.key, false)
      }
    })
  } else {
    r.resume()
  }
})

setInterval(function () {
  r.resume()
}, 30 * 1000)
r.resume()
