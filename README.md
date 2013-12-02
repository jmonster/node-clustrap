node-clustrap
=============

node.js's cluster module bootstrapped with common use case.
**please use branch v1 and not master**


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

## example 3
You can disable cluster by specifying `0` workers
```javascript
var clustrap = require('clustrap')

clustrap(app, {
  workers:false || 0,
})
```
