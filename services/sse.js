class Manager {
  clients
  constructor() {
    this.clients = []
  }

  getClientCount() {
    return this.clients.length;
  }
  
  addClient(id, res, meta) {
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
    this.clients.push(newClient);
  }
  
  removeClient(id) {
    this.clients = this.clients.filter(client => client.id !== id);
  }
  
  broadcast(data) {
    this.clients.forEach((client) => {
      client.res.write(`data: ${JSON.stringify(data)}\n\n`)
    })
  }
  
  broadcastEvent(event, data) {
    this.clients.forEach((client) => {
      client.res.write(`event: ${event}\n`)
      client.res.write(`data: ${JSON.stringify(data)}\n\n`)
    })
  }  
}

module.exports = {
  Manager
}