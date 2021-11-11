import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import './App.css';
import Routes from './routes/Routes';

function App() {
  return (
	  <Router>
		  <Routes />
	  </Router>
  );
}

export default App;
