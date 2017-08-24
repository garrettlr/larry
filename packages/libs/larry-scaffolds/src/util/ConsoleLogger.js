const pkg = require('../../package.json');
const CoreLogger = require('@monstermakes/larry-logger');
module.exports = CoreLogger.getConsoleLogger(pkg.name);