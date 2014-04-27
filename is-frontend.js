var both =
  [ 'accord'
  , 'acs'
  , 'bower'
  , 'mobifyjs'
  , 'esprima'
  , 'anvil'
  , 'artpacks'
  , 'atomify-js'
  , 'atomify-css'
  , 'burrito'
  , 'cssom'
  ]

var intags =
  [ 'ender-js'
  , 'ender'
  , 'sails'
  , 'grunt'
  , 'gulp'
  , 'browserify'
  , 'backbone'
  , 'angularjs'
  , 'angular'
  , 'reqwest'
  , 'codegeneration'
  , 'html'
  , 'component'
  , 'aspax'
  , 'assemble'
  , 'asset'
  , 'atma'
  , 'atomify'
  , 'awesomebox'
  , 'react'
  , 'beez'
  , 'bem'
  , 'benchmark'
  , 'bespoke'
  , 'build'
  , 'borschik'
  , 'bosonic'
  , 'beautifier'
  , 'bracket'
  , 'browser'
  , 'canvas'
  , 'css'
  , 'chrome'
  , 'chromify'
  , 'chrono'
  , 'closure'
  , 'less'
  , 'sass'
  , 'd3'
  , 'dalek'
  , 'docpad'
  , 'dom'
  , 'dox'
  , 'dust'
  , 'element'
  , 'ember'
  , 'foundation'
  , 'generator'
  , 'handlebars'
  , 'html5'
  , 'javascript'
  , 'jquery'
  , 'karma'
  , 'marionette'
  , 'markdown'
  , 'marked'
  , 'metalsmith'
  , 'meteor'
  , 'mimosa'
  , 'mocha'
  , 'mozilla'
  , 'firefox'
  , 'mustache'
  , 'ng'
  , 'ninja'
  , 'noflo'
  , 'nor'
  , 'nunjucks'
  , 'jinja'
  , 'oj'
  , 'pagemaker'
  , 'phantom'
  , 'phantomjs'
  , 'phonegap'
  , 'cordova'
  , 'pointer'
  , 'pollyfill'
  , 'pouchdb'
  , 'rtc'
  , 'webrtc'
  , 'scroll'
  , 'selenium'
  , 'saucelabs'
  , 'stylesheet'
  , 'suitcss'
  , 'svg'
  , 'swig'
  , 'tape'
  , 'template'
  , 'templates'
  , 'topcoat'
  , 'totoro'
  , 'touch'
  , 'turret'
  , 'vector'
  , 'venus'
  , 'voxel'
  , 'yeoman'
  ]

var indeps =
  [ 'uglify-js'
  , 'css-parse'
  , 'hbsfy'
  , 'css-emitter-component'
  , 'has-transitions'
  , 'get-pixels'
  , 'amdefine'
  , 'cssbeautify'
  , 'rework'
  , 'insert-css'
  , 'class-list'
  , 'domify'
  , 'uglifycss'
  , 'window'
  , 'falafel'
  ]

module.exports = function isFrontend (doc) {
  var deps = doc.dependencies ? Object.keys(doc.dependencies) : []
    , tags = doc.keywords || []
    ;

  if (!Array.isArray(tags)) tags = []

  if (!doc._id) doc._id = typeof doc.name === 'string' ? doc.name : ''

  if (doc.name && indeps.indexOf(doc.name) !== -1) return true
  if (doc._id && indeps.indexOf(doc._id) !== -1) return true

  if (doc['dist-tags']) {
    var current = doc.versions[doc['dist-tags'].latest]
    if (current && current.dependencies) {
      deps = Object.keys(current.dependencies)
    }
    if (current && current.peerDependencies) {
      deps = deps.concat(Object.keys(current.peerDependencies))
    }
  }

  tags = tags.concat(doc._id.split('-')).map(function (t) {return t.toLowerCase()})
  deps = deps.map(function (d) { return d.toLowerCase() })

  for (var i=0;i<tags.length;i++) {
    var tag = tags[i]
    if (both.indexOf(tag) !== -1) return true
    if (intags.indexOf(tag) !== -1) return true
  }
  for (var i=0;i<deps.length;i++) {
    var dep = deps[i]
    if (both.indexOf(dep) !== -1) return true
    if (indeps.indexOf(dep) !== -1) return true
  }
  return false
}
