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

 import Auth from './Auth'

function install (Vue, options) {
  const auth = new Auth(options)
  
  // add extra options to auth.options
  auth.options.onAuthRequired = options.onAuthRequired
  auth.options.onPostLoginRedirect = options.onPostLoginRedirect

  // add oktaAuth instance to Vue
  Vue.prototype.$auth = auth
}

export default { install }
export { default as ImplicitCallback } from './components/ImplicitCallback'
export { default as Security } from './components/Security'
