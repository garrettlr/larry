
'use strict';
const chai = require('chai');
const should = chai.should(); // eslint-disable-line 
const expect = chai.expect; // eslint-disable-line 
const http = require('http');

const WS = require('ws');

const TEST_NAME = 'WebSocket Server';

describe(TEST_NAME, () => {
	it('should report health via health-check',() => {
		return Promise.resolve()
			.then(()=>{
				return http.get({
					host: 'localhost',
					port: {{portNumber}},
					path: '/health-check'
				}, (response)=>{
					// Continuously update stream with data
					let body = '';
					response.on('data', function(d) {
						body += d;
					});
					response.on('end', function() {
						// Data reception is done, do whatever with it!
						let parsed = JSON.parse(body);
						parsed.status.should.exist;
						parsed.status.should.eql('LISTENING');
					});
				});
			});
		
	});
	it('should establish connection', (done) => {
		const ws = new WS('ws://localhost:{{portNumber}}');
		let error = undefined;
		ws.on('open', () => {
			ws.send('hi', { compress: true });
		});
		ws.on('message', (message) => {
			try{
				message.should.eql('"hi"');
			}
			catch(e){
				error=e;
			}
			ws.close(1000,'');
		});

		ws.on('error', (err) => {
			error = err;
			ws.close(1003,error.message);
		});

		ws.on('close', (code, reason) => {
			code.should.eql(1000);
			reason.should.eql('');
			done(error);
		});
	});
	it('should be able to ping & recieve pong', (done) => {
		const ws = new WS('ws://localhost:{{portNumber}}');
		let error = undefined;
		const payload = {'hi-dude':true};
		let pingWritten = false;
		ws.on('open', () => {
			try{
				ws.ping(JSON.stringify(payload), ()=>{
					pingWritten = true;
				});
			}
			catch(e){
				error=e;
				ws.close(1000,'');
			}
		});

		ws.on('pong', (data) => {
			pingWritten.should.be.true;
			let str = data.toString();
			let pongd = JSON.parse(str);
			pongd.should.eql(payload);
			ws.close(1000,'');
		});
		
		ws.on('error', (err) => {
			error = err;
			ws.close(1003,error.message);
		});

		ws.on('close', (code, reason) => {
			code.should.eql(1000);
			reason.should.eql('');
			done(error);
		});
	});
	//Test Ping/Pong
});