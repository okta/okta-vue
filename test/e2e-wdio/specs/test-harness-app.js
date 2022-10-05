/*!
 * Copyright (c) 2017-Present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations under the License.
 */

import {
  HomePage,
  ProtectedPage,
  SessionTokenPage
} from '../page-objects/test-harness-app';

import OktaSignInPageV1 from '../page-objects/okta-signin-page';
import OktaSignInPageOIE from '../page-objects/okta-oie-signin-page';

let OktaSignInPage = OktaSignInPageV1;
if (process.env.ORG_OIE_ENABLED) {
  OktaSignInPage = OktaSignInPageOIE;
}

const { USERNAME, PASSWORD } = process.env;

describe('Vue + Okta App', () => {
  describe('Redirect Flow', () => {
    
    it('redirects to Okta for login when trying to access a protected page', async () => {
      await ProtectedPage.open();

      await OktaSignInPage.waitForPageLoad();
      await OktaSignInPage.login(USERNAME, PASSWORD);

      await ProtectedPage.waitForPageLoad();
      expect(await ProtectedPage.logoutButton.isExisting()).toBeTruthy();

      await ProtectedPage.userInfo.waitForDisplayed();
      const userInfo = await ProtectedPage.userInfo.getText();
      expect(userInfo).toContain('email');

      await ProtectedPage.logoutButton.click();
      await HomePage.waitForLogout();
    });

    it('redirects to Okta for login', async () => {
      await HomePage.open();
  
      await HomePage.waitForPageLoad();
      await HomePage.loginButton.click();
  
      await OktaSignInPage.waitForPageLoad();
      await OktaSignInPage.login(USERNAME, PASSWORD);
  
      await HomePage.logoutButton.waitForDisplayed({timeout: 20000});
      expect(await HomePage.logoutButton.isExisting()).toBeTruthy();
  
      await HomePage.logoutButton.click();
      await HomePage.waitForLogout();
    });

  });

  describe('Session Token Flow', () => {

    it('allows passing sessionToken to skip Okta login', async () => {
      await SessionTokenPage.open();

      await SessionTokenPage.waitForPageLoad();
      await SessionTokenPage.login(USERNAME, PASSWORD);

      await HomePage.logoutButton.waitForDisplayed({timeout: 20000});
      expect(await HomePage.logoutButton.isExisting()).toBeTruthy();

      // Logout
      await HomePage.logoutButton.click();
      await HomePage.waitForLogout();
    });

  });
});