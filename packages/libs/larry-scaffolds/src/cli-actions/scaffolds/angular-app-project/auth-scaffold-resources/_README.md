# {{projectName}}

[![https://nodei.co/npm/{{projectName}}.png?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/{{projectName}}.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/{{projectName}})


## Description
***Update This*** Add the intent of your package here...

## Developer Setup

This project is leveraging the `{{authProjectName}}` library to provide authentication and authorization. Make sure to first copy `src/environment-details.json.template` to `src/environment-details.json` and provide proper values. Obviously this also requires the companion auth services running.

### Developing {{authProjectName}}???
If you are working on the auth module you are going to need to the following steps, order matters so follow along.
1. Delete `node_modules/{{authProjectName}}` and then make sure the raw source version of `{{authProjectName}}` is cloned locally. 
2. Run `build-watch` in the `{{authGithubProjectName}}` project
3. Run `npm link <path to {{authGithubProjectName}}>/dist/{{authGithubProjectName}}`
4. Run `npm run serve-angular` in this project.

## TODO
1. **Update This**