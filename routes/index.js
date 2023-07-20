const express = require('express');
const Event = require('events')
const memstorage = require('../services/memstorage')
const sse = require('../services/sse')
const { query } = require('express')
const router = express.Router()
const longPool = new Event()

// Index
router.get('/', function(req, res, next) {
  res.render('index', { title: 'JogjaJS28' });
});

// Static
router.get('/static', function(req, res, next) {
  memstorage.Counter++
  res.render('static', { counter: memstorage.Counter });
});

// Static with meta
router.get('/static-meta', function(req, res, next) {
  memstorage.CounterMeta++
  res.render('static-meta', { counter: memstorage.CounterMeta });
});

// Static with JS
router.get('/static-js', function(req, res, next) {
  memstorage.CounterJS++
  res.render('static-js', { counter: memstorage.CounterJS });
});

// Realtime with pool
router.get('/with-pool', function(req, res, next) {
  memstorage.CounterPoll++
  res.render('with-pool');
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
  res.render('with-longpool');
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
        longPool.removeListener('visit', handler)
      } catch (error) {
        console.log(error)
      }
    }
    const listener = longPool.addListener('visit', handler)
  }
});

// Realtime with SSE
router.get('/with-sse', function(req, res, next) {
  memstorage.CounterSSE++
  const data = { counter: memstorage.CounterSSE, online: sse.GetClientCount(), tag: 'visit' }
  sse.Broadcast(data)
  res.render('with-sse');
});

router.get('/with-sse/connect', function(req, res, next) {
  const clientId = Date.now();
  console.log(`SSE ${clientId} Connection open`);
  sse.AddClient(clientId, res)

  const data = { counter: memstorage.CounterSSE, online: sse.GetClientCount(), tag: 'connect' }
  sse.Broadcast(data)

  req.on('close', () => {
    console.log(`SSE ${clientId} Connection closed`);
    sse.RemoveClient(clientId)

    const data = { counter: memstorage.CounterSSE, online: sse.GetClientCount(), tag: 'disconnect' }
    sse.Broadcast(data)
  });
});

// Realtime with SSE Event
router.get('/with-sse-event', function(req, res, next) {
  memstorage.CounterSSEEvent++
  const data = { counter: memstorage.CounterSSEEvent }
  sse.BroadcastEvent('visit', data)
  res.render('with-sse-event');
});

router.get('/with-sse-event/connect', function(req, res, next) {
  let name = 'Alien'
  if (req.query.name != '') {
    name = decodeURI(req.query.name)
  }

  const clientId = Date.now();
  console.log(`SSE ${clientId} Connection open`);
  sse.AddClient(clientId, res, {
    name
  })

  const data = { counter: memstorage.CounterSSEEvent, online: sse.GetClientCount(), name }
  sse.BroadcastEvent('hey', data)

  const interval = setInterval(() => {
    sse.BroadcastEvent('ping', {})
  }, 5000);

  req.on('close', () => {
    console.log(`SSE ${clientId} Connection closed`);
    sse.RemoveClient(clientId)

    const data = { online: sse.GetClientCount(), name}
    sse.BroadcastEvent('bye', data)

    clearInterval(interval)
  });
});

module.exports = router;
