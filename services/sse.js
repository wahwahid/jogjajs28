var SSEClients = []

function GetClientCount() {
  return SSEClients.length;
}

function AddClient(id, res, meta) {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  res.writeHead(200, headers);

  const newClient = {
    id,
    res,
    meta
  };
  SSEClients.push(newClient);
}

function RemoveClient(id) {
  SSEClients = SSEClients.filter(client => client.id !== id);
}

function Broadcast(data) {
  SSEClients.forEach((client) => {
    client.res.write(`data: ${JSON.stringify(data)}\n\n`)
  })
}

function BroadcastEvent(event, data) {
  SSEClients.forEach((client) => {
    client.res.write(`event: ${event}\n`)
    client.res.write(`data: ${JSON.stringify(data)}\n\n`)
  })
}

module.exports = {
  GetClientCount,
  AddClient,
  RemoveClient,
  Broadcast,
  BroadcastEvent,
}