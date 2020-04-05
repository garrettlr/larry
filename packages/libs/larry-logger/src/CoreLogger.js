'use strict';
const bunyan = require('bunyan');
const ConsoleLoggerStream = require('./ConsoleLoggerStream');

class CoreLogger {
	static create(loggerName, streams) {
		let log = bunyan.createLogger({
			name: loggerName,
			streams: streams
		});
		return log;
	}

	static getDefaultLogger(loggerName, logLevel) {
		return CoreLogger.create(loggerName, [
			{level: logLevel, type: 'raw', stream: ConsoleLoggerStream(bunyan)}
		]);
	}

	static getConsoleLogger(loggerName, logLevel) {
		return CoreLogger.create(loggerName, [{
			level: logLevel,
			stream: ConsoleLoggerStream(bunyan),
			type: 'raw'
		}]);
	}

}

module.exports = CoreLogger;
