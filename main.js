var os      = require('os')
  , fs      = require('fs')
  , domain  = require('domain')
  , cluster = require('cluster')
  , master  = require('./master')
  , worker  = require('./worker')
  , colors  = require('colors')

module.exports = function(server, options) {
  options = options || {}
  configureOptions(server,options)

  var logger  = options.logger
    , workers = options.workers

  function unlinkSocket() {
    // remove previous socket before continuing start-up
    var sock = options.sock;
    if (sock) {
      try {
        fs.unlinkSync(sock);
      } catch(e) {
        // ignore failure to delete non-existant files
      }
    }
  }

  this.listen = function listen() {
    // skip cluster if no workers
    if (workers === 0) {
      unlinkSocket();
      return new worker(server,options).listen()
    }

    // use cluster
    if (cluster.isMaster) {
      unlinkSocket();
      return new master(server,options).listen()
    } else {
      return new worker(server,options).listen()
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
        // make sure we close down within 30 seconds
        var killtimer = setTimeout(function() {
          process.exit(1)
        }, 30000)

        // But don't keep the process open just for that!
        if (killtimer.unref) { killtimer.unref() } // requires node.js 0.10.x

        // let the master know we're through.  This will trigger a
        // 'disconnect' in the cluster master, and then it will fork
        // a new worker.
        cluster.worker && cluster.worker.disconnect()

        // try to send an error to the request that triggered the problem
        res.statusCode = 500
        res.setHeader('content-type', 'text/plain')
        res.end('Oops, there was a problem!\n')
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

function configureOptions(server,options) {
  options.logger = (options && options.logger) || console
  options.port   = (options && options.port)
  options.sock   = (options && options.sock)

  if (options && typeof options.workers === 'number') {
    options.workers = options.workers
  } else if (options && (options.workers === false || options.workers === 'false')) {
    options.workers = 0
  } else {
    options.workers = os.cpus().length
  }
}
