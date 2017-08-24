# larry-scaffolds
[![npm version](https://badge.fury.io/js/%40monstermakes%2Flarry-scaffolds.svg)](https://badge.fury.io/js/%40monstermakes%2Flarry-scaffolds)

[![https://nodei.co/npm/@monstermakes/larry-scaffolds.png?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/@monstermakes/larry-scaffolds.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/@monstermakes/larry-scaffolds)

## Description
larry-scaffolds exposes common scaffolding tools and source generators in addition to some standard larry style scaffolds. The larry style scaffolds are also exposed as larry-cli Actions.

---
## Cli Modules
Below you will find a brief overview of all the currently supported Cli Modules.

### Scaffolds Cli Module
The Scaffolds Cli Module (Scaffolds for short) defines and evolves the MonsterMakes Engineering Standards. This includes things like code quality, testing guidelines, coding standards, and much more. The Scaffolds can be used to quickly get a project off the ground (when starting a project from scratch), or it can be used to enforce changes to the MonsterMakes Engineering Standards. 

Its very straight forward to use the Scaffolds for starting a project from scratch just create a folder (usually an empty git folder) and execute any of the below Cli Actions. 

In the case that the Engineering Standards have evolved and you are tasked with the job of upgrading a project start by making sure you have a clean git working directory. Then execute one of the below Cli Actions as if you were starting from scratch. After this is complete your git working directory will describe all of the changes that were made. There exists a couple of gotchas to keep in mind. The first is that the scaffolds are not super intelligent, there main purpose is to blindly lay down files. What this means is that if a file that the scaffold lays down has been changed within the local project it will require you to add your changes back in manually (Atlassian's Source Tree can help here). If a file should be removed because it's no longer relevant this will have to be done manually. The best course of action when being tasked with upgrading a projects standards is to talk to your team lead or to familiarize yourself with the changes that have been made to the larry-infrastructure package itself.

### Cli Actions
Below you will find a brief overview of all the currently support Cli Actions for the Scaffolds Cli Module.

#### scaffold library
`scaffold library [directory]   Scaffold out a nodejs git project that produces a standard library.`

This command will ask a few questions and then scaffold out a nodejs project with all the standard stuff mocha testing, eslint, ignore files etc... This project produces a standard npm artifact. 

It also is setup for integration into the AWS Codepipeline CI environment.

You can specify a directory to scaffold the project into otherwise it will use the current working directory.

The above command can be launched directly like so:
```
larry-scaffolds scaffold node-git
```

#### scaffold web
`scaffold web [directory]   Scaffold out a nodejs git project that produces a clientside web application.`

This command will ask a few questions and then scaffold out a nodejs project with all the standard stuff mocha testing, eslint, ignore files etc... This project produces a docker container that serves said web assets. 

It also is setup for integration into the AWS Codepipeline CI environment.

You can specify a directory to scaffold the project into otherwise it will use the current working directory.

The above command can be launched directly like so:
```
larry-scaffolds scaffold web-app
```

#### scaffold api
`scaffold api [directory]   Scaffold out a nodejs git project that produces a express API server.`

This command will ask a few questions and then scaffold out a nodejs project with all the standard stuff mocha testing, eslint, ignore files etc... This project produces a docker container that serves the api process. 

It also is setup for integration into the AWS Codepipeline CI environment.

You can specify a directory to scaffold the project into otherwise it will use the current working directory.

The above command can be launched directly like so:
```
larry-scaffolds scaffold express-api
```

#### scaffold ws
`scaffold ws [directory]   Scaffold out a nodejs git project that produces a standard websocket server.`

This command will ask a few questions and then scaffold out a nodejs project with all the standard stuff mocha testing, eslint, ignore files etc... This project produces a docker container that serves the websocket process.  

It also is setup for integration into the AWS Codepipeline CI environment.

You can specify a directory to scaffold the project into otherwise it will use the current working directory.

The above command can be launched directly like so:
```
larry-scaffolds scaffold ws
```
---

## TODO
1. Setup projects to be used together..
	- docker compose additions
2. Create Product Project
	- cloud formation and deployment tools
	
### Scaffolds Express API TODOs
1. Decide wether to validate responses or not. Currently responses are not validated.
2. Incorporate Redis into API Server

### Scaffolds WS TODOs
1. Incorporate Service Method Discovery
2. Standardize the WebSocket Messaging
	- Synchronous Messages 
		- used for RPC calls
	- Streaming Messages
		- Start / Initiate message
		- Stream messages (Bi-Directional)
		- Completion / Terminate message