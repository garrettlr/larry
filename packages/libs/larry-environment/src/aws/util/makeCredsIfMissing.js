const path = require('path');
const os = require('os');
const fs = require('fs');
const AWS_CREDENTIALS_PATH = path.resolve(os.homedir(), '.aws', 'credentials');
const AWS_CONFIG_PATH = path.resolve(os.homedir(), '.aws', 'config');

/**
 * the aws SDK will crash hard in the singleton if these files aren't present.
 * they can be empty - the sso loop will fill in what is needed to proceed.
 * @param {*} path 
 */
const _makeCredsIfMissing = path => {
  // touch if missing.
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, '');
  }
}

const makeCredsIfMissing = () => {
  _makeCredsIfMissing(AWS_CONFIG_PATH);
  _makeCredsIfMissing(AWS_CREDENTIALS_PATH);
}

module.exports = makeCredsIfMissing;