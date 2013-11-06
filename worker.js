function clustrap(app,options) {

  var logger  = options.logger
    , port    = options.port
    , sock    = options.sock
    , workers = options.workers

  function listenOnPort (port) {
    app.listen(port, function() {
      var s = (app.name || "app").green
        + " listening on port " + String(port).yellow
        + " in " + (process.env.NODE_ENV || "development").yellow + " mode"

      if (workers) { s = s + " with " + String(workers).yellow + " workers" }
      logger.info(s)
    })
  }

  function listenOnSocket (sock) {
    var oldUmask = process.umask(0000)

    app.listen(sock, function() {
      process.umask(oldUmask)
      var s = (app.name || "app").green
        + " listening at " + String(sock).yellow
        + " in " + (process.env.NODE_ENV || "development").yellow + " mode"

      if (workers) { s = s + " with " + String(workers).yellow + " workers" }
      logger.info(s)
    })
  }

  this.listen = function listen() {
    if (sock) { listenOnSocket(sock) }
    else {      listenOnPort(port) }
  }

  return this
}

module.exports = clustrap
