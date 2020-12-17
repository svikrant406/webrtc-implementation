import React from 'react';

class Landing extends React.Component {
  handleConnectSquad = () => {
    const roomID = `${Math.round((new Date()).getTime() / 1000)}`;
    this.props.history.push(`/join/${roomID}`);
  }

  handleGoLive = () => {
    const roomID = `${Math.round((new Date()).getTime() / 1000)}`;
    this.props.history.push(`/broadcast/${roomID}`);
  }

  render() {
    return (
      <div>
        <button onClick={this.handleGoLive}>Go Live</button>
        <button onClick={this.handleConnectSquad}>Connect Squad</button>
      </div>
    )
  }
}

export default Landing;
