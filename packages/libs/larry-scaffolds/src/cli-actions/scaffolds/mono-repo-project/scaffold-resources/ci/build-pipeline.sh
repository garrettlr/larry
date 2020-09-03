#!/bin/bash

##################################################################################################################################
# REQUIREMENTS:
# To use these build scripts you must have the following packages installed in the root mono-repo
#   - "lerna": "^3.20.2",
#   - "json": "^9.0.6",
#   - "semver": "^7.3.2"
##################################################################################################################################

export BRANCH_NAME=`git rev-parse --abbrev-ref HEAD`
CURRENT_DIR="$(dirname "$0")"

case $BRANCH_NAME in

  master)
    yarn lerna version --no-push -m "ci(release): release artifacts" --yes
    ;;

  alpha-*)
    source $CURRENT_DIR/alpha-build.sh
    ;;

  rc-*)
    source $CURRENT_DIR/rc-build.sh
    ;;
esac
