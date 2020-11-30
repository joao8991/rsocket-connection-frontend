import './App.css';
import 'bootstrap/dist/css/bootstrap.css';
import { createRSocketConnection, getMessages, fireMessage } from './rsocket';
import React, { useState } from 'react';

function App() {
  const [username, setUsername] = useState("");
  const [body, setBody] = useState("");
  const [messages, setMessages] = useState({
    loggedIn: false,
    username: undefined,
    messages: [],
  });


  setInterval(() => {
    setMessages(getMessages());
  }, 500)

  const handleInputChange = (event) => {
    setUsername(event.target.value);
  }

  const handleFireMessage = () => {
    fireMessage(username, body)
  }

  const handleBodyChange = (event) => {
    setBody(event.target.value);
  }

  const login = () => {
    createRSocketConnection(username);
  }

  const renderSqsSide = () => {
    if (messages.isLogged) {
      return (<div>
        <div><h2>{messages.username} is logged in</h2></div>
        <div>
          <div>
            <input className="m-2" type="text" placeholder="body" onChange={handleBodyChange}></input>
            <button className="btn btn-primary m-2" onClick={handleFireMessage}>Send message</button>
          </div>
        </div>
        <div>
          <h2>Notifications</h2>
          <div>
            {
              messages.messages.length > 0 ?
              (messages.messages.map(message => {
                return (<div className="alert alert-success text-left" role="alert">
                {JSON.stringify(message, null, 2)}
              </div>);
              })):
            (<h3>{messages.username} don't have any message :(</h3>)
            }
          </div>
        </div>
      </div>)
    }
    return (<div><h3>No user is logged in</h3></div>)
  }

  return (
    <div className="App">
      <div className="container-fluid">
        <div><h1>MAN Now RSocket POC</h1></div>
        <div className="row">
          <div className="form-group col-12">
            <input className="m-2" type="text" placeholder="username" value={username} onChange={handleInputChange} />
            <button className="btn btn-primary m-2" onClick={login}>Login</button>
            <h2 className="text-success">Backend simulator</h2>
            {renderSqsSide()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
