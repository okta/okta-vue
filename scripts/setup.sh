#!/bin/bash -xe

# Can be used to run a canary build against a beta AuthJS version that has been published to artifactory.
# This is available from the "downstream artifact" menu on any okta-auth-js build in Bacon.
# DO NOT MERGE ANY CHANGES TO THIS LINE!!
export AUTHJS_VERSION="7.0.0-ga57a689"

# Add yarn to the $PATH so npm cli commands do not fail
export PATH="${PATH}:$(yarn global bin)"

# Install required node version
export NVM_DIR="/root/.nvm"
setup_service node v12.13.0

cd ${OKTA_HOME}/${REPO}

# undo permissions change on scripts/publish.sh
git checkout -- scripts

# ensure we're in a branch on the correct sha
git checkout $BRANCH
git reset --hard $SHA

git config --global user.email "oktauploader@okta.com"
git config --global user.name "oktauploader-okta"

#!/bin/bash
YARN_REGISTRY=https://registry.yarnpkg.com
OKTA_REGISTRY=${ARTIFACTORY_URL}/api/npm/npm-okta-master

# Yarn does not utilize the npmrc/yarnrc registry configuration
# if a lockfile is present. This results in `yarn install` problems
# for private registries. Until yarn@2.0.0 is released, this is our current
# workaround.
#
# Related issues:
#  - https://github.com/yarnpkg/yarn/issues/5892
#  - https://github.com/yarnpkg/yarn/issues/3330

# Replace yarn registry with Okta's
echo "Replacing $YARN_REGISTRY with $OKTA_REGISTRY within yarn.lock files..."
sed -i "s#${YARN_REGISTRY}#${OKTA_REGISTRY}#" yarn.lock

# Install dependencies but do not build
if ! yarn install --frozen-lockfile --ignore-scripts; then
  echo "yarn install failed! Exiting..."
  exit ${FAILED_SETUP}
fi

# Revert the original change(s)
echo "Replacing $OKTA_REGISTRY with $YARN_REGISTRY within yarn.lock files..."
sed -i "s#${OKTA_REGISTRY}#${YARN_REGISTRY}#" yarn.lock

# Install a specific version of auth-js, used by downstream artifact builds
if [ ! -z "$AUTHJS_VERSION" ]; then
  echo "Installing AUTHJS_VERSION: ${AUTHJS_VERSION}"
  npm config set strict-ssl false

  AUTHJS_URI=https://artifacts.aue1d.saasure.com/artifactory/npm-topic/@okta/okta-auth-js/-/@okta/okta-auth-js-${AUTHJS_VERSION}.tgz
  if ! yarn add -DW --ignore-scripts ${AUTHJS_URI}; then
    echo "AUTHJS_VERSION could not be installed: ${AUTHJS_VERSION}"
    exit ${FAILED_SETUP}
  fi

  # NOTE: no additional auth-js versions are included in this repo. If this changes ensure the downstream auth-js is used in all test envs/apps
  # Example here: https://github.com/okta/okta-react/blob/58883b02f95aeb21befe61ae60e11e4591c792d6/scripts/setup.sh#L69

  npm config set strict-ssl true
  echo "AUTHJS_VERSION installed: ${AUTHJS_VERSION}"

  # verify single version of auth-js is installed
  # NOTE: okta-signin-widget will install it's own version of auth-js, filtered out
  AUTHJS_INSTALLS=$(find . -type d -path "*/node_modules/@okta/okta-auth-js" -not -path "*/okta-signin-widget/*" | wc -l)
  if [ $AUTHJS_INSTALLS -gt 1 ]
  then
    echo "ADDITIONAL AUTH JS INSTALL DETECTED (check 1)"
    yarn why @okta/okta-auth-js
    exit ${FAILED_SETUP}
  fi

  # parses `yarn why` output to generate an json array of installed versions
  INSTALLED_VERSIONS=$(yarn why --json @okta/okta-auth-js | jq -r -s 'map(select(.type == "info") | select(.data | strings | contains("Found"))) | map(.data[11:-1] | select(contains("okta-signin-widget") | not)) | map(split("@")[-1]) | unique')

  if [ $(echo $INSTALLED_VERSIONS | jq length) -ne 1 ]
  then
    echo "ADDITIONAL AUTH JS INSTALL DETECTED (check 2)"
    yarn why @okta/okta-auth-js
    exit ${FAILED_SETUP}
  fi

  if [ $(echo $INSTALLED_VERSIONS | jq .[0] | tr -d \" ) != $AUTHJS_VERSION ]
  then
    echo "ADDITIONAL AUTH JS INSTALL DETECTED (check 3)"
    yarn why @okta/okta-auth-js
    exit ${FAILED_SETUP}
  fi

fi

# build okta-vue
if ! yarn build; then
  echo "yarn build failed! Exiting..."
  exit ${FAILED_SETUP}
fi
