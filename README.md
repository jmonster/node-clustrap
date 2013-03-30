node-clustrap
=============

node.js's cluster module bootstrapped for common use case

## example 1
```javascript
var clustrap = require('clustrap')

var c = new clustrap(app, {
  workers:2,
  logger:winston,
  port:3000,
  sock:'/tmp/app.sock'
})

// put at the top of your connect/express middleware
app.use(c.domainMiddleware)

c.listen()
```

## example 2
```javascript
var clustrap = require('clustrap')
app.set('port',3000)
var c = new clustrap(app)

// put at the top of your connect/express middleware
app.use(c.domainMiddleware)

c.listen()
```

## example 3
You can disable cluster by specifying `0` workers
```javascript
var clustrap = require('clustrap')

var c = new clustrap(app, {
  workers:false || 0,
})

// put at the top of your connect/express middleware
app.use(c.domainMiddleware)

c.listen()
```