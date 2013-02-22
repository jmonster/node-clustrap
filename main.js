var os      = require('os')
  , fs      = require('fs')
  , cluster = require('cluster')


module.exports = function(app, options) {
  var logger  = options.logger || app.get('logger') || console
    , workers = (options.workers !== undefined ? options.workers : app.get('workers') || os.cpus().length )
    , port    = options.port || app.get('port') || 3000
    , sock    = options.sock || app.get('sock')

  if (cluster.isMaster) {
    // if not using workers, short circuit and have main listen with no workers
    if ( workers === false || workers === 0 ) return launch_app()

    logger.info("forking " + String(workers).yellow + " worker processes")

    // Fork workers.
    for (var i = 0; i < workers; i++) {
      cluster.fork()
    }

    cluster.on('exit', function(worker, code, signal) {
      logger.error(('worker ' + worker.process.pid + ' died').red + ', reforking...')
      var worker = cluster.fork()
    })
  } else {
    launch_app()
  }

  function launch_app () {
    if (sock) { startWithSock(sock) }
    else {      startWithPort(app.get('port')) }
  }

  function startWithPort (port) {
    app.listen(port, function() {
      var s = (app.get('name') || "app").green
        + " listening on port " + String(port).yellow
        + " in " + app.settings.env.yellow + " mode"
      if (workers) s = s + " with " + String(workers).yellow + " workers"
      logger.info(s)
    })
  }

  function startWithSock (sock) {
    var oldUmask = process.umask(0000)
    fs.unlink(sock, beginListeningOnSocket)

    function beginListeningOnSocket(err) {
      if (err) {
        logger.error("unable to unlink %s",sock)
        logger.error(err)
      }

      app.listen(sock, function() {
        process.umask(oldUmask)
        var s = (app.get('name') || "app").green
          + " listening at " + String(sock).yellow
          + " in " + app.settings.env.yellow + " mode"
        if (workers) s = s + " with " + String(workers).yellow + " workers"
        logger.info(s)
      })
    }
  }
}
