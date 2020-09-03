#!/bin/bash

####################################################################################################################################################
# Setup the package versions based on conventional commits
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

yarn lerna version --no-push -m "rc release in progress..." --yes
# store off the current tags
CURRENT_TAGS=$(git tag -l --contains HEAD)
# delete all tags on current HEAD
git tag -d $(git tag -l --contains HEAD)
# mixed reset to the previous changeset (a.k.a pull it into the working directory)
git reset --soft HEAD~1
# ammend the previous commit
git commit -m "ci(rc-release): release artifacts" --amend
# apply previous tags to commit
echo "$CURRENT_TAGS" | while read line; do 
	git tag "$line" -m "$line";
	git tag "$line-$BRANCH_NAME" -m "$line-$BRANCH_NAME"; 
done

####################################################################################################################################################
# BUILD / TEST / PACKAGE
####################################################################################################################################################

# DO THANGS...

####################################################################################################################################################
# RELEASE
####################################################################################################################################################
# TODO make sure to tag and adjust versions...

# S3 bucket - push to a pre-release bucket
# NPM - publish with pre-release tag to make sure latest is skipped
# ECR - publish with pre-release tag

####################################################################################################################################################
# Finish the Pipeline
####################################################################################################################################################
# git push --follow-tags
