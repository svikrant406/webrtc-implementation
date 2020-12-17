import React, { Component } from 'react';
import socket from 'SocketIO';

const peerConnections = new Object();
const configuration = {
  "iceServers": [
    {
      "urls": "stun:stun.l.google.com:19302"
    }
  ]
};
const constraints = {
  audio: true,
  video: true
};

class Room extends Component {
  constructor(props) {
    super(props);

    this.videoRef = React.createRef();
  }

  createPeer = (peer, stream) => {
    const peerConnection = new RTCPeerConnection(configuration);

    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });

    peerConnection.addEventListener('icecandidate', (event) => {
      if (event.candidate) {
        socket.emit("new_ice_candidate", peer, event.candidate);
        console.debug("send new ice candidate to: ", peer);
      }
    });

    peerConnection.addEventListener('connectionstatechange', () => {
      console.debug("peer connection state: ", peer, peerConnection.connectionState);
      switch (peerConnection.connectionState) {
        case "disconnected":
          console.debug('disconnected peer connection: ', peer, peerConnection);
          break;
        case "failed":
          console.debug('failed peer connection: ', peer, peerConnection);
          peerConnection.restartIce();
          break;
      };
    });

    peerConnection
      .createOffer()
      .then(offer => peerConnection.setLocalDescription(offer))
      .then(() => {
        console.debug("send offer to: ", peer);
        socket.emit("offer", peer, peerConnection.localDescription);
      });

    return peerConnection;
  }

  broadcastStream = () => {
    const _that = this;

    if (window.stream) {
      window.stream.getTracks().forEach(track => {
        track.stop();
      });
    }

    if (navigator.mediaDevices === undefined)
      navigator.mediaDevices = new Object();

    if (navigator.mediaDevices.getUserMedia === undefined) {
      navigator.mediaDevices.getUserMedia = function (constraints) {
        const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

        if (!getUserMedia) {
          return Promise.reject(new Error('WebRTC is not implemented in your browser'));
        }

        return new Promise(function (resolve, reject) {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      };
    }

    return navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        window.stream = stream;
        _that.videoRef.current.srcObject = stream;
      })
      .catch(e => {
        console.error('Error accessing media devices: ', e);
      });
  }

  getRTCStream = () => {
    socket.emit("join_peer_connection", this.props.match.params.roomID);

    socket.on("peers", (peers) => {
      console.debug("peers: ", peers);

      if (peers.length === 0)
        this.broadcastStream();
      else {
        const peer = peers[0];
        socket.emit('watcher', peer);
      };
    });

    socket.on('watcher', (peer) => {
      const peerConnection = this.createPeer(peer, window.stream);
      peerConnections[peer] = peerConnection;
    });

    socket.on("offer", (peer, offer) => {
      console.debug("received offer from: ", peer);
      const peerConnection = new RTCPeerConnection(configuration);

      const remoteStream = new MediaStream();

      this.videoRef.current.srcObject = remoteStream;

      peerConnection.addEventListener('track', async (event) => {
        remoteStream.addTrack(event.track, remoteStream);
      });

      peerConnection.addEventListener('connectionstatechange', () => {
        console.debug("peer connection state: ", peer, peerConnection.connectionState);
        switch (peerConnection.connectionState) {
          case "disconnected":
            console.debug('disconnected peer connection: ', peer, peerConnection);
            break;
          case "failed":
            console.debug('failed peer connection: ', peer, peerConnection);
            peerConnection.restartIce();
            break;
        };
      });

      peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      peerConnection
        .createAnswer()
        .then(answer => peerConnection.setLocalDescription(answer))
        .then(() => {
          console.debug("send answer to: ", peer);
          socket.emit("answer", peer, peerConnection.localDescription);
        });

      peerConnections[peer] = peerConnection;
    });

    socket.on("answer", (peer, answer) => {
      console.debug("received answer from: ", peer);
      const remoteDescription = new RTCSessionDescription(answer);

      peerConnections[peer]
        .setRemoteDescription(remoteDescription)
        .catch(e => {
          console.error('Error adding remote description: ', e);
        });
    });

    socket.on("new_ice_candidate", (peer, iceCandidate) => {
      console.debug("received ice candidate from: ", peer);
      peerConnections[peer]
        .addIceCandidate(new RTCIceCandidate(iceCandidate))
        .catch(e => {
          console.error('Error adding received ice candidate: ', e);
        });
    });
  }

  componentDidMount() {
    this.getRTCStream();
  }

  render() {
    return (
      <div>
        <video
          ref={this.videoRef}
          autoPlay
          playsInline
          className="video"
        />
      </div>
    )
  }
}

export default Room;
