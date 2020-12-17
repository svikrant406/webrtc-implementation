import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { Landing, Room, RoomBroadcast } from 'Components';

class App extends React.Component {
  render() {
    return (
      <Switch>
        <Route exact path="/" component={Landing} />
        <Route exact path="/join/:roomID" component={Room} />
        <Route exact path="/broadcast/:roomID" component={RoomBroadcast} />
      </Switch>
    );
  }
}

export default App;
