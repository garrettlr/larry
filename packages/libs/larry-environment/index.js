/*************************************************************************************/
/* ENVIRONMENT BASE */
/*************************************************************************************/
module.exports.environment = {
	Environment: require('./src/environment/Environment')
};
/*************************************************************************************/
/* AWS ENVIRONMENT */
/*************************************************************************************/
module.exports.aws = {
	AwsConfigSingleton: require('./src/aws/AwsConfigSingleton'),
	sdk: require('./src/aws/awsSdk'),
	services: {
		CloudFormation: require('./src/aws/services/CloudFormation'),
		ParameterStore: require('./src/aws/services/ParameterStore'),
		Ecs: require('./src/aws/services/Ecs'),
		Sso: require('./src/aws/services/Sso'),
		Profiles: require('./src/aws/services/Profiles')
	},
	environment: {
		AwsEnvironment: require('./src/aws/environment/AwsEnvironment'),
		cli: {
			AwsEnvironmentWithPrompts: require('./src/aws/environment/cli/AwsEnvironmentWithPrompts')
		}
	}
};
module.exports.cliModules = {
	AwsEnvironment: require('./src/aws/environment/cli/AwsEnvironment.cli-module')
};