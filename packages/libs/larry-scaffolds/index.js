module.exports.cliActions = {
	scaffolds: {
		GitNodeProject: require('./src/cli-actions/scaffolds/git-node-project/NodeProject.cli-action'),
		WebAppProject: require('./src/cli-actions/scaffolds/web-app-project/WebApp.cli-action'),
		AngularAppProject: require('./src/cli-actions/scaffolds/angular-app-project/AngularApp.cli-action'),
		AngularLibraryProject: require('./src/cli-actions/scaffolds/angular-library-project/AngularLibrary.cli-action'),
		ExpressApiProject: require('./src/cli-actions/scaffolds/express-api-project/ExpressApi.cli-action'),
		WebSocketProject: require('./src/cli-actions/scaffolds/ws-project/WebSocket.cli-action')
	},
	Vulgar: require('./src/cli-actions/vulgar/Vulgar.cli-action')
};
module.exports.cliModules = {
	Scaffolds: require('./src/cli-modules/Scaffolds.cli-module')
};
module.exports.generators = {
	HandlebarsFileSourceGenerator: require('./src/generators/HandlebarsFileSourceGenerator'),
	RawFileSourceGenerator: require('./src/generators/RawFileSourceGenerator'),
	SourceGenerator: require('./src/generators/SourceGenerator')
};
module.exports.scaffolders = {
	BaseScaffolder: require('./src/scaffolders/BaseScaffolder'),
	FileScaffolder: require('./src/scaffolders/FileScaffolder')
};