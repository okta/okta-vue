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

// Imported from the module rather than the barrel: it is `@internal` and deliberately not part of the
// subpath's public API.
import { toRelativeUri } from '../../../src/client-js/toRelativeUri'

describe('toRelativeUri', () => {
  it('keeps a same-origin path, query and hash', () => {
    expect(toRelativeUri('/protected?tab=profile#top')).toBe('/protected?tab=profile#top')
  })

  it('reduces a same-origin absolute URL to its path', () => {
    expect(toRelativeUri(`${window.location.origin}/protected?tab=profile`)).toBe('/protected?tab=profile')
  })

  // The value comes out of `resumeFlow()`'s untyped `Record<string, any>` meta, so it is attacker-
  // influenceable if the flow's stored state ever is. An off-origin value must never reach the router.
  it.each([
    ['a cross-origin URL', 'https://evil.example.com/steal'],
    ['a protocol-relative URL', '//evil.example.com/steal'],
    ['a javascript: URL', 'javascript:alert(document.cookie)'], // eslint-disable-line no-script-url
    ['a data: URL', 'data:text/html,<script>alert(1)</script>']
  ])('falls back for %s', (_label, uri) => {
    expect(toRelativeUri(uri)).toBe('/')
  })

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty string', ''],
    ['a number', 42],
    ['an object', { pathname: '/protected' }]
  ])('falls back for %s', (_label, uri) => {
    expect(toRelativeUri(uri)).toBe('/')
  })

  it('honours a caller-supplied fallback', () => {
    expect(toRelativeUri(undefined, '/home')).toBe('/home')
    expect(toRelativeUri('https://evil.example.com', '/home')).toBe('/home')
  })
})
