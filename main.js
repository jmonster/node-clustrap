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

      // Note: we're in dangerous territory!
      // By definition, something unexpected occurred,
      // which we probably didn't want.
      // Anything can happen now!  Be very careful!

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

        // try to send an error to the request that triggered the problem
        if (next) { next(err) }
        else {
          // try to send an error to the request that triggered the problem
          res.statusCode = 500
          res.setHeader('content-type', 'text/plain')
          res.end('Oops, there was a problem!\n')
        }
      } catch (er2) {
        // oh well?
        console.error('Error sending 500!', er2.stack);
      }
    })

    // Because req and res were created before this domain existed,
    // we need to explicitly add them.
    // See the explanation of implicit vs explicit binding below.
    d.add(req)
    d.add(res)

    // Now run the handler function in the domain.
    d.run(next)
  }

  this.logger = logger

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
