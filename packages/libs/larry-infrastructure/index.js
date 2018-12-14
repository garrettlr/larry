module.exports = {
	cliModules: {
		//jira: require('./src/cli-modules/jira/JiraCliModule'),
		slack: require('./src/cli-modules/slack/SlackCliModule'),
		scaffolds: require('@monstermakes/larry-scaffolds').cliModules.Scaffolds
	},
	libs: {
		slack: {
			SlackWebhook: require('./src/slack/SlackWebhook')
		},
		jira: {
			Jira: require('./src/jira/Jira')
		}
	}
};