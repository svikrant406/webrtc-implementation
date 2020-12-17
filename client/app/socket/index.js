import io from 'socket.io-client';

const socket = io({
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('connected to socket!')
});

socket.on('connect_error', (err) => {
  console.log(`socket connection ${err}`)
});

socket.on('reconnect_attempt', () => {
  socket.io.opts.transports = ['polling', 'websocket'];
});

export default socket;
