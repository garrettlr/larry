# larry-environment

[![npm version](https://badge.fury.io/js/%40monstermakes%2Flarry-environment.svg)](https://badge.fury.io/js/%40monstermakes%2Flarry-environment)

[![https://nodei.co/npm/@monstermakes/larry-environment.png?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/@monstermakes/larry-environment.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/@monstermakes/larry-environment)


## Description
Represents the tooling and libraries needed to deploy and maintain a cloud based environment.

TODO
Talk to the fact that there is an AWS version only at this point

## AWS Environment TODOs
1. Add support for Parameters with `AllowedPattern`
	- Currently the AllowedPattern does not come in the response from the getTemplateSummary call
	- I added support issue https://github.com/aws/aws-sdk-js/issues/2519 to the git repo, asking for help