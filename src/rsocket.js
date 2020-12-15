import { Flowable, Single } from 'rsocket-types';
import { RSocketClient, JsonSerializer, IdentitySerializer } from 'rsocket-core';
import RSocketWebSocketClient from 'rsocket-websocket-client';
var client;
var clientSocket;
var messages = [];
var usernameGlobal;
const connectionRoute = "client-id";
const messageRoute = "message";

class Responder {
  fireAndForget = (payload) => {
    logRequest('fire and forget', payload);
    messages.push({
      clientId: payload.data.clientId,
      body: payload.data.body
    });
  }

  requestResponse = (payload) => {
    logRequest('requestResponse', payload);
    return Single.error(new Error());
  }

  requestStream = (payload) => {
    logRequest('requestStream', payload);
    return Flowable.just(make('Hello '), make('world!'));
  }

  requestChannel = (payloads) => {
    return Flowable.just(payloads);
  }

  metadataPush = (payload) => {
    logRequest('metadataPush', payload);
    return Single.error(new Error());
  }
}


export const createRSocketConnection = (username) => {
  usernameGlobal = username;
  if (client !== undefined) {
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
        metadata: String.fromCharCode(connectionRoute.length) + connectionRoute
      }
    },
    responder: new Responder(),
    transport: new RSocketWebSocketClient({
      url: 'ws://localhost:8888',
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

export const fireMessage = (username, body) => {
  const request = {
    data: {
      "clientId": username,
      "id": username,
      "body": body
    },
    metadata: String.fromCharCode(messageRoute.length) + messageRoute,
  }

  clientSocket.fireAndForget(request)
}

const make = (data) => {
  return {
    data,
    metadata: '',
  };
}

const logRequest = (type, payload) => {
  console.log("FE got ", type, " with payload: data:", payload);
}


export function getMessages() {
  const isLoggedIn = clientSocket !== undefined && clientSocket._machine !== undefined;
  return {
    messages: messages,
    username: usernameGlobal,
    isLogged: isLoggedIn
  }
}