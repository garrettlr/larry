# @monstermakes/larry-infrastructure

[![npm version](https://badge.fury.io/js/%40monstermakes%2Flarry-infrastructure.svg)](https://badge.fury.io/js/%40monstermakes%2Flarry-infrastructure)

[![https://nodei.co/npm/@monstermakes/larry-infrastructure.png?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/@monstermakes/larry-infrastructure.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/@monstermakes/larry-infrastructure)


---

## Overview 
The larry-infrastructure package manages and maintains your development ecosystem. This includes the automated deployment and management of all environments (e.g. Production, Staging, Test, etc...).

The larry-infrastructure package can be consumed in multiple ways (pure js library, REST API, cli, serverless components, and more). The core features of the larry-infrastructure package are exposed as an immersive command line interface (cli) named `larry`. Larry is made up of Cli Modules and Cli Actions. Cli Modules are grouped actions that are exposed to the user as a Sub Cli that can be "entered" to launch specific Cli Actions. Cli Actions can be anything from interactive cli programs to automated tasks that run to completion. In addition to being an immersive CLI Larry's Cli Actions can be launched as traditional shell scripts, which have many uses in the automation of complex workflows such as Continuous Integration (CI) & Continuous Deployment (CD) pipelines.

---

## Larry Installation

To install larry you must first have installed node and obtained the correct monstermakes npm credentials and have logged in using the `npm login` command. Once this is complete you can simply install it as a global npm dependency by executing the command `npm install -g @monstermakes/larry-infrastructure`.

---
## Cli Modules
Below you will find a brief overview of all the currently supported Cli Modules.

---

## JIRA Cli Module
The JIRA Cli Module contains the following Cli Actions, used primarily in the automation of the Continuous Integration (CI) process.

### Cli Actions
Below you will find a brief overview of all the currently support Cli Actions for the JIRA Cli Module.

#### move-issue
`move-issue [options] <status> [issue keys...]  Move one or more JIRA issues.`

This command will move a JIRA issue into the specified status. Optionally you can provide a list of issue keys (proj-1234). If you would like to pull the issue keys from the previous git commit message you can pass the `--git` and `--projectKey` flags.

The above command can be launched directly like so:
```
coin jira move-issue "on hold" proj-4
```
or if you'd like to pull issueKeys from last git commit
```
coin jira move-issue --git --projectKey proj "on hold"
```

#### Environment Variables
This command requires a few Environment variables or some can be sent via command line args (see the help). 
- JIRA_USER
- JIRA_PASS

---
## Slack Cli Module
The Slack Cli Module contains the following Cli Actions, used primarily in the automation of the Continuous Integration (CI) process.

### Cli Actions
Below you will find a brief overview of all the currently support Cli Actions for the JIRA Cli Module.

#### post message
`post-message [options] <msg>  Post a plain message to slack.`

This command sends a basic message to slack. 

The above command can be launched directly like so:
```
coin slack post-message "Hey everone"
```

##### Environment Variables
This command requires a few Environment variables or some can be sent via command line args (see the help). 
- SLACK_INCOMING_WEB_HOOK
	- See https://api.slack.com/incoming-webhooks for more details

#### post an attachement message
`post [options]  Post an attachment message to slack.`

This command sends a slack attachment message. You can alter the message using the provided command line flags `--title`, `--text`, `--pre`, `--field` flags see the command line help for more info.

The above command can be launched directly like so:
```
coin slack post --pre ":tada: NEW TERMINAL PROJECT RELEASED :tada:" --title "@monstermakes/example-web" --field "Version:3.4.5-fake-release"
```

##### Environment Variables
This command requires a few Environment variables or some can be sent via command line args (see the help). 
- SLACK_INCOMING_WEB_HOOK
	- See https://api.slack.com/incoming-webhooks for more details

#### post a release message
`post-release [options]   Post a release message to slack.`

This command looks in the current working directory for a package.json file and then produces the appropriate message. You can alter the message by using the `--terminal` and `--product` flags see the command line help for more info.

The above command can be launched directly like so:
```
coin slack post-release
```

##### Environment Variables
This command requires a few Environment variables or some can be sent via command line args (see the help). 
- SLACK_INCOMING_WEB_HOOK
	- See https://api.slack.com/incoming-webhooks for more details

---

## TODO
1. Monster Makes does not have an official JIRA instance so 
	- the integration tests are broken at this point
	- the JIRA cli module is broken
2. Monster Makes does not have an official Slack instance so the integration tests are broken at this point