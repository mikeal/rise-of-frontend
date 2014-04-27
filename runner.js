var child = require('child_process')
  , path = require('path')
  ;

function run () {
  var sub = child.spawn('/usr/local/bin/node', [path.join(__dirname, process.argv[2])])
    , waiting
    ;
  sub.on('data', function (d) {
    if (waiting) clearTimeout(waiting)
    waiting = setTimeout(function () {
      sub.kill()
      setTimeout(function () {
        run()
      }, 1000)
    }, 30 * 1000)
  })
  sub.on('end', function () {
    if (waiting) clearTimeout(waiting)
  })
  sub.stdout.pipe(process.stdout)
  sub.stderr.pipe(process.stderr)
}

run()
