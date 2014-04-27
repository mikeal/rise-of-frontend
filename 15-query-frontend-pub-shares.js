var levelup = require('levelup')
  , mesh = require('level-mesh')
  , mapreduce = require('level-mapreduce')
  , fs = require('fs')
  , path = require('path')
  , uniq = require('lodash.uniq')
  , pluck = require('lodash.pluck')
  , util = require('util')
  , csv = require('csv-write-stream')
  , stream = require('stream')
  , _ = require('lodash')
  , difference = require('lodash.difference')
  , noop = function () {}

  , registry = levelup(path.join(__dirname, 'registry.db'), {valueEncoding:'json'})
  , index =  levelup(path.join(__dirname, 'frontend.index'), {keyEncoding:'binary', valueEncoding:'json'})
  , frontendPublish = mapreduce(index, 'frontendPublish', noop)
  , frontendUpdate = mapreduce(index, 'frontendUpdate', noop)

  , basedir = '/Users/mikeal/Dropbox/feops'
  , publishGrowth = fs.createWriteStream(path.join(basedir, 'registryGrowth.csv'))
  , updateGrowth = fs.createWriteStream(path.join(basedir, 'registryUpdates.csv'))
  , publishShare = fs.createWriteStream(path.join(basedir, 'publishShare.csv'))
  , updateShare = fs.createWriteStream(path.join(basedir, 'updateShare.csv'))

  , publishGrowthCSV = csv()
  , publishShareCSV = csv()
  , updateGrowthCSV = csv()
  , updateShareCSV = csv()

  , publishes = {back:{}, front:{}}
  , updates = {back:{}, front:{}}
  ;

frontendPublish.createReadStream().on('data', function (entry) {
  var month = entry.key.replace('-', '/')
    , side = entry.value ? 'front' : 'back'
    ;
  if (!publishes[side][month]) publishes[side][month] = 0
  publishes[side][month] += 1
})
.on('end', function () {
  publishGrowthCSV.pipe(publishGrowth)
  publishShareCSV.pipe(publishShare)
  publishGrowthCSV.pipe(process.stdout)
  publishShareCSV.pipe(process.stdout)

  var frontline = {'Share//Date': 'Frontend'}
    , backline = {'Share//Date': 'Backend'}
    , trim = Object.keys(publishes.back).length - 1
    ;

  Object.keys(publishes.back).sort().slice(1,trim).forEach(function (k) {
    backline[k] = publishes.back[k]
    frontline[k] = publishes.front[k] || 0
  })

  publishShareCSV.write(backline)
  publishShareCSV.write(frontline)
  publishShareCSV.end()

  var growth = {'Packages//Date': 'Publishes'}

  Object.keys(publishes.front).sort().slice(0,trim).forEach(function (k) {
    growth[k] = publishes.front[k] + publishes.back[k]
  })

  publishGrowthCSV.write(growth)
  publishGrowthCSV.end()
})

frontendUpdate.createReadStream().on('data', function (entry) {
  var month = entry.key[0].replace('-', '/')
    , side = entry.key[1] ? 'front' : 'back'
    ;
  if (!updates[side][month]) updates[side][month] = 0
  updates[side][month] += 1
})
.on('end', function () {
  updateGrowthCSV.pipe(updateGrowth)
  updateShareCSV.pipe(updateShare)
  updateGrowthCSV.pipe(process.stdout)
  updateShareCSV.pipe(process.stdout)

  var frontline = {'Share//Date': 'Frontend'}
    , backline = {'Share//Date': 'Backend'}
    , trim = Object.keys(updates.back).length - 1
    ;

  Object.keys(updates.back).sort().slice(1,trim).forEach(function (k) {
    backline[k] = updates.back[k]
    frontline[k] = updates.front[k] || 0
  })

  updateShareCSV.write(backline)
  updateShareCSV.write(frontline)
  updateShareCSV.end()

  var growth = {'Packages//Date': 'Updates'}

  Object.keys(updates.front).sort().slice(0,trim).forEach(function (k) {
    growth[k] = updates.front[k] + updates.back[k]
  })

  updateGrowthCSV.write(growth)
  updateGrowthCSV.end()

})
