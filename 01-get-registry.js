var request = require('request')
  , jsonstream = require('JSONStream')
  , fs = require('fs')
  , path = require('path')

  , registryParser = jsonstream.parse(['results', true])
  , logParser = jsonstream.parse()
  , url = 'https://skimdb.npmjs.com/registry/_changes?include_docs=true'

  , logReader = fs.createReadStream(path.join(__dirname, 'registry.json'))
  , logWritter = fs.createWriteStream(path.join(__dirname, 'registry.json'), { 'flags': 'a'})
  , seq = 0
  ;

logReader.pipe(logParser)
.on('data', function (entry) {
  seq = entry.seq
})
.on('end', function () {
  request.get(url+'&since='+seq).pipe(registryParser).on('data', function (d) {
    logWritter.write(JSON.stringify(d)+'\n')
  })
})
