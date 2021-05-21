# @monstermakes/larry-bnd (BND)

[![npm version](https://badge.fury.io/js/%40monstermakes%2Flarry-bnd.svg)](https://badge.fury.io/js/%40monstermakes%2Flarry-bnd)

[![https://nodei.co/npm/@monstermakes/larry-bnd.png?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/@monstermakes/larry-bnd.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/@monstermakes/larry-bnd)


## Description

More accurate called "Build, release, and deploy" this package aims to provide an opinionated way to build, release and deploy mono repo based products and libraries. 

It provides a cookbook to help train developers on these opinons and provide BND developers with a playground to explore ideas and develop changes to BND itself.

It provides a set of scm tools to help code owners enforce the rules and make sure things stay tidy.

It provides build tooling for both products and libraries where the pipelines are fixed but the implemenation is provided by the products and library packages themselves.

It provides deployment tooling for products to describe how they must be deployed, this includes release notes generation, deployment communication, rollback, and verification/smoke test.

## Work scratchpad/goals/ideas

- scm-cookbook
    - need tooling to work through scenarios
        - for development and training purposes
    - scenarios
        - normal flow
        - constrained flow
        - hot flow
- 2 use cases
    - products
        - version maturing and deployment
            - alpha, beta, rc, staging, hot, ga
    - libraries
        - may include pre-release details (non-master branch) but 
            - no strict meaning behind the pre-release name or branch name
            - no depoyment
- scm tooling
    - manage PRs
        - help keep a consistent format for merging feature branches
            - must indicate work number either via (or both???)
                - branch naming convention
                - pulled from the `references` portion of the conventional commit
    - Incorporate finished work with ongoing work
        - in cases like hotpatch scenarios would be nice to have a tool that merges this back out to ongoing work.
- CI includes
    - build and release phases
        - build
            - steps required before executing developer tests
        - developer test
            - this is a per package test suite
        - package
            - this is where the actual artifacts are produced
        - Integration test???
            - this would be a mono repo wide test suite
        - release
            - this is where artifacts are actually published
    - Actions within a phase are specified by
        1. hook scripts
            - specific package
            - or package hierarchy
        2. standard package types
            - based on package hierarchy
            - These will execute npm scripts
        3. Default npm scripts
            - npm test
            - npm publish
    - support multiple Branching Strategies
        - Supported Types
            - feature
                - https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow
                - branch types
                    - Feature branches
                        - build
                        - developer test
                        - package*
                        - release* 
                            - pre release (based on branch name)
                    - master / release branch
                        - build 
                        - developer test
                        - package
                        - release
            - gitflow
                - https://nvie.com/posts/a-successful-git-branching-model/
                - branch types
                    - master
                        - product version tracking
                    - develop branch
                        - long runnning branch to incorporate development efforts
                        - This is basically a never ending integration branch
                    - Feature branches
                        - houses developer work (topic based)
                        - comes out of development and back into devlopment
                    - Release Branches
                    - Hotfix Branches
            - product
                - See SCM Cookbook
        - Different Actions
    - Should CLEARLY display 
        - what packages have changed
            - including before and after versions
            - semver change (Major, Minor Patch)
        - Versions of other packages that have NOT changed
    - squash and promote pipeline
        - the specifics here need to be worked through
            - there has been a lot of push back on the squashing changes
                - conflicting changes can disapear
                - work that never makes it also disapears (WIP)
        - remove pre-release artifacts from central repo
        - Deal with [skip ci] on promotion
        - Promote previously released artifacts
            - need to detect all changes since the branch diverged not just the changes on the tip of the source branch
- Deployment
    - TODO
    - release notes generation
    - deployment notifications
    - rollback
    - automated verification/smoke test
    - need to identify a standard deployment pipeline
        - bash based??? see deployment.sh
        - node based??? see larry-environment
    - Present the deployer with a confirmation of environment and artifact versions before any changes are made. 
        -  We have a few times almost screwed up and deployed to the wrong env, this would be a helpful preventer.
- Product Version Management
    - When we are building a product version we always need a notes type of section for things like rollout plan or additional release notes etc...
        - Where could this live?
## JIRA components /  Build Artifacts (Terminal Packages) / Release notes "What Components Changed"
- would be nice to have jira components correlate to the produced artifacts
- would be nice to tie jira components to code / technology owners
- would be nice to communicate the changes in a version in terms of these components/artifacts
## JIRA Webhooks
### pr-merged
https://automation.atlassian.com/pro/hooks/8d76c6f30c3a785d60d205cbdbd2b0534fd63628
```
{
    "pullrequest": {
        "source": {
            "branch": {
                "name": "AFD-2164"
            }
        },
        "destination": {
            "branch": {
                "namex": "int-super-dope-sauce",
                "namex": "super-dope-sauce",
                "name": "1.0.0-alpha.0"
            }
        }
    }
}
```
### build-status
- build started
- build failed 
    - what package
    - what phase
    - what commit
- build completed
    - what changed
    - what are the current versions of everything
### deployed-to
https://automation.atlassian.com/pro/hooks/49da906af1de911547f7695cfdb04143a4e83317
```
"versionDetails": {
        "productVersion": "12.4.0-beta.0",
        "fixVersion": "12.4.0"
    },
    "environmentDetails": {
        "environmentNameX": "alpha",
        "environmentName": "beta",
        "environmentNameX": "rc",
        "environmentNameX": "staging",
        "environmentNameX": "production"
    },
    "deploymentDetails": {
        "releaseNotes": "{code}\n#Markdown goes here!{code}\n"
    }
}
```


## TODO & NOTEs & thoughts
- file names
    - bnd-history.json
    - bnd-manifest.json

- Tag locally to set the last released changeset
    - this way we dont pollute the repo with tags
    - sha in the bnd should suffice

- Would this even make sense outside of a mono repo?


