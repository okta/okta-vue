#!/bin/bash -x

source ${OKTA_HOME}/${REPO}/scripts/setup.sh

if [ ! -z "$AUTHJS_VERSION" ]; then
  echo "Skipping e2e tests against auth-js v6.x"
  exit ${SUCCESS}
fi

setup_service java 1.8.222
setup_service google-chrome-stable 106.0.5249.61-1

export TEST_SUITE_TYPE="junit"
export TEST_RESULT_FILE_DIR="${REPO}/test-reports/e2e"

export CI=true
export ISSUER=https://samples-javascript.okta.com/oauth2/default
export SPA_CLIENT_ID=0oapmwm72082GXal14x6
export USERNAME=george@acme.com
get_terminus_secret "/" PASSWORD PASSWORD

if ! yarn add -DW --ignore-scripts @okta/okta-auth-js@^6; then
  echo "auth-js v6.x could not be installed"
  exit ${FAILED_SETUP}
fi

if ! yarn test:e2e; then
  echo "e2e tests failed! Exiting..."
  exit ${TEST_FAILURE}
fi

echo ${TEST_SUITE_TYPE} > ${TEST_SUITE_TYPE_FILE}
echo ${TEST_RESULT_FILE_DIR} > ${TEST_RESULT_FILE_DIR_FILE}
exit ${PUBLISH_TYPE_AND_RESULT_DIR}
