# Description

This project exists to educate development staff on Larry's SCM (Source Control Management) standards and policies. 

This project includes:

- a complete write up on the standards around SCM strategies, Branching Workflows and Artifacts / Releases, to learn more see [Larry Standards](#larry-standards)
- a carefully crafted git history to showcase all the common and some complex development workflows
	- use your git log tool of choice and look at commits, commit messages, branches, tags and file changes to get a feel for the workflows
- a curated set of helpful links about mono repos, and lerna [Helpful Resources](#helpful-resources)
- simulations to get some hands on experience with all of this information
	- A set of bash scripts have been added to exercise these common scenarios
	- For more details take a look at [how to use this Project](#how-to-use-this-project)

---

# Larry Standards

## SCM, Branching, and Release Strategy

Larry's SCM (source control management), branching workflow, and artifact release strategies are based on principles and realizations developed across years of hands on experience and industry best practices. For those of you who love the "why" of things or want to understand the motivation behind these strategies please read on. For those of you who want to just get things done feel free to skip this section.

Larry has carefully crafted these strategies to provide the ability to describe complex behaviors, separate concerns, scale teams, describe changes over time, guarantee consistency across releases and to convey the amount of vetting of a particular release. To understand how lets take you through the development lifecycle of a complex system (from early days to sunsetting).

In the beginning (introduction) of any complex system all you need is a small focused team that can describe the behaviors of the system. Source code is the tool we developers use to describe these behaviors. This is great but software evolves and source code is not well suited for describing this change. Source code has some very crude ways to describe change (e.g; file/folder names, comments) all of which require lots of reading and a deep understanding of the code. SCM (Source Control Management or Version Control) brings the ability to describe the change in behavior over time by providing the developer with a way to summarize the changes and a complete diff (changeset) of the behavior change. When the team is small and the behaviors are simple these are all the tools required to effectively solve real world problems.

The next stage in a complex system's lifecycle is "growth". When this happens the amount and complexity of the behaviors explodes, causing the amount of source code to grow. As the team grows to match the expanding source code the teams ability to prevent breaking side affects or to discern the contract of the code declines rapidly. The natural solution to preventing side affects and better defining contracts is separating concerns, usually in the form of splitting the code into many small pieces (packages). After the codebase goes through this transformation you are left with the ability to describe the behaviors and their changes over time, while still enforcing contracts across the code and preventing side affects. This transformation leaves you faced with very long list of new challenges, here are a few of these challenges relevant to this topic;  [dependency hell](https://npm.github.io/how-npm-works-docs/theory-and-design/dependency-hell.html), summarizing changes of behaviors across packages, keeping behaviors consistent across releases. Dependency hell is a very complicated problem to solve but luckily is handled by package management tools like [npm](https://www.npmjs.com/) and [yarn](https://yarnpkg.com/). The second challenge again is a very complicated problem that has been addressed by adopting [semantic versioning](https://semver.org/). To guarantee consistency across releases a new concept must be introduced, Artifacts. Artifacts are a frozen in time (immutable) representation of source code. When paired with semantic versioning artifacts can describe change in behavior and guarantee consistency across releases.

As the complex system grows it begins to mature (maturity stage) its at this point in the systems lifecycle where the day to day mechanics of building and maintaining becomes assumed and the focus shifts to guaranteeing stability, quality, and repeatability. Human error is the greatest source of instability, inefficiency and chaos which is why most maturing complex systems turn to automation. Automation comes in many forms, i.e; CI/CD pipelines, Orchestration, Testing. Automation can be greatly simplified if what you are automating adheres to a well thought out set of policies and practices. It is this reason why we at Larry put such an emphasis on our SCM, Branching, and Release Strategies. 

Version control, package management, semantic versioning, artifacts and automation are the tools we use on top of our policies and practices to describe complex behaviors, separate concerns, scale teams, describe changes over time, guarantee consistency across releases and to convey the amount of vetting of a particular release. 

The next few sections will walk you through these strategies using common scenarios as examples...

### Normal Bug or Enhancement workflow

Once a bug or enhancement has a definition of done (See wiki for more details on Service Desk, Shaping and Issue Management) the developer will use the associated JIRA Issue Key to create a [feature branch](#feature-branches-afd-). This feature branch should always be branched from the HEAD of master, unless instructed otherwise by the Project lead. The developer iterates on their code until they have reached "done" and all their developer tests are passing locally. 

At this point the developer should submit a pull request to the latest alpha branch, unless instructed otherwise by the Project lead. After the code is reviewed and the pull request is accepted and squash merged by one of the code owners the Alpha bitbucket pipeline will be launched (see [alpha branch](#alpha-branches-alpha-) to understand the steps involved). Once the developer tests pass on all the packages the terminal packages are released as artifacts. The associated alpha environment can then be upgraded with these new artifacts (immediately if Continuous Deployment is setup). 

Alpha testing can now take place. At some point the Project lead and Product owners will decide the alpha code is ready to be promoted to beta and undergo further testing. The project lead (in coordination with the code owners) will submit a pull request from the HEAD of the alpha branch to the decided upon [beta](#beta-branches-beta-) branch. Once the pull request is merged the BETA bitbucket pipeline will be launched (see [beta](#beta-branches-beta-) to understand the steps involved). The alpha artifacts associated with the changed packages are promoted to beta artifacts, and are available to be deployed. QA and acceptance testing begins.

Beta testing can now take place. At some point the Project lead and Product owners will decide the beta code is ready to be promoted to a release candidate and undergo further testing. The project lead (in coordination with the code owners) will submit a pull request from the HEAD of the beta branch to the decided upon [release candidate](#release-candidate-branches-rc-) branch. Once the pull request is merged the RC bitbucket pipeline will be launched (see [release candidate](#release-candidate-branches-rc-) to understand the steps involved). The beta artifacts associated with the changed packages are promoted to release candidates, and are available to be deployed. Final QA and acceptance testing begins.

Once the product owners (and potentially customers) agree the release candidate is acceptable the Project Lead will submit a pull request to [master](#generally-available-branch-master). Once the pull request is merged the GA bitbucket pipeline will be launched (see [master](#generally-available-branch-master) to understand the steps involved). This promotes the release candidate artifacts to GA artifacts, and are available to be deployed.

### Time constrained Bug or Enhancement workflow
Once a bug or enhancement has a definition of done (See wiki for more details on Service Desk, Shaping and general, Issue Management) the developer will use the associated JIRA Issue Key to create a [feature branch](#feature-branches-afd-). This feature branch will be branched from the HEAD of master or from the HEAD of a release branch, this will be determined by coordinating with the Project lead. The developer iterates on their code until they have reached "done" and all their developer tests are passing locally. 

At this point the developer should submit a pull request to the release branch (coordinate with the Project lead to determine which release branch). Once the pull request is merged the RC bitbucket pipeline will be launched (see [release candidate](#release-candidate-branches-rc-) to understand the steps involved). Once all the developer tests, and automated tests pass across the changed packages these packages will be releases as release candidates artifacts, and are available to be deployed. QA and acceptance testing begins.

Once the product owners (and potentially customers) agree the release candidate is acceptable the Project Lead will submit a pull request to [master](#generally-available-branch-master). Once the pull request is merged the GA bitbucket pipeline will be launched (see [master](#generally-available-branch-master) to understand the steps involved). This promotes the release candidate artifacts to GA artifacts, and are available to be deployed.

### EMERGENCY Hot Patch workflow
Once a bug or enhancement has a definition of done (See wiki for more details on Service Desk, Shaping and general, Issue Management) the developer will use the associated JIRA Issue Key to create a [feature branch](#feature-branches-afd-). This feature branch will be branched from the HEAD of the [hot patch](#hot-patch-branches-hot-) branch designated by the Project lead. The developer iterates on their code until they have reached "done" and all their developer tests are passing locally. 

At this point the developer should submit a pull request to the hot patch branch. Once the pull request is merged the Hot Patch bitbucket pipeline will be launched (see [hot patch](#hot-patch-branches-hot-) to understand the steps involved). Once all the developer tests, and automated tests pass across the changed packages these packages will be released as release candidates artifacts, and are available to be deployed. QA and acceptance testing begins.

Once the product owners (and potentially customers) agree the release candidate is acceptable the Project Lead will submit a pull request to [master](#generally-available-branch-master). Once the pull request is merged the GA bitbucket pipeline will be launched (see [master](#generally-available-branch-master) to understand the steps involved). This promotes the release candidate artifacts to GA artifacts, and are available to be deployed.


## Artifacts

Artifacts are built within the Bit Bucket (Hot Patch, Release Candidate or Alpha) pipelines. Once built these artifacts will be released to their respective artifact registries using pre release tags and versioning to identify the level of vetting they have received. 

Artifacts are produced on terminal packages only. We currently have 5 types of terminal packages:

1. NPM Modules
	- pure js libraries used across or outside of mono repos
2. Mobile Apps
	- web application code designed for use on mobile devices
3. Web Applications
	- web application code designed for use on desktop computers
4. Backend Services
	- long running servers developed as docker containers
5. Backend Utilities
	- server side tasks that run to completion as docker containers

These terminal package types are deployed as one of the 3 supported artifact types:

1. Docker Artifacts
	- Backend Services and Utilities
2. ECR Artifacts
	- Backend Services and Utilities
3. NPM Artifacts
	- NPM Modules, and Web Applications
4. S3 Artifacts
	- Mobile Applications
	- Single Page Web Applications

*Note:* the actual mobile applications (IPA, APKs) are outside of this scope but could be considered a 4/5th Artifact type.

## Conventional Commits

Semantic versioning is an absolute requirement in producing quality software, but semantic versioning is prone to human error. This is why Larry uses the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) spec in conjunction with git hooks and lerna to eliminate (or at least greatly reduce) the human error in versioning. In short the commit message of every changeset describes what level of change (major, minor, patch) was performed on a package. 

For more details on how we enforce the commit message feel free to look at the [commit-msg](.git/hooks/commit-msg) hook in this repository.

### Squashing Conventional Commits

All feature branches will be squash merged into release branches. To understand why we will walk through a common scenario:

The developer has a feature branch with 5 changesets (in order: 2 major changes 1 minor change and 2 patch changes). When this feature branch was created the version of the package was 1.0.0. When the developer submits a pull request with these 5 changesets the version of the package would be calculated as 3.1.2 (2 major changes 1 minor change and 2 patch changes). This can be confusing due to the fact that artifacts are never released from Feature branches. So in reality those 5 changes only describe the 5 steps a developer took to move the package from its old version to the "next" version. If instead the developer squashed those 5 changes into one and described the change in conventional commit terms (fix, feat, and BREAKING CHANGE) the version calculated would more accurately describe the change in the artifact from the old version to the "next" version.


## Branching Strategy

The branching strategy in place at Larry draws from well known workflows such as [git flow](https://nvie.com/posts/a-successful-git-branching-model/), however it is slightly tailored to enforce semantic versioning across every change, give the business the ability to decide when and what should be released, and to guarantee each artifact documents the level of testing/vetting its gone through (artifact maturity).

In every branching strategy there are loads of special cases and exceptions which is why this project `scm-cookbook` exists. By investigating this projects change history you will see all the common and special scenarios that can exist and how we at Larry have decided to handle them. 

Here are the branch types:

### Feature Branches (AFD-*)
	- Is a developer branch
		- No associated CI processes
	- A feature branch represents a single release-able change (enhancement, feature, or fix) to the system
	- Each feature branch is associated with a JIRA ticket
		- using the branch naming convention `<WORK_TYPE>/AFD-<JIRA_ISSUE_KEY>-<OPTIONAL_TITLE>`
			- where WORK_TYPE can be
				- bugs
				- changes
	- A feature branch can have multiple commits 
		- all of which MUST adhere to the [conventional commits](#conventional-commits) spec
	- Work in progress commits are allowed on Feature Branches *ONLY* 
		- these *WILL* be [squashed](https://medium.com/@slamflipstrom/a-beginners-guide-to-squashing-commits-with-git-rebase-8185cf6e62ec) your pull request is merged by one of the code owners

### Integration Branches (int-*)
	- Is a developer branch
		- No associated CI processes
	- Integration Branches are used to group multiple features together for the purpose of developer integration testing prior to releasing any artifacts

### Alpha Branches (alpha-*)
	- Is a release branch
	- Alpha branches are locked down meaning nobody has direct commit access
		- Code owners have PR merge access
	- All changesets are added via pull request 
		- which must be reviewed by at least one other lead or code owner(s)
		- pull requests can come from any branch
		- all feature branches will be squash merged
	- Continuous Integration will be executed on all changesets
	- Alpha BitBucket Pipeline
		- lint
		- build
		- developer tests
		- package
		- release using the branch name (alpha-<some-name>) as the pre-release portion of the version
	- Continuous Deployment enabled to push the latest pre-release version to a dedicated alpha environment (where the name of the environment is the same as the branch name)
		- as of Winter 2021 this is not yet supported
	- Alpha branches encompass the Engineering Automated/Manual Tests, QA (break fix), and performance/load/scale testing phases

### Beta Branches (beta-*)
	- Is a release branch
	- Beta branches are locked down meaning nobody has direct commit access
		- Code owners have PR merge access
	- All changesets are added via pull request 
		- which must be reviewed by at least one other lead or code owner(s)
		- pull requests can come from any branch
		- all feature branches will be squash merged
	- Continuous Integration will be executed on all changesets
	- Beta BitBucket Pipeline
		- Promoting an artifact
				- re-releases artifact(s) using the branch name (beta-<some-name>) as the pre-release portion of the version
			- Building a package
				- lint
				- build
				- developer tests
				- package
				- release using the branch name (beta-<some-name>) as the pre-release portion of the version
	- Deployment is a planned and signed off effort involving the Project lead and Product owners
	- Beta branches encompass the QA (break fix), performance/load/scale testing, and User Acceptance Testing phases

### Release Candidate Branches (rc-*)
	- Is a release branch
	- Release Candidate branches are locked down meaning nobody has direct commit access
		- Code owners have PR merge access
	- All changesets are added via pull request 
		- which must be reviewed by the code owner(s) and product owner(s)
		- pull requests can only come from alpha branches or feature branches
		- all feature branches will be squash merged
	- Continuous Integration will be executed on all changesets
	- Release Candidate BitBucket Pipeline
		- Will determine if its promoting an artifact or building a package
			- Promoting an artifact
				- re-releases artifact(s) using the branch name (rc-<some-name>) as the pre-release portion of the version
			- Building a package
				- lint
				- build
				- developer test
				- package
				- integration test
				- smoke test
				- regression test
				- release using the branch name (rc-<some-name>) as the pre-release portion of the version
	- Deployment is a planned and signed off effort involving the Project lead and Product owners
	- Release Candidate branches encompass the QA (break fix), performance/load/scale testing, and User Acceptance Testing phases

### Hot patch branches (hot-*)
	- Is a release branch	
	- Is identical to a Release Candidate branch with the below exceptions
		- the intent of a Hot patch branch is to react to a customer outage providing an abbreviated vetting process
		- it skips the full blown alpha, beta, QA, and acceptance testing phases
		- it only requires code reviews via pull request, and the automated testing provided during the Continuous Integration process
	- If time permits additional manual testing such as QA (break fix), performance/load/scale testing, and User Acceptance Testing a normal Release Candidate branch should be used
	- Should ONLY be used in emergency situations
	- Hot Patch BitBucket Pipeline
		- lint
		- build
		- test (developer tests)
		- package
		- integration test
		- smoke test
		- regression test
		- release using the branch name (hot-<some-name>) as the pre-release portion of the version
	- Deployment is a planned and signed off effort involving the Project lead and Product owners
	- Hot Patch branches encompass the QA (break fix), performance/load/scale testing, and User Acceptance Testing phases

### Generally Available Branch (master)
	- The master branch is locked down meaning nobody has direct commit access
	- All changesets are added via pull request 
		- which must be reviewed by the code owner(s) and product owner(s)
		- pull requests can only come from hot patch branches or release candidate branches
	- Continuous Integration will be executed on all changesets
	- GA BitBucket Pipeline
		- promotes rc/hot artifacts to ga artifacts
			- strips the pre release portion of the version
	- Deployment is a planned and signed off effort involving the Project lead and Product owners

---

## Mono Repo Packages and Package Hierarchy

Below you will find the standard Larry package Hierarchy. This hierarchy includes the common components you will find across Larry development projects. This is not an exhaustive list of every component you will come across here at Larry. 

As technologies come and go Larry is committed to evolving the existing applications to stay in sync with the latest company wide Standards, when this happens this document will be updated.

The goals behind this package Hierarchy are:

- to organize related packages to imply the related dependencies (Generally speaking... exceptions may be allowed)
	- dependencies are allowed on ancestors in the package hierarchy tree (e.g.: frontend/web/apps can depend on frontend/common)
	- dependencies are allowed with siblings in the package hierarchy tree (e.g.: frontend/mobile/cordova/apps can depend on frontend/mobile/cordova/plugins)
	- anything outside of these rules should be carefully reviewed, and mostly frowned upon
- to allow flexibility for logical groupings
	- such as shared components for Vue/React and other view libraries, or angular directives, etc.
- to provide normalcy for developers across projects 
	- this will eliminate the need to explain/re-explain each time someone enters a new codebase

Larry's Standard Package Hierarchy looks like:

- `packages/frontend/**`
	- All gui application code, including mobile, web, desktop, etc...
	- `packages/frontend/common/*`
		- common ui widgets or libraries that are shared across mobile, web and desktop applications.
	- `packages/frontend/webpack-plugins/*`
		- Custom in house built [webpack](https://webpack.js.org/) plugins.

	- `packages/frontend/web/**`	
		- All gui application code intended to run on web
		- `packages/frontend/web/apps/*` or `packages/frontend/web/app` in the case there is only one
			- single page web application(s) that have been designed for use on desktop computers. This includes all build/packaging (webpack) components.
	
	- `packages/frontend/mobile/**`	
		- All gui application code intended to run on mobile
		- `packages/frontend/mobile/cordova/apps/*` or `packages/frontend/mobile/cordova/app` in the case there is only one
			- cordova based mobile applications
		- `packages/frontend/mobile/cordova/plugins/*`
			- Custom in house built [cordova](https://cordova.apache.org/) plugins.
		- `packages/frontend/mobile/web-views/*`
			- single page web applications that have been designed for use on mobile devices.
  
- `packages/sdk/**`
	- Software Development Kit libraries and supporting code. Intended to be runtime environment agnostic but may have browser or node specific details. 

- `packages/libs/*`
	- common node libraries, which can be used in any environment (mobile, browser, node, etc...)

- `packages/backend/**`
	- All middleware/server side application code, including services, workers, libs, etc...
	- `packages/backend/services/*`
		- Anything that serves. These are docker container artifacts that adhere to the [twelve-factor](https://12factor.net/) principles.
	- `packages/backend/utilities/*`
		- Anything that performs a task(s) without being a permanent server. These are docker container artifacts that also follow the twelve-factor app principles, see [12factor admin-processes](https://12factor.net/admin-processes) for more information.
	- `packages/backend/libs/*`
		- Common javascript utilities and helper libraries. These may imply specific infrastructure constraints like network access to databases, but generally speaking these should be common node modules unless clearly stated.

- `packages/infrastructure/**`
	- `packages/infrastructure/cloud-formation`
		- A products AWS cloud formation templates organized in the `@monstermakes/larry-environment` folder hierarchy, for example `products/velocicast/network/vpc.yml`.

- `packages/noops/**`
	- Devops tools, clis, libraries, etc... 

---

# How to use this Project

There are 2 ways to take advantage of this project the first is to read the README and to investigate the git history to learn/understand the common development workflows. The other is tailored for those that like to learn by doing. For those of you take a look at the details in [Simulations and scripts](#simulations-and-scripts), and refer back to this README to fill in the big picture concepts.

## Developer Setup

There is no setup required for this project. You can launch any of the [Simulations and scripts](#simulations-and-scripts) directly from your terminal, and inspect the git log to understand whats going on. 

Requirements: Tested on MAC using bash shell.
	
## Simulations and scripts

A set of bash scripts designed simulate the different scenarios that you will see developing code at Larry have been included in this project. 

### Simulation Scripts

- Project Administration
	- Reset Project
		- Running this script will delete all the local git history so you can exercise your own scenarios.
		- script => `scripts/project_administration/reset_project.sh`
	- Initialize Project
		- Running this script will initialize the project with a standard set of packages, and dependencies.
		- script => `scripts/project_administration/initialize_project.sh`

- Simulations
	- Tips:
		- If you want to investigate exactly whats happening in these simulations, first reset your project (reset_project.sh).
	- Simulate the "Normal Bug or Enhancement workflow"
		- Initializes the project with a standard set of packages, dependencies, and history to show case the "Normal Bug or Enhancement workflow".
		- script => `scripts/simulations/initialize_normal_flow.sh`
	- Simulate the "Time constrained Bug or Enhancement workflow"
		- Initializes the project with a standard set of packages, dependencies, and history to show case the "Time constrained Bug or Enhancement workflow".
		- script => `scripts/simulations/initialize_constrained_flow.sh`
	- Simulate the "EMERGENCY Hot Patch workflow"
		- Initializes the project with a standard set of packages, dependencies, and history to show case the "EMERGENCY Hot Patch workflow"
		- script => `scripts/simulations/initialize_hot_flow.sh`

- Utilities
	- These scripts are intended to be used by the simulation scripts but can be launched directly
	- Create A Package
		- Running this script creates a minimal package for use in the rest of these simulations.
		- The created package will include a changes.txt file in the package root which includes a sequential list of the changes made to that package.
		- script => `scripts/simulations/utils/create_a_package.sh`
	- Change A Package
		- Running this script will append the type of change the package's changes.txt file
			- *note*: use the full package name e.g.;@monstermakes/my-package
		- script => `scripts/simulations/utils/change_a_package.sh`
	- Simulate Feature Work
		- Creates a feature branch off of master, creates multiple changesets (appending to changes.txt file)
		- To see the command line usage run `./scripts/simulations/utils/simulate_feature_work.sh --help`
		- script => `scripts/simulations/utils/simulate_feature_work.sh`
	- Simulate PR of Feature work
		- To see the command line usage run `./scripts/simulations/utils/simulate_feature_pr.sh --help`
		- script => `scripts/simulations/utils/simulate_feature_pr.sh`


*Note* This project will not allow anyone to push to the central repo so feel free to go crazy you wont break anything.

## Mono repo common tasks

The following sections will provide some help with common tasks you will perform in the mono repos.

### Creating a New Package

To create a new package we will use Lerna's [create](https://github.com/lerna/lerna/blob/master/commands/create#readme) command. From the root of the project run `npx lerna add <@monstermakes/package-dep-name> --scope=<@monstermakes/package-name> `. Note `package-loc` is the Package Hierarchy described above.

Try it out and watch it create a traditional node package just in a sub directory...

### Adding a local package as a dependency

To add a local package as a dependency to another local package we will use Lerna's [add](https://github.com/lerna/lerna/blob/master/commands/add#readme) command. From the root of the project run `npx lerna add <@monstermakes/package-dep-name> --scope=<@monstermakes/package-name>`. Note you can optionally pass the `--dev` if you'd like to make this a dev-dependency. 

Try it out and then look at the changes made to the package.json file in the `<@monstermakes/package-name>` package. It just plain old node dependency stuff...

---

# Helpful Resources
Here is a list of material for those that want to dig deeper:

- [Lerna](https://lerna.js.org/)
- Node installation
	- NVM: `https://github.com/nvm-sh/nvm`
	- N: `https://github.com/tj/n`