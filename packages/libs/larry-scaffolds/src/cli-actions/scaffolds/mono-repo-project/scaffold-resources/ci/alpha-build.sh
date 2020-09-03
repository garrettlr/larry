#!/bin/bash

####################################################################################################################################################
# Setup the package versions based on conventional commits and use current branch as the pre-release name
####################################################################################################################################################
# capture what packages have changed since the last release
WHATS_CHANGED_ORIG=`yarn --silent lerna changed --ndjson --loglevel silent | sed 's/"version"/"origVersion"/g'`

# Always use pure semver... if one of the changed has a semver blow up
if [[ -e "WHATS_CHANGED_ORIG" ]]; then
	echo -e "$WHATS_CHANGED_ORIG" |
	while read -r line; do 
		name=`echo "$line" | yarn --silent json name`
		ver=`echo "$line" | yarn --silent json origVersion`
		isPrerelease=`node -e "console.log(require('semver').prerelease('$ver') ? 1 : 0)"`
		if [ $isPrerelease -ne 0 ]; then
			echo "$name cannot have a prerelease version ($ver), change it and try again."
			exit 125;
		fi
	done
fi

# Setup the build with the proper pre-release versions
yarn lerna version --no-push --preid $BRANCH_NAME --conventional-prerelease -m "ci(alpha-release): release artifacts" --yes

# store off the current tags to be used later when finalizing the build
CURRENT_TAGS=$(git tag -l --contains HEAD)

CURRENT_COMMIT_MESSAGE=$(git log -1 --pretty=%B)

####################################################################################################################################################
# BUILD / TEST / PACKAGE / RELEASE
####################################################################################################################################################

# DO THANGS...

####################################################################################################################################################
# Finish the Pipeline
####################################################################################################################################################
# delete all tags on current HEAD
git tag -d $(git tag -l --contains HEAD)

# mixed reset to the previous changeset (a.k.a pull it into the working directory)
git reset --mixed HEAD~1

# discard package.json changes
git checkout */package.json

# stash CHANGELOG.md changes
git stash

# set "PURE" version changes
yarn lerna version --no-push -m "alpha release in progress..." --yes

# delete all tags on current HEAD
git tag -d $(git tag -l --contains HEAD)

# mixed reset to the previous changeset (a.k.a pull it into the working directory)
git reset --mixed HEAD~1

# discard package.json changes
git checkout */CHANGELOG.md

# apply the stash directly to staged
git stash pop

# ammend the previous commit
git commit -a -m "$CURRENT_COMMIT_MESSAGE" --amend

# apply previous tags to commit
echo "$CURRENT_TAGS" | while read line; do git tag "$line" -m "$line"; done

#PACKAGE_JSON_FILES=$(git log -1 --name-only --oneline | grep package.json)
#CHANGELOG_FILES=$(git log -1 --name-only --oneline | grep CHANGELOG.md)

# capture what packages have changed since the last release
# WHATS_CHANGED_AFTER=`yarn --silent lerna changed --ndjson --loglevel silent | sed 's/"version"/"newVersion"/g'`
# export WHATS_CHANGED_JSON=`printf "$WHATS_CHANGED_ORIG\n$WHATS_CHANGED_AFTER"| yarn --silent json --deep-merge`
# echo $WHATS_CHANGED_JSON >> PACKAGES_CHANGED.json

# undo the above lerna version commit but keep the associated tags with below added changes
# TODO
# git add "PACKAGES_CHANGED.json"
# git commit --amend -m "ci(release): releasing artifacts"

#Increment the version without the pre-release
# yarn lerna version --no-push --no-git-tag-version --conventional-graduate --yes
# git push --follow-tags
