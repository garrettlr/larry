'use strict';
const pkg = require('./package.json');
const namespace = `${pkg.name}.service`;
const SINGLETON_KEY = Symbol.for(namespace);
const globalSpace = global;
const globalSymbols = Object.getOwnPropertySymbols(globalSpace);

const log = (require('./src/Logger')).getInstance();
const ApiServer = require('./src/ApiServer');
/*************************************************************************************/
/* START PROCESS UNHANDLED METHODS */
/*************************************************************************************/
process.on('unhandledRejection', (reason, p) => {
	log.fatal('Unhandled Rejection at:', p, 'reason:', reason);
	log.fatal(`${namespace} exiting due to unhandledRejection...`);
	process.exit(1);
});
process.on('uncaughtException', (err) => {
	log.fatal('Uncaught Exception:', err);
	log.fatal(`${namespace} exiting due to uncaughtException...`);
	process.exit(1);
});
// The signals we want to handle
// NOTE: although it is tempting, the SIGKILL signal (9) cannot be intercepted and handled
var signals = {
	'SIGHUP': 1,
	'SIGINT': 2,
	'SIGTERM': 15,
	'SIGSEGV': 11,
	'SIGBUS': 10, 
	'SIGFPE': 8,
	'SIGILL': 4
};
// Do any necessary shutdown logic for our application here
const shutdown = async (signal, value) => {
	//TODO gracefully shutdown here.
	const exitCode = 128 + value;
	log.fatal(`${namespace} exiting due to ${signal} with value ${value}`);
	await ApiServer.shutdown(new Error(`Received ${signal}.`), exitCode);
	process.exit(exitCode);
};
// Create a listener for each of the signals that we want to handle
Object.keys(signals).forEach((signal) => {
	process.on(signal, () => {
		log.fatal(`${namespace} received a ${signal} signal`);
		shutdown(signal, signals[signal]);
	});
});
process.on('exit', (code) => {
	log.fatal(`${namespace} exiting with code: ${code}...`);
});
/*************************************************************************************/
/* END PROCESS UNHANDLED METHODS */
/* START WEBSOCKET SERVER AS SINGLETON */
/*************************************************************************************/
//If this is the first time go ahead and create the symbol.
if (globalSymbols.indexOf(SINGLETON_KEY) === -1){
	globalSpace[SINGLETON_KEY] = new RtspForwardingServer();
	globalSpace[SINGLETON_KEY].on('ShutdownComplete',(exitCode)=>{
		log.error(`RTSP Forwarding Server shutting down with exitCode (${exitCode})...`);
		process.exit(exitCode);
	});
	globalSpace[SINGLETON_KEY].start();
}
module.exports= globalSpace[SINGLETON_KEY];