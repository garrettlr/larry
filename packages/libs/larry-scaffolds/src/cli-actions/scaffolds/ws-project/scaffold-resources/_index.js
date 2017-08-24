'use strict';
const namespace = '{{serverName}}.websocket';
const SINGLETON_KEY = Symbol.for(namespace);
const globalSpace = global;

const WebSocketServer = require('./src/WebSocketServer');
const globalSymbols = Object.getOwnPropertySymbols(globalSpace);
/*************************************************************************************/
/* START PROCESS UNHANDLED METHODS */
/*************************************************************************************/
process.on('unhandledRejection', (reason, p) => {
	console.log('Unhandled Rejection at:', p, 'reason:', reason);
	process.exit(-1);
});
process.on('uncaughtException', (err) => {
	console.log('Uncaught Exception:', err);
	process.exit(-1);
});
/*************************************************************************************/
/* END PROCESS UNHANDLED METHODS */
/* START WEBSOCKET SERVER AS SINGLETON */
/*************************************************************************************/
//If this is the first time go ahead and create the symbol.
if (globalSymbols.indexOf(SINGLETON_KEY) === -1){
	globalSpace[SINGLETON_KEY] = new WebSocketServer();
	globalSpace[SINGLETON_KEY].start();
}
module.exports= globalSpace[SINGLETON_KEY];