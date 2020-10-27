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

/* global PACKAGE */
import { OktaAuth } from '@okta/okta-auth-js'

// Constants are defined in webpack.config.js
const packageInfo = PACKAGE

export default class Auth extends OktaAuth {
  constructor (config) {
    super(config)

    // Customize user agent
    this.userAgent = `${packageInfo.name}/${packageInfo.version} ${this.userAgent}`
  }

  authRedirectGuard () {
    return async (to, _, next) => {
      const isAuthenticated = await this.isAuthenticated()
      if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
        await this._handleLogin(to.fullPath)
      } else {
        next()
      }
    }
  }

  async _handleLogin (fromUri) {
    this.setFromUri(fromUri);
    if (this.options.onAuthRequired) {
      await this.options.onAuthRequired();
    } else {
      await this.signInWithRedirect();
    }
  }
}
