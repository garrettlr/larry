'use strict';

const awsConfigSingleton = require('./AwsConfigSingleton');

module.exports = awsConfigSingleton.getAwsSdk();