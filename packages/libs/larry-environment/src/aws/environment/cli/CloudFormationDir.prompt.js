const pathUtils = require('path');

module.exports = {
	type:'String',
	name:'cloudFormationDir',
	message:'Provide the location of the Environment\'s cloud formation templates to use => ',
	description:'The location of the Environment\'s cloud formation templates.',
	default: pathUtils.join(process.cwd(),'cloud-formation')
};