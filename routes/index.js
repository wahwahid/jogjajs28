const express = require('express');
const Event = require('events')
const memstorage = require('../services/memstorage')
const sse = require('../services/sse')
const { query } = require('express')
const router = express.Router()
const longPool = new Event()
const sse1 = new sse.Manager()
const sse2 = new sse.Manager()

// Index
router.get('/', function(req, res, next) {
  res.render('index', { title: 'JogjaJS #28' });
});

// Realtime in static
router.get('/static', function(req, res, next) {
  memstorage.Counter++
  res.render('static', { title: 'Realtime in static - JogjaJS #28', counter: memstorage.Counter });
});

// Realtime in static with meta
router.get('/static-meta', function(req, res, next) {
  memstorage.CounterMeta++
  res.render('static-meta', { title: 'Realtime in static with meta - JogjaJS #28', counter: memstorage.CounterMeta });
});

// Realtime in static with JS
router.get('/static-js', function(req, res, next) {
  memstorage.CounterJS++
  res.render('static-js', { title: 'Realtime in static with JS - JogjaJS #28', counter: memstorage.CounterJS });
});

// Realtime with pool
router.get('/with-pool', function(req, res, next) {
  memstorage.CounterPoll++
  res.render('with-pool', { title: 'Realtime with pooling - JogjaJS #28' });
});

router.get('/with-pool/update', function(req, res, next) {
  res.json({
    counter: memstorage.CounterPoll,
  })
});

// Realtime with long pool
router.get('/with-longpool', function(req, res, next) {
  memstorage.CounterLongPoll++
  longPool.emit('visit', memstorage.CounterLongPoll)
  res.render('with-longpool', { title: 'Realtime with long pooling - JogjaJS #28' });
});

router.get('/with-longpool/update', function(req, res, next) {
  if (req.query.init === 'true') {
    res.json({
      counter: memstorage.CounterLongPoll,
    })
  } else {
    const handler = (counter) => {
      try {
        res.json({
          counter,
        })
      } finally {
        longPool.removeListener('visit', handler)
      }
    }
    const listener = longPool.addListener('visit', handler)
  }
});

// Realtime with SSE
router.get('/with-sse', function(req, res, next) {
  memstorage.CounterSSE++
  const data = { counter: memstorage.CounterSSE, online: sse1.getClientCount(), tag: 'visit' }
  sse1.broadcast(data)
  res.render('with-sse', { title: 'Realtime with SSE - JogjaJS #28' });
});

router.get('/with-sse/connect', function(req, res, next) {
  const clientId = Date.now();
  console.log(`SSE ${clientId} Connection open`);
  sse1.addClient(clientId, res)

  const data = { counter: memstorage.CounterSSE, online: sse1.getClientCount(), tag: 'connect' }
  sse1.broadcast(data)

  req.on('close', () => {
    console.log(`SSE ${clientId} Connection closed`);
    sse1.removeClient(clientId)

    const data = { counter: memstorage.CounterSSE, online: sse1.getClientCount(), tag: 'disconnect' }
    sse1.broadcast(data)
  });
});

// Realtime with SSE Event
router.get('/with-sse-event', function(req, res, next) {
  memstorage.CounterSSEEvent++
  const data = { counter: memstorage.CounterSSEEvent }
  sse2.broadcastEvent('visit', data)
  res.render('with-sse-event', { title: 'Realtime with SSE Event - JogjaJS #28' });
});

router.get('/with-sse-event/connect', function(req, res, next) {
  let name = 'Alien'
  if (req.query.name != '') {
    name = decodeURI(req.query.name)
  }

  const clientId = Date.now();
  console.log(`SSE ${clientId} Connection open`);
  sse2.addClient(clientId, res, {
    name
  })

  const data = { counter: memstorage.CounterSSEEvent, online: sse2.getClientCount(), name }
  sse2.broadcastEvent('hey', data)

  const interval = setInterval(() => {
    sse2.broadcastEvent('ping', {})
  }, 5000);

  req.on('close', () => {
    console.log(`SSE ${clientId} Connection closed`);
    sse2.removeClient(clientId)

    const data = { online: sse2.getClientCount(), name}
    sse2.broadcastEvent('bye', data)

    clearInterval(interval)
  });
});

module.exports = router;
