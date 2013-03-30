var fs      = require('fs')
  , cluster = require('cluster')

module.exports = function(app,options) {

  var logger  = options.logger
    , port    = options.port
    , sock    = options.sock
    , workers = options.workers

  logger.info("forking " + String(workers).yellow + " worker processes")

  // remove previous socket before continuing start-up
  if (sock) {
    fs.unlink(sock, function(err) {
      // suppress ENOENT error as it simply means the sock didn't previously exist
      if (err && err.code !== "ENOENT") {
        logger.error(err)
      }
    })
  }

  cluster.on('disconnect', function(worker, code, signal) {
    logger.error(('worker ' + worker.process.pid + ' died').red + ', reforking...')
    var worker = cluster.fork()
  })

  this.listen = function listen() {
    // Fork workers.
    for (var i = 0; i < workers; i++) {
      cluster.fork()
    }
  }
}