var os      = require('os')
  , domain  = require('domain')
  , cluster = require('cluster')
  , master  = require('./master')
  , worker  = require('./worker')
  , colors  = require('colors')

module.exports = function(app, options) {
  options = options || {}
  configureOptions(app,options)

  var server  = require('http').createServer(app)
    , logger  = options.logger
    , workers = options.workers

  this.listen = function listen() {
    // skip cluster if no workers
    if (workers === 0) {
      return new worker(app,options).listen()
    }

    // use cluster
    if (cluster.isMaster) {
      return new master(app,options).listen()
    } else {
      return new worker(app,options).listen()
    }
  }

  this.domainMiddleware = function domainMiddleware(req,res,next) {
    var d = domain.create()

    d.on('error', function(er) {
      logger.error('error', er.stack)

      // note: we're in dangerous territory now!
      try {
        // pass to connect error handler
        next(er)

        // make sure we close down within 30 seconds
        var killtimer = setTimeout(function() {
          process.exit(1)
        }, 30000)
        // But don't keep the process open just for that!
        if (killtimer.unref) { killtimer.unref() } // requires node.js 0.10.x

        // let the master know we're through.  This will trigger a
        // 'disconnect' in the cluster master, and then it will fork
        // a new worker.
        cluster.worker.disconnect()

        // stop taking new requests.
        server.close()

        d.dispose()
      } catch (er2) {
        // oh well?
      }
    })

    d.enter()
    next()
  }

}

function configureOptions(app,options) {
  options.logger = (options && options.logger) || app.get('logger') || console
  options.port   = (options && options.port)   || app.get('port')
  options.sock   = (options && options.sock)   || app.get('sock')

  if (options && typeof options.workers === 'number') {
    options.workers
  } else if (options && (options.workers === false || options.workers === 'false')) {
    options.workers = 0
  } else {
    options.workers = app.get('workers') || os.cpus().length
  }
}