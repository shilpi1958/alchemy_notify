const express = require('express')
const path = require('path')
const socketIO = require('socket.io');
const PORT = process.env.PORT || 5000
const fetch = require('node-fetch');

// start the express server with the appropriate routes for our webhook and web requests
var app = express()
  .use(express.static(path.join(__dirname, 'public')))
  .use(express.json())
  .post('/alchemyhook', (req, res) => { notificationReceived(req); res.status(200).end() })
  .get('/*', (req, res) => res.sendFile(path.join(__dirname + '/index.html')))
  .listen(PORT, () => console.log(`Listening on ${PORT}`))

// start the websocket server
const io = socketIO(app);

// listen for client connections/calls on the WebSocket server
io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('disconnect', () => console.log('Client disconnected'));
  socket.on('register address', (msg) => {
    //send address to Alchemy to add to notification
    addAddress(msg);
  });
});

// notification received from Alchemy from the webhook. Let the clients know.
function notificationReceived(req) {
  console.log("notification received!");
  io.emit('notification', JSON.stringify(req.body));
}

// add an address to a notification in Alchemy
async function addAddress(new_address) {
  console.log("adding address " + new_address);
  const body = { webhook_id: "wh_rl7j83v32vucynv2", addresses_to_add: [new_address], addresses_to_remove: [] };
  try {
    fetch('https://dashboard.alchemyapi.io/api/update-webhook-addresses', {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
      headers: { 'X-Alchemy-Token': "7n9LqiuX3BZQw_SYwYJjNuq8k7dynI2P"}
    })
      .then(res => res.json())
      .then(json => console.log("Successfully added address:", json))
      .catch(err => console.log("Error! Unable to add address:", err));
  }
  catch (err) {
    console.error(err);
  }
}
