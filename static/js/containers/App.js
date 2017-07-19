// @flow
import React from 'react';
import { Route } from 'react-router-dom';

import HomePage from './HomePage';
import ChannelPage from './ChannelPage';

import type { Match } from 'react-router';

export default class App extends React.Component {
  props: {
    match: Match,
  }

  render() {
    const { match } = this.props;
    return (
      <div className="app">
        <Route exact path={match.url} component={HomePage}/>
        <Route path={`${match.url}channel/:channelName`} component={ChannelPage}/>
      </div>
    );
  }
}
