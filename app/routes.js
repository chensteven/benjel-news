import React from 'react';
import {Route} from 'react-router';
import App from './components/App';
import Home from './components/Home';

export default(
	<Router handler={App})>
		<Route path="/" handler={Home} />
	</Route
);