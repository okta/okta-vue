# 5.8.0

### Fixes
[#150](https://github.com/okta/okta-vue/pull/150) Updates global properties type declaraton
  - resolves [#149](https://github.com/okta/okta-vue/pull/149)

# 5.7.0

### Features

- [#139](https://github.com/okta/okta-vue/pull/139)
  - Plugin supports both Options API and Composition API
  - `LoginCallback` component and test app migrated to Composition API

### Fixes

- [#139](https://github.com/okta/okta-vue/pull/139) Fixes `TypeError: 'set' on proxy: trap returned falsish for property 'authState'` when plugin is used in app with Composition API

# 5.6.0

### Fixes

- [#122](https://github.com/okta/okta-vue/pull/122)
  - Fixes types; `onAuthRequired` and `onAuthResume` are now optional
  - dependency updates

# 5.5.0

### Features
- [#110](https://github.com/okta/okta-vue/pull/110) Adds support for `@okta/okta-auth-js` `7.x`
  - bumps minimum node version to `14`

# 5.4.0

### Features

- [#106](https://github.com/okta/okta-vue/pull/106) Adds composable `useAuth()` to access the oktaAuth instance in setup script

# 5.3.0

### Others

- [#96](https://github.com/okta/okta-vue/pull/96)
  - Removes `oktaAuth.stop()` from `OktaVue` module
  - Removes `oktaAuth.start()` from `LoginCallback` component

# 5.2.1

### Others

- [#93](https://github.com/okta/okta-vue/pull/93) Updates vulnerable dependencies

# 5.2.0

### Features

- [#89](https://github.com/okta/okta-vue/pull/89) Supports named slot (`error`) in `LoginCallback` component

# 5.1.1

### Fixes

- [#86](https://github.com/okta/okta-vue/pull/86) Fixes okta-auth-js v6 compatibility issues:
  - allows okta-auth-js v6 in peerDependencies
  - uses available `isInteractionRequiredError` method in `LoginCallback` component

# 5.1.0

### Others

- [#80](https://github.com/okta/okta-vue/pull/80) Set okta-auth-js minimum supported version as 5.3.1, `AuthSdkError` will be thrown if oktaAuth instance cannot meet the version requirement

# 5.0.2

### Bug Fixes

- [77](https://github.com/okta/okta-vue/pull/77) Fix issue with `navigationGuard` by starting `oktaAuth` service after handling login redirect

### Others

- [#77](https://github.com/okta/okta-vue/pull/77) Requires @okta/okta-auth-js ^5.8.0

# 5.0.1

### Bug Fixes

- [70](https://github.com/okta/okta-vue/pull/70) Fix token auto renew by using @okta/okta-auth-js ^5.2.3

# 5.0.0

### Breaking Changes

- [#56](https://github.com/okta/okta-vue/pull/56) Requires [@okta/okta-auth-js 5.x](https://github.com/okta/okta-auth-js/#from-4x-to-5x)
  - Initial `AuthState` is null
  - Removed `isPending` from `AuthState`
  - Default value for `originalUri` is null

### Others

- [#68](https://github.com/okta/okta-vue/pull/68) Upgrades dependencies

# 4.0.1

### Bug Fixes

- [#60](https://github.com/okta/okta-vue/pull/60) Locks the SDK with installed okta-auth-js major version

# 4.0.0

### Features

- [#52](https://github.com/okta/okta-vue/pull/52) Adds `onAuthResume` option

### Breaking Changes

- [#43](https://github.com/okta/okta-vue/pull/43) Support Vue 3 and Vue Router 4. See [MIGRATING](MIGRATING.md) for detailed information.

# 3.1.0

### Features

- [#39](https://github.com/okta/okta-vue/pull/39) Adds support for Typescript

# 3.0.0

### Breaking Changes

- [#27](https://github.com/okta/okta-vue/pull/27) See [MIGRATING](MIGRATING.md) for detailed information.
  - Replaces `Auth` service with instance of [@okta/okta-auth-js](https://github.com/okta/okta-auth-js) for `$auth`, so all configuration options and public methods are available.
  - By default `isAuthenticated` will be true only if **both** accessToken **and** idToken are valid
  - Replaces `Auth.handleCallback` with `LoginCallback` component
  - Changes `@okta/okta-auth-js`, `vue` and `vue-router` as peerDependencies

### Features

- [#27](https://github.com/okta/okta-vue/pull/27)
  - Injects reactive [authState][] property to the Vue components
  - Guards secure routes not only by the `beforeRouteEnter` navigation guard, also by subscribing to [authState.isAuthenticated][authState] change after entering the routes.
- [#31](https://github.com/okta/okta-vue/pull/31) Exposes ES module bundle from package module field

# 2.1.1

### Bug Fixes

- [#21](https://github.com/okta/okta-vue/pull/21) Includes source map in release bundle

# 2.1.0

### Bug Fixes

- [#17](https://github.com/okta/okta-vue/pull/17) Removes default `onSessionExpired` behavior.

### Other

- Updates `@okta/okta-auth-js` to version 3.2.3
- Updates README with more information about `onSessionExpired` and `isAuthenticated` options

# 2.0.0

### Breaking Changes

- Uses/requires `@okta/okta-auth-js 3.x`
  - The `pkce` option now defaults to `true`, using the Authorization Code w/PKCE flow
    - Those using the (previous default) Implicit Flow should pass `pkce: false` to their config
    - See the [@okta/okta-auth-js README regarding PKCE OAuth2 Flow](https://github.com/okta/okta-auth-js#pkce-oauth-20-flow) for PKCE requirements
      - Which include the Application settings in the Okta Admin Dashboard allowing for PKCE
- The previously deprecated `scope` option is now fully unsupported
- The `scopes` option now defaults to `['openid', 'email', 'profile']` instead of the previous `['openid']`
  - This default continues to be overridden by any explicit `scopes` passed in the config

# 1.3.0

### Features

- [#648](https://github.com/okta/okta-oidc-js/pull/648)
  - Adds a default handler for onSessionExpired
  - Adds a new option isAuthenticated which works with onAuthRequired
  - Expose TokenManager
  - Adds documentation for postLogoutRedirectUri

# 1.2.0

### Features

- [`558696`](https://github.com/okta/okta-oidc-js/commit/5586962c137d7ef0788744dbf0c1dc9f7d411ad0) - Upgrades to `@okta/okta-auth-js@2.11` which includes new options for signout: [`3e8c65`](https://github.com/okta/okta-auth-js/commit/3e8c654b99de771549775eb566f9349c86ed89b6)

# 1.1.1

### Features

- [`3e0666d`](https://github.com/okta/okta-oidc-js/commit/3e0666dc279bbe716e3bb236a051be31aad494c7) - Support PKCE authorization flow

### Other

- [`654550`](https://github.com/okta/okta-oidc-js/commit/6545506921cbe6e8f15076e45e908f285a6e2f1e) - All configuration options are now accepted. See [Configuration Reference](https://github.com/okta/okta-auth-js#configuration-reference). Camel-case (clientId) is now the preferred syntax for all Okta OIDC libraries. Underscore syntax (client_id) will be deprecated in a future release.

- [`a2a7b3e`](https://github.com/okta/okta-oidc-js/commit/a2a7b3e695d40e29d473be89e90340fbf5c4c56b) - Configuration property `scope` (string) is deprecated in favor of `scopes` (array). Normalize config format for the properties `responseType` and `scopes`, used in get token flows. Fully support deprecated config properties `request_type` and `scope` as previously documented and used within the okta-vue samples.

# 1.1.0

### Features

- [`2ae1eff`](https://github.com/okta/okta-oidc-js/commit/2ae1effe948c35d112f58f12fbf3b4730e3a24e4) - Adds TokenManager configuration parameters.

# 1.0.7

### Other

- [`2945461`](https://github.com/okta/okta-oidc-js/pull/338/commits/294546166a41173b699579d7d647ba7d5cab0764) - Updates `@okta/configuration-validation` version.

# 1.0.6

### Bug fixes

- [`6242f2d`](https://github.com/okta/okta-oidc-js/pull/332/commits/6242f2d1586aabd80e60b3b237d5b5136bfd95e9) - Fixes an issue where the library was not correctly building the `/dist` output before publishing to `npm`.

# 1.0.5

### Features

- [`d67a596`](https://github.com/okta/okta-oidc-js/pull/320/commits/d67a59619013c2be6a8ade88db21873c833c606f) - Adds configuration validation for `issuer`, `client_id`, and `redirect_uri` when passed into the security component.

### Other

- [`3582f25`](https://github.com/okta/okta-oidc-js/pull/318/commits/3582f259cf74dbb45b6eed673065c2d3c03e9db3) - Rely on shared environment configuration from project root.
- [`c8b7ab5a`](https://github.com/okta/okta-oidc-js/commit/c8b7ab5aacecf5793efb6a626c0a24a78147ded9#diff-b8cfe5f7aa410fb30a335b09346dc4d2) - Migrate dependencies to project root utilizing [yarn workspaces](https://yarnpkg.com/lang/en/docs/workspaces/).

# 1.0.4

### Bug fixes

- [`95c3e62`](https://github.com/okta/okta-oidc-js/commit/dbfb7de3b41e932559ffa70790eeeca1dd30c270) - Fixes an issue where the library would enter an error state when attempting to renew expired tokens (errorCode: `login_required`).

# 1.0.3

### Other

- Updated `jest` to version ^23.6.0.
- Updated package-lock.json.

# 1.0.2

### Other

- Updated `@okta/okta-auth-js` dependency to version 2.
