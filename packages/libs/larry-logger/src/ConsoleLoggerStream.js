'use strict';
module.exports = function(bunyan){

	function ConsoleLoggerStream() {}

	ConsoleLoggerStream.prototype.write = function (rec) {
		// eslint-disable-next-line
		console.log('[%s] %s: %s',
			rec.time.toISOString(),
			bunyan.nameFromLevel[rec.level],
			rec.msg,
			rec);
	};

	return new ConsoleLoggerStream();
};