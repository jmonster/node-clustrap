node-clustrap
=============

node.js's cluster module bootstrapped with common use case

## example 1
```javascript
var clustrap = require('clustrap')

clustrap(app, {
  workers:2,
  logger:winston,
  port:3000,
  sock:'/tmp/app.sock'
})
```

## example 2
```javascript
var clustrap = require('clustrap')
app.set('port',3000)
clustrap(app)
```