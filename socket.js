const socketIO = require('socket.io');

module.exports = (server) => {
  const io = socketIO(server);

  io.on('connection', (socket) => {
    socket.on("join_peer_connection", (roomID) => {
      socket.join(roomID);

      const peers = [];
      io.of('/').in(roomID).clients((error, clients) => {
        if (error) throw error;
        for (let socketID of clients) {
          if (socketID !== socket.id)
            peers.push(socketID);
        };

        socket.emit("peers", peers);
      });
    });

    socket.on("offer", (peer, offer) => {
      socket.to(peer).emit("offer", socket.id, offer);
    });

    socket.on("answer", (peer, answer) => {
      socket.to(peer).emit("answer", socket.id, answer);
    });

    socket.on("new_ice_candidate", (peer, iceCandidate) => {
      socket.to(peer).emit("new_ice_candidate", socket.id, iceCandidate);
    });

    socket.on("watcher", (peer) => {
      socket.to(peer).emit("watcher", socket.id);
    });

    socket.on('disconnecting', () => {
      const rooms = Object.keys(socket.rooms);
      for (room of rooms)
        io.of('/').to(room).emit('leave_peer', socket.id);
    });
  });
};
