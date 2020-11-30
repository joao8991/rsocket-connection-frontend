import { Flowable, Single } from 'rsocket-types';
import { RSocketClient, JsonSerializer, IdentitySerializer } from 'rsocket-core';
import RSocketWebSocketClient from 'rsocket-websocket-client';
var client = undefined;
var clientSocket = undefined;
var messages = [];
var usernameGlobal = undefined;

class Responder {
  fireAndForget(payload) {
    logRequest('fire and forget', payload);
    messages.push({
      clientId:payload.data.clientId,
      body: payload.data.body});
  }

  requestResponse(payload){
    logRequest('requestResponse', payload);
    return Single.error(new Error());
  }

  requestStream(payload) {
    logRequest('requestStream', payload);
    return Flowable.just(make('Hello '), make('world!'));
  }

  requestChannel(payloads) {
    return Flowable.just(payloads);
  }

  metadataPush(payload){
    logRequest('metadataPush', payload);
    return Single.error(new Error());
  }
}

export function createRSocketConnection(username) {
  usernameGlobal = username;
  if (client !== undefined) {
    // reset messages when connect to a new user
    messages = [];
    client.close();
  }

  // Create an instance of a client
  client = new RSocketClient({
    serializers: {
      data: JsonSerializer,
      metadata: IdentitySerializer
    },
    setup: {
      keepAlive: 60000,
      lifetime: 180000,
      dataMimeType: 'application/json',
      metadataMimeType: 'message/x.rsocket.routing.v0',
      payload: {
        data: username,
        metadata: String.fromCharCode("client-id".length) + "client-id"
      }
    },
    responder: new Responder(),
    transport: new RSocketWebSocketClient({
      url: 'ws://localhost:8888'
    }),
  });


  client.connect().subscribe({
    onComplete: socket => {
      console.log("Complete");
      clientSocket = socket
    },
    onError: error => {
      console.log("Connection has been refused due to ", error);
    },
  });
}

export function fireMessage(username, body) {
  const request = {
    data: {
      "clientId": username, 
      "id": username,
      "body": body
    },
    metadata: String.fromCharCode("message".length) + "message",
  }

  clientSocket.fireAndForget(request)
}

function make(data){
  return {
    data,
    metadata: '',
  };
}

function logRequest(type, payload) {
  console.log("FE got ", type, " with payload: data:", payload);
}


export function getMessages(){
  const isLoggedIn = clientSocket !== undefined;
  return {
    messages: messages,
    username: usernameGlobal,
    isLogged: isLoggedIn
  }
}