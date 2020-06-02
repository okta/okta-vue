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

/* eslint-disable no-new */
import Auth from '../../src/Auth'
import AuthJS from '@okta/okta-auth-js'

jest.mock('@okta/okta-auth-js')

describe('Auth configuration', () => {
  beforeEach(() => {
    AuthJS.mockImplementation(() => {
      return {
        tokenManager: {
          on: jest.fn()
        }
      }
    })
  })

  it('does not throw if config is valid', () => {
    const validConfig = {
      issuer: 'https://foo',
      clientId: 'foo',
      redirectUri: 'foo'
    }
    function createInstance () {
      new Auth(validConfig)
    }
    expect(createInstance).not.toThrow()
  })

  it('will pass tokenManager config', () => {
    const validConfig = {
      issuer: 'https://foo',
      clientId: 'foo',
      redirectUri: 'foo',
      responseType: ['id_token', 'token'],
      scopes: ['openid'],
      tokenManager: {
        secure: true,
        storage: 'cookie'
      },
      onSessionExpired: () => {}
    }
    new Auth(validConfig)
    expect(AuthJS).toHaveBeenCalledWith(validConfig)
  })

  it('should throw if no issuer is provided', () => {
    function createInstance () {
      new Auth({})
    }
    expect(createInstance).toThrow()
  })
  it('should throw if an issuer that does not contain https is provided', () => {
    function createInstance () {
      new Auth({
        issuer: 'http://foo.com'
      })
    }
    expect(createInstance).toThrow()
  })
  it('should throw if an issuer matching {yourOktaDomain} is provided', () => {
    function createInstance () {
      new Auth({
        issuer: 'https://{yourOktaDomain}'
      })
    }
    expect(createInstance).toThrow()
  })
  it('should throw if an issuer matching -admin.okta.com is provided', () => {
    function createInstance () {
      new Auth({
        issuer: 'https://foo-admin.okta.com'
      })
    }
    expect(createInstance).toThrow()
  })
  it('should throw if an issuer matching -admin.oktapreview.com is provided', () => {
    function createInstance () {
      new Auth({
        issuer: 'https://foo-admin.oktapreview.com'
      })
    }
    expect(createInstance).toThrow()
  })
  it('should throw if an issuer matching -admin.okta-emea.com is provided', () => {
    function createInstance () {
      new Auth({
        issuer: 'https://foo-admin.okta-emea.com'
      })
    }
    expect(createInstance).toThrow()
  })
  it('should throw if an issuer matching more than one ".com" is provided', () => {
    function createInstance () {
      new Auth({
        issuer: 'https://foo.okta.com.com'
      })
    }
    expect(createInstance).toThrow()
  })
  it('should throw if an issuer matching more than one sequential "://" is provided', () => {
    function createInstance () {
      new Auth({
        issuer: 'https://://foo.okta.com'
      })
    }
    expect(createInstance).toThrow()
  })
  it('should throw if an issuer matching more than one "://" is provided', () => {
    function createInstance () {
      new Auth({
        issuer: 'https://foo.okta://.com'
      })
    }
    expect(createInstance).toThrow()
  })
  it('should throw if the client_id is not provided', () => {
    function createInstance () {
      new Auth({
        issuer: 'https://foo'
      })
    }
    expect(createInstance).toThrow()
  })
  it('should throw if a client_id matching {clientId} is provided', () => {
    function createInstance () {
      new Auth({
        client_id: '{clientId}',
        issuer: 'https://foo'
      })
    }
    expect(createInstance).toThrow()
  })
  it('should throw if the redirect_uri is not provided', () => {
    function createInstance () {
      new Auth({
        issuer: 'https://foo/oauth2/default',
        client_id: 'foo'
      })
    }
    expect(createInstance).toThrow()
  })

  it('should throw if a redirect_uri matching {redirectUri} is provided', () => {
    function createInstance () {
      new Auth({
        issuer: 'https://foo/oauth2/default',
        client_id: 'foo',
        redirect_uri: '{redirectUri}'
      })
    }
    expect(createInstance).toThrow()
  })
})
