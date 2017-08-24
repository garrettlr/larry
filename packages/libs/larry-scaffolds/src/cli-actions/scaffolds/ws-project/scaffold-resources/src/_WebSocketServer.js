'use strict';
const WS = require('ws');
{{#if secureSocket}}
const https = require('https');
{{else}}
const http = require('http');
{{/if}}
const UrlUtils = require('url');

const STATUS = {
	INITIALIZING: 'INITIALIZING',
	UNKNOWN:'UNKNOWN',
	STARTING:'STARTING',
	LISTENING: 'LISTENING',
	CONNECTED:'CONNECTED',
	ERRORD:'ERRORD',
	SHUTDOWN:'SHUTDOWN',
};
Object.freeze(STATUS);

class WebSocketServer{
	constructor(){
		let options = {
			{{#if secureSocket}}
			// These properties setup TLS connection, requires a client certificate and validates that cert against the provided Certificate Authority
			cert: fs.readFileSync('./certs/server_cert.pem'),
			key: fs.readFileSync('./certs/server_key.pem'),
			ca: [fs.readFileSync('./certs/server_cert.pem')],
			passphrase: process.env.WSS_CERT_PASSPHRASE,
			// this requests a client certificate
			requestCert: true, 
			// this will reject if the client certificate is not verified against one of the above CAs
			rejectUnauthorized: true,
			{{/if}}
			verifyClient: this._verifyClient,
			clientTracking: true
		};
		this._setStatus(this.STATUS_STATES.INITIALIZING);

		this._pingPollInterval = process.env.PING_POLL_INTERVAL || 30000;

		{{#if secureSocket}}
		this._server = new https.createServer(options);
		{{else}}
		this._server = new http.createServer(options);
		{{/if}}
		
		this._webSocketServer = new WS.Server({ 
			server: this._server 
		});
	}
	/*************************************************************************************/
	/* START PRIVATE METHODS */
	/*************************************************************************************/
	_setStatus(status){
		if(this.STATUS_STATES.hasOwnProperty(status)){
			this._status = status;
		}
		else{
			throw new Error(`Unknown Status, cannot set the status of the Websocket Server ({{serverName}}) to ${status}`);
		}
	}
	/**
	 * This will start a timer that will ping all "connected" websockets every PING_POLL_INTERVAL 
	 * If pings dont come back by the next turn of the PING_POLL_INTERVAL then these websockets will be terminated.
	 * Note: This is needed to handle edge cases around losing internet connection between client/server.
	 */
	_startPingPoller() {
		if (this._pingTimer) {
			this._stopPingPoller();
		}
		this._pingTimer = setInterval(() => {
			this._webSocketServer.clients.forEach((websocket) => {
				if (websocket.isAlive === false) {
					console.info('Websocket Server ({{serverName}}) found dead websocket, its being terminated...',websocket);
					websocket.terminate();
				}
				else {
					websocket.isAlive = false;
					websocket.ping();
				}
			});
		}, this._pingPollInterval);
		console.debug('Websocket Server ({{serverName}}) ping timer has started');
	}
	_stopPingPoller(){
		clearInterval(this._pingTimer);
		console.debug('Websocket Server ({{serverName}}) ping timer has been stopped');
	}
	_registerWebsocketHandlers(websocket){
		let closeHdlr,errorHdlr,msgHdlr,openHdlr,unexptdHdlr,upgrdHdlr,pingHdlr,pongHdlr = undefined;
		//Add websocket connection handlers
		websocket.on('close', closeHdlr = (code,reason)=>{
			this._onWebSocketClose(websocket,code,reason);
			websocket.removeEventListener('close',closeHdlr);
			websocket.removeEventListener('error',errorHdlr);
			websocket.removeEventListener('message',msgHdlr);
			websocket.removeEventListener('open',openHdlr);
			websocket.removeEventListener('unexpected-response',unexptdHdlr);
			websocket.removeEventListener('upgrade',upgrdHdlr);
			websocket.removeEventListener('ping',pingHdlr);
			websocket.removeEventListener('pong',pongHdlr);
		});
		websocket.on('error', errorHdlr = (error)=>{
			this._onWebSocketError(websocket,error);
		});
		websocket.on('message', msgHdlr = (data)=>{
			this._onWebSocketMessage(websocket,data);
		});
		websocket.on('open', openHdlr = ()=>{
			this._onWebSocketOpen(websocket);
		});
		websocket.on('unexpected-response', unexptdHdlr = (req,res)=>{
			this._onWebSocketUnexpectedResponse(websocket,req,res);
		});
		websocket.on('upgrade', upgrdHdlr = (res)=>{
			this._onWebSocketUpgrade(websocket,res);
		});
		websocket.on('ping', pingHdlr = (data)=>{
			this._onWebSocketPing(websocket,data);
		});
		websocket.on('pong', pongHdlr = (data)=>{
			websocket.isAlive = true;
			this._onWebSocketPong(websocket,data);
		});
	}
	/*************************************************************************************/
	/* START PUBLIC API METHODS */
	/*************************************************************************************/
	get STATUS_STATES(){
		return STATUS;
	}
	getStatus(){
		return this._status;
	}
	start(){
		this._server.listen(8080);	
		this._server.on('request', this._onRawHttpRequest = this._onRawHttpRequest.bind(this));
		this._webSocketServer.on('listening', this._onListening = this._onListening.bind(this));
		this._webSocketServer.on('connection', this._onConnection = this._onConnection.bind(this));
		this._webSocketServer.on('close', this._onClose = this._onClose.bind(this));
		this._webSocketServer.on('error', this._onError = this._onError.bind(this));
		this._webSocketServer.on('headers', this._onHeaders = this._onHeaders.bind(this));
		this._webSocketServer.on('ping', this._onPing = this._onPing.bind(this));
		this._webSocketServer.on('pong', this._onPong = this._onPong.bind(this));
	}
	shutdown(){
		this._stopPingPoller();
		this._server.removeListener('request', this._onRawHttpRequest);
		this._webSocketServer.removeListener('listening', this._onListening);
		this._webSocketServer.removeListener('connection', this._onConnection);
		this._webSocketServer.removeListener('close', this._onClose);
		this._webSocketServer.removeListener('error', this._onError);
		this._webSocketServer.removeListener('headers', this._onHeaders);
		this._webSocketServer.removeListener('ping', this._onPing);
		this._webSocketServer.removeListener('pong', this._onPong);
	}
	/*************************************************************************************/
	/* END PUBLIC API METHODS */
	/* START HTTP SERVER HANDLER METHODS */
	/*************************************************************************************/
	/**
	 * @param {http.IncomingMessage} request - The HTTP request.
	 * @param {http.ServerResponse} response - The HTTP response.
	 */
	_onRawHttpRequest(request, response) {
		const parsedUrl = UrlUtils.parse(request.url);
		switch (parsedUrl.pathname) {
		case '/health-check':
			response.statusCode = 200;
			response.setHeader('Content-Type', 'application/json');
			var payload = {
				status: this.getStatus()
			};
			response.end(JSON.stringify(payload),'utf8');
			break;
		}
	}
	/*************************************************************************************/
	/* END HTTP SERVER HANDLER METHODS */
	/* START WEB SOCKET SERVER HANDLER METHODS */
	/*************************************************************************************/
	/**
	 * Called when the underlying server has been bound.
	 */
	_onListening(){
		const address = this._server.address();
		this._setStatus(this.STATUS_STATES.LISTENING);	
		this._startPingPoller();
		console.info(`Websocket Server ({{serverName}}) listening on Address: ${address} and port : ${address.port}`);
	}
	/**
	 * Called when the client handshake is complete.
	 * @param {WebSocket} websocket - A handle to the websocket
	 * @param {http.IncomingMessage} req - The http GET request sent by the client, useful for parsing authority headers, cookie headers, and other information.
	 */
	_onConnection(websocket, req) { //eslint-disable-line
		console.debug(`Connection established from ${req.connection.remoteAddress} to Websocket Server ({{serverName}}).`);

		this._registerWebsocketHandlers(websocket);
		
		//TODO setup ping/pong handlers
	}
	/**
	 * Called when the server closes.
	 */
	_onClose(){
		console.info('Websocket Server ({{serverName}}) closed.');
		this._setStatus(this.STATUS_STATES.SHUTDOWN);
	}
	/**
	 * Called when an error occurs on the underlying server.
	 * @param {Error} error 
	 */
	_onError(error){
		console.error('Websocket Server ({{serverName}}) error\'d.',error);
		this._setStatus(this.STATUS_STATES.ERRORD);
	}
	/**
	 * Called before the response headers are written to the socket as part of the handshake. 
	 * This allows you to inspect/modify the headers before they are sent.
	 * @param {*} headers 
	 * @param {*} request 
	 */
	_onHeaders(headers,request){//eslint-disable-line
		console.debug('Websocket Server ({{serverName}}) headers were written.',headers,request);
	}
	/**
	 * Called when a ping is received from the client.
	 * @param {Buffer} data 
	 */
	_onPing(data){//eslint-disable-line
		console.debug('Websocket Server ({{serverName}}) received ping.',data);
	}
	/**
	 * Called when a pong is received from the client.
	 * @param {Buffer} data 
	 */
	_onPong(data){//eslint-disable-line
		console.debug('Websocket Server ({{serverName}}) received pong.',data);
	}
	/*************************************************************************************/
	/* END WEB SOCKET SERVER HANDLER METHODS */
	/* START WEB SOCKET HANDLER METHODS */
	/*************************************************************************************/
	/**
	 * Called when the connection is closed.
	 * @param {number} code - is a numeric value indicating the status code explaining why the connection has been closed. See https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent for more details.
	 * @param {string} reason - is a human-readable string explaining why the connection has been closed.
	 */
	_onWebSocketClose(websocket,code,reason){//eslint-disable-line
		console.info('Websocket closed.',code,reason);
		if(this._webSocketServer.clients.length === 0){
			this._setStatus(this.STATUS_STATES.LISTENING);
		}
	}
	/**
	 * Called when an error occurs.
	 * @param {Error} error - The error encountered.
	 */
	_onWebSocketError(websocket,error){//eslint-disable-line
		console.error('Websocket Error\'d.',error);
		this._setStatus(this.STATUS_STATES.ERRORD);
	}
	/**
	 * Called when a message is received from the server.
	 * @param {String|Buffer|ArrayBuffer|Buffer[]} data - Data received in the message
	 */
	_onWebSocketMessage(websocket,data){
		console.debug('Websocket received message.',data);
		/*********************************************/
		/*************v CHANGE THIS CODE v************/
		/*********************************************/
		//TODO Add Client specific Messaging here
		websocket.send(JSON.stringify(data),(error)=>{
			if(error){
				console.debug('Not Good!',error);
			}
			else{
				console.debug('All Good!');
			}
		});
		/*********************************************/
		/************^ CHANGE ABOVE CODE ^************/
		/*********************************************/
	}
	/**
	 * Called when the connection is established.
	 */
	_onWebSocketOpen(websocket){ //eslint-disable-line
		console.debug('Websocket connected.');
		this._setStatus(this.STATUS_STATES.CONNECTED);
	}
	/**
	 * Called when a ping is received from the server.
	 * @param {Buffer} data 
	 */
	_onWebSocketPing(websocket,data){//eslint-disable-line
		console.debug('Websocket ping\'d.',data);
	}
	/**
	 * Called when a pong is received from the server.
	 * @param {Buffer} data 
	 */
	_onWebSocketPong(websocket,data){//eslint-disable-line
		console.debug('Websocket pong\'d.',data);
	}
	/**
	 * Called when the server response is not the expected one, for example a 401 response. 
	 * This event gives the ability to read the response in order to extract useful information. 
	 * If the server sends an invalid response and there isn't a listener for this event, an error is emitted.
	 * @param {http.ClientRequest} request 
	 * @param {http.IncomingMessage} response 
	 */
	_onWebSocketUnexpectedResponse(websocket,request,response){//eslint-disable-line
		console.debug('Websocket recieved unexpected response.',request,response);
	}
	/**
	 * Called when response headers are received from the server as part of the handshake. 
	 * This allows you to read headers from the server, for example 'set-cookie' headers.
	 * @param {http.IncomingMessage} response 
	 */
	_onWebSocketUpgrade(websocket,response){//eslint-disable-line
		console.debug('Websocket upgraded.',response);
	}
	/*************************************************************************************/
	/* END WEB SOCKET HANDLER METHODS */
	/* START CLIENT VERIFICATION HANDLER METHODS */
	/*************************************************************************************/
	/**
	 * @typedef VerifyCallback
	 * @type {function}
	 * 
	 * @argument {boolean} - Whether or not to accept the handshake.
	 * @argument {Number} code - When result is false this field determines the HTTP error status code to be sent to the client.
	 * @argument {String} name - When result is false this field determines the HTTP reason phrase.
	 * @argument {Object} headers - When result is false this field determines additional HTTP headers to be sent to the client. For example, { 'Retry-After': 120 }.
	 */
	/**
	 * @param {object} info
	 * @param {string} info.origin - The value in the Origin header indicated by the client.
	 * @param {http.IncomingMessage} info.req - The client HTTP GET request.
	 * @param {boolean} info.secure - true if req.connection.authorized or req.connection.encrypted is set.
	 * 
	 * @param {VerifyCallback} cb - A callback that must be called by the user upon inspection of the info fields. For arguments see VerifyCallback type above.
	 */
	_verifyClient(info, cb){
		//TODO default implementation is to accept all client connections
		cb(true);
	}
	/*************************************************************************************/
	/* END CLIENT VERIFICATION HANDLER METHODS */
	/*************************************************************************************/
}
module.exports = WebSocketServer;