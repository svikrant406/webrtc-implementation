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

    this.localStream = React.createRef();
    this.remoteStream = React.createRef();
  }

  createPeer = (peer, stream) => {
    const peerConnection = new RTCPeerConnection(configuration);

    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });

    const remoteStream = new MediaStream();
    this.remoteStream.current.srcObject = remoteStream;

    peerConnection.addEventListener('track', async (event) => {
      remoteStream.addTrack(event.track, remoteStream);
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

  getRTCStream = () => {
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
        _that.localStream.current.srcObject = stream;

        socket.emit("join_peer_connection", _that.props.match.params.roomID);

        socket.on("peers", (peers) => {
          console.debug("peers: ", peers);
          peers.forEach(peer => {
            if (!peerConnections[peer]) {
              const peerConnection = _that.createPeer(peer, stream);
              peerConnections[peer] = peerConnection;
            };
          });
        });

        socket.on("offer", (peer, offer) => {
          console.debug("received offer from: ", peer);
          const peerConnection = new RTCPeerConnection(configuration);

          peerConnection.addEventListener('connectionstatechange', event => {
            console.debug('connectionstatechange', peerConnection.connectionState, peer);
          });

          stream.getTracks().forEach(track => {
            peerConnection.addTrack(track, stream);
          });

          const remoteStream = new MediaStream();

          _that.remoteStream.current.srcObject = remoteStream;

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
      })
      .catch(e => {
        console.error('Error accessing media devices: ', e);
      });
  }

  componentDidMount() {
    this.getRTCStream();
  }

  render() {
    return (
      <div>
        <video
          ref={this.localStream}
          autoPlay
          playsInline
          className="video"
        />
        <video
          ref={this.remoteStream}
          autoPlay
          playsInline
          className="video"
        />
      </div>
    )
  }
}

export default Room;
