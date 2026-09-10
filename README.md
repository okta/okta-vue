[Okta Auth SDK]: https://github.com/okta/okta-auth-js
[authState]: https://github.com/okta/okta-auth-js#authstatemanager
[vue-router]: https://router.vuejs.org/en/essentials/getting-started.html
[globalProperties]: https://v3.vuejs.org/api/application-config.html#globalproperties
[Vue Plugin]: https://v3.vuejs.org/guide/plugins.html
[external identity provider]: https://developer.okta.com/docs/concepts/identity-providers/
[Okta Signin Widget]: https://github.com/okta/okta-signin-widget

# Okta Vue SDK

[![npm version](https://img.shields.io/npm/v/@okta/okta-vue.svg?style=flat-square)](https://www.npmjs.com/package/@okta/okta-vue)
[![build status](https://img.shields.io/travis/okta/okta-oidc-js/master.svg?style=flat-square)](https://travis-ci.org/okta/okta-vue)

> Okta Vue version 4+ is for Vue 3 and Vue Router 4. If you are looking for @okta/okta-vue@3.x which supports Vue 2, please checkout the [master branch](https://github.com/okta/okta-vue).

Okta Vue SDK builds on top of the [Okta Auth SDK][]. This SDK integrates with the [vue-router][] and extends the [Vue prototype][] with an [Okta Auth SDK][] instance to help you quickly add authentication and authorization to your Vue single-page web application.

With the [Okta Auth SDK][], you can:

- Login and logout from Okta using the [OAuth 2.0 API](https://developer.okta.com/docs/api/resources/oidc)
- Retrieve user information
- Determine authentication status
- Validate the current user's session

All of these features are supported by this SDK. Additionally, using this SDK, you can:

- Add "protected" routes, which will require authentication before render
- Add an instance of the [Okta Auth SDK][] to Vue app's global instance by attaching them to [globalProperties][].
- Inject reactive [authState][] property to your Vue components

> This SDK does not provide any UI components.

> This SDK does not currently support Server Side Rendering (SSR)

This library currently supports:

- [OAuth 2.0 Implicit Flow](https://tools.ietf.org/html/rfc6749#section-1.3.2)
- [OAuth 2.0 Authorization Code Flow](https://tools.ietf.org/html/rfc6749#section-1.3.1) with [Proof Key for Code Exchange (PKCE)](https://tools.ietf.org/html/rfc7636) 

## Release Status

:heavy_check_mark: The current stable major version series is: `5.x`

| Version   | Status                           |
| -------   | -------------------------------- |
| `5.x`     | :heavy_check_mark: Stable        |
| `4.x`     | :heavy_check_mark: Stable        |
| `3.x`     | :x: Retired                      |
| `2.x`     | :x: Retired                      |
| `1.x`     | :x: Retired                      |

## Getting Started

- If you do not already have a **Developer Edition Account**, you can create one at [https://developer.okta.com/signup/](https://developer.okta.com/signup/).
- An Okta Application, configured for Single-Page App (SPA) mode. This is done from the Okta Developer Console and you can find instructions [here](https://developer.okta.com/authentication-guide/implementing-authentication/implicit#1-setting-up-your-application). When following the wizard, use the default properties. They are are designed to work with our sample applications.

### Helpful Links

- [Vue CLI](https://github.com/vuejs/vue-cli)
  - If you don't have a Vue app, or are new to Vue, please start with this guide. It will walk you through the creation of a Vue app, creating [routers](https://router.vuejs.org/en/essentials/getting-started.html), and other application development essentials.
- [Okta Sample Application](https://github.com/okta/samples-js-vue)
  - A fully functional sample application.
- [Okta Guide: Sign users into your single-page application](https://developer.okta.com/docs/guides/sign-into-spa/vue/before-you-begin/)
  - Step-by-step guide to integrating an existing Vue application with Okta login.
- [Strategies for Obtaining Tokens](https://github.com/okta/okta-auth-js#strategies-for-obtaining-tokens)
  - Okta Vue SDK supports `hash` and `history` router modes. For more details For more details, see [Strategies for Obtaining Tokens](https://github.com/okta/okta-auth-js#strategies-for-obtaining-tokens)

## Installation

This library is available through [npm](https://www.npmjs.com/package/@okta/okta-vue). To install it, simply add it to your project:

```bash
npm install --save @okta/okta-vue
```

### Configuration

You will need the values from the OIDC client that you created in the previous step to instantiate the middleware. You will also need to know your Okta Org URL, which you can see on the home page of the Okta Developer console.

In your application's [vue-router][] configuration, import the `@okta/okta-vue` plugin and pass it your OpenID Connect client information:

```typescript
// main.ts

import { createApp } from 'vue'
import { OktaAuth } from '@okta/okta-auth-js'
import OktaVue from '@okta/okta-vue'

const oktaAuth = new OktaAuth({
  issuer: 'https://{yourOktaDomain}/oauth2/default',
  clientId: '{clientId}',
  redirectUri: window.location.origin + '/login/callback',
  scopes: ['openid', 'profile', 'email']
})

const app = createApp(App)
app.use(OktaVue, { oktaAuth })
app.mount('#app')

```

### Use the LoginCallback Component

In order to handle the redirect back from Okta, your app will need to read the values returned from Okta and exchange them for tokens. This SDK provides a [LoginCallback](#logincallback) component which calls [$auth.handleLoginRedirect](https://github.com/okta/okta-auth-js#handleloginredirecttokens) to perform this logic. If an error occurs, it will be displayed by the [LoginCallback](#logincallback) component, [named slot](https://vuejs.org/guide/components/slots.html#named-slots) (`error`) can be provided to customize the error rendering logic. For custom behavior, the [LoginCallback component file](https://github.com/okta/okta-vue/blob/master/src/components/LoginCallback.vue) can be copied to your own source tree and modified as needed.

**Note:** Make sure you have the login redirect URI (as an absolute URL) listed in your Okta App's configuration in the Okta Admin console.

```typescript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { LoginCallback } from '@okta/okta-vue'

const router = createRouter({
  ...
  history: createWebHistory(process.env.BASE_URL),
  routes: [
    { path: '/login/callback', component: LoginCallback },
    ...
  ]
})
```

### Add a Protected Route

Route is protected when the `requiresAuth` metadata is added in the configuration, which allows access only if [authState.isAuthenticated][authState] is true. By default, [authState.isAuthenticated][authState] is true if **both** `accessToken` **and** `idToken` are valid, but this behavior can be customized by defining a custom [isAuthenticated](#isauthenticated) function.

```typescript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { navigationGuard } from '@okta/okta-vue'
import Protected from '../components/Protected'

const router = createRouter({
  ...
  history: createWebHistory(process.env.BASE_URL),
  routes: [
    {
      path: '/protected',
      component: Protected,
      meta: {
        requiresAuth: true
      }
    }
    ...
  ]
})

// Due to navigation guards mixin issue in vue-router-next, navigation guard logic need to be added manually
router.beforeEach(navigationGuard)
```

> Note: Vue router navigation guards mixin issue is mentioned [here](https://next.router.vuejs.org/guide/migration/index.html#navigation-guards-in-mixins-are-ignored).
> GitHub issue is tracked [here](https://github.com/vuejs/vue-router-next/issues/454)


If a user does not have a valid session, then a new authorization flow will begin. By default, they will be redirected to the Okta Login Page for authentication. Once authenticated, they will be redirected back to your application's protected page. This logic can be customized by setting an [onAuthRequired](#onauthrequired) function on the config object.

### Show Login and Logout Buttons

In the relevant location in your application, you will want to provide `Login` and `Logout` buttons for the user. You can show/hide the correct button by using the injected reactive [authState][] property. 

Example for Options API:
```typescript
// src/App.vue

<template>
  <div id="app">
    <router-link to="/" tag="button" id='home-button'> Home </router-link>
    <button v-if='authState && authState.isAuthenticated' v-on:click='logout' id='logout-button'> Logout </button>
    <button v-else v-on:click='login' id='login-button'> Login </button>
    <router-view/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'app',
  methods: {
    async login () {
      await this.$auth.signInWithRedirect()
    },
    async logout () {
      await this.$auth.signOut()
    }
  }
})
</script>
```

If you are using Composition API, you can access the OktaAuth instance with `useAuth()` composable.
```typescript
// src/App.vue

<template>
  <div id="app">
    <router-link to="/" tag="button" id='home-button'> Home </router-link>
    <button v-if='authState && authState.isAuthenticated' v-on:click='logout' id='logout-button'> Logout </button>
    <button v-else v-on:click='login' id='login-button'> Login </button>
    <router-view/>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '@okta/okta-vue';

const $auth = useAuth();

const login = async () => {
  await auth.signInWithRedirect()
}

const logout = async () => {
  await auth.signOut()
}
</script>
```

If you have disabled Options API (use [`__VUE_OPTIONS_API__: false`](https://github.com/vuejs/core/blob/main/packages/vue/README.md#bundler-build-feature-flags)), you need to inject `okta.authState` and expose property named `authState` in setup in order to use `authState` in template:

```typescript
<script setup lang="ts">
import { ShallowRef, inject } from 'vue';
import { AuthState } from '@okta/okta-auth-js';
const authState = inject<ShallowRef<AuthState>>('okta.authState')
</script>
```

### Use the Access Token

When your users are authenticated, your Vue application has an access token that was issued by your Okta Authorization server. You can use this token to authenticate requests for resources on your server or API. As a hypothetical example, let's say you have an API that provides messages for a user. You could create a `MessageList` component that gets the access token and uses it to make an authenticated request to your server.

Here is what the Vue component could look like for this hypothentical example using [axios](https://github.com/axios/axios):

```typescript
// src/components/MessageList.vue

<template>
  <ul v-if="posts && posts.length">
    <li v-for="post in posts" :key='post.title'>
      <p><strong>{{post.title}}</strong></p>
      <p>{{post.body}}</p>
    </li>
  </ul>
</template>

<script>
import axios from 'axios'

export default {
  data () {
    return {
      posts: []
    }
  },
  async created () {
    axios.defaults.headers.common['Authorization'] = `Bearer ${this.$auth.getAccessToken()}`
    try {
      const response = await axios.get(`http://localhost:{serverPort}/api/messages`)
      this.posts = response.data
    } catch (e) {
      console.error(`Errors! ${e}`)
    }
  }
}
</script>
```

### Using a custom login-page

The `okta-vue` SDK supports the session token redirect flow for custom login pages. For more information, [see the basic Okta Sign-in Widget functionality](https://github.com/okta/okta-signin-widget#new-oktasigninconfig).

To implement a custom login page, set an [onAuthRequired](#onauthrequired) callback on the OktaConfig object:

```typescript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [
    // other routes ...
    { path: '/login', component: Login }
  ]
})

export default router

// main.ts
import { createApp } from 'vue'
import { OktaAuth } from '@okta/okta-auth-js'
import OktaVue from '@okta/okta-vue'
import router from './router'

const oktaAuth = new OktaAuth(/* config */)
const app = createApp(App)
app.use(router)
app.use(OktaVue, { 
  oktaAuth,
  onAuthRequired: (oktaAuth) => {
    router.push({ path: '/login' })
  }
})
app.mount('#app')

```

#### Resuming the authentication flow

When using a [custom login page](#using-a-custom-login-page) and an [external identity provider][] your app should be prepared to handle a redirect callback from Okta to resume the authentication flow. The [LoginCallback](#logincallback) component has built-in logic for this scenario.

The `redirectUri` of your application will be requested with a special parameter (`?error=interaction_required`) to indicate that the authentication flow should be resumed by the application. In this case, the [LoginCallback](#logincallback) will call the [onAuthResume](#onauthresume) function (if defined). If `onAuthResume` is not defined, then `onAuthRequired` will be called (if defined). If neither method is defined, then the [LoginCallback](#logincallback) component will display the`interaction_required` error as a string.

If the authentication flow began on the custom login page using the [Okta SignIn Widget][], the transaction will automatically resume when the widget is rendered again on the custom login page.

Note that `onAuthResume` has the same signature as `onAuthRequired`. If you do not need any special logic for resuming an authorization flow, you can define only an `onAuthRequired` method and it will be called both to start or resume an auth flow.

## Reference

### `$auth`

This SDK works as a [Vue Plugin][]. It provides an instance of the [Okta Auth SDK][] to your components on the [globalProperties][]. For Options API you can access the [Okta Auth SDK][] instance by using `this.$auth` in your components. For Composition API you can access the OktaAuth instance with `useAuth()` composable.

```typescript
import { useAuth } from '@okta/okta-vue';
const $auth = useAuth();
```

### `authState`

This SDK provides reactive [authState][] property for your components. For Options API you can access the value by using `this.authState` in your components. For Composition API you can inject `okta.authState`:

```typescript
import { inject, ShallowRef } from 'vue';
import { AuthState } from '@okta/okta-auth-js';
const authState = inject<ShallowRef<AuthState>>('okta.authState');
// use authState.value
```

Note that if you have disabled Options API (with [`__VUE_OPTIONS_API__: false`](https://github.com/vuejs/core/blob/main/packages/vue/README.md#bundler-build-feature-flags)), you need to expose property `authState` in setup in order to use `authState` in template.


### `LoginCallback`

`LoginCallback` handles the callback after the redirect to and back from the Okta-hosted login page. By default, it parses the tokens from the uri, stores them, then redirects to `/`. If a secure route caused the redirect, then the callback redirects to the secured route. For more advanced cases, this component can be copied to your own source tree and modified as needed.

#### Configuration Options

The base set of configuration options are defined by [Okta Auth SDK][]. The following properties are required:

- `issuer` **(required)**: The OpenID Connect `issuer`
- `clientId` **(required)**: The OpenID Connect `client_id`
- `redirectUri` **(required)**: Where the callback is hosted

This SDK accepts all configuration options defined by [Okta Auth SDK][] (see [Configuration Reference](https://github.com/okta/okta-auth-js#configuration-reference) for the supported options) and adds some additional options:

##### `onAuthRequired`

*(optional)* Callback function. Called when authentication is required. If not supplied, `okta-vue` will redirect directly to Okta for authentication. This is triggered when a secure route is accessed without authentication. A common use case for this callback is to redirect users to a custom login route when authentication is required for a SecureRoute.

See [Using a custom login-page](#using-a-custom-login-page) for the code sample.

##### `onAuthResume`

*(optional)*: Callback function. Only relevant if using a [custom login page](#using-a-custom-login-page). Called when the [authentication flow should be resumed by the application](#resuming-the-authentication-flow), typically as a result of redirect callback from an [external identity provider][]. If `onAuthResume` is not defined, `onAuthRequired` will be called instead.

## Usage with TypeScript

### Use types

Types are implicitly provided by this library through the types entry in package.json. Types can also be referenced explicitly by importing them.

```typescript
import { OktaVueOptions } from '@okta/okta-vue'
import { OktaAuth } from '@okta/okta-auth-js'

const oktaAuth = new OktaAuth(/* configs */)
const options: OktaVueOptions = {
  oktaAuth
}
```

## Using `@okta/okta-vue/client-js`

> :warning: The `@okta/okta-client-javascript` packages are currently in **beta**, and so is this
> subpath. Its API may change in a minor release.

Everything above uses [Okta Auth SDK][] (`@okta/okta-auth-js`). As an alternative, this SDK also
ships an opt-in integration with [`@okta/okta-client-javascript`](https://github.com/okta/okta-client-javascript),
behind the `@okta/okta-vue/client-js` subpath.

The two paths are entirely separate. Nothing in the default entry point imports from this subpath or
from the `@okta/okta-client-javascript` packages, so if you never import `@okta/okta-vue/client-js`
you don't need to install them, and nothing about your app changes.

### The main difference: there is no `authState`

`@okta/okta-auth-js` keeps a persistent `authState` object that the SDK exposes as a reactive
property, and your app reads to decide what to render. `@okta/okta-client-javascript` has no such
object. Instead, authentication is resolved at the moment it's needed — before a guarded navigation,
and before each request — by looking up a stored credential, refreshing it if it has expired, or
redirecting to Okta if neither is possible.

So this subpath deliberately provides **no** `authState` ref and **no** `$auth` global property. A
snapshot of "am I signed in?" would go stale the moment it was read. Gate routes with
[`createAuthGuard`](#createauthguard) and load data with [`useOktaFetch`](#useoktafetch) instead —
both re-resolve authentication when it matters.

### Installation

The three `@okta/okta-client-javascript` packages are optional peer dependencies. Install them
alongside `@okta/okta-vue`:

```bash
npm install --save @okta/okta-vue @okta/auth-foundation @okta/oauth2-flows @okta/spa-platform
```

This subpath is published as ES modules only, because the packages above are ESM-only. Any modern
bundler (Vite, webpack 5, Rollup) handles it; a CommonJS `require()` will not.

### Configuration

Build the orchestrator your app will authenticate through, then hand it to `createOktaClient()` and
install the result like any [Vue Plugin][]:

```typescript
// src/okta.ts
import {
  AuthorizationCodeFlow,
  AuthorizationCodeFlowOrchestrator,
  OAuth2Client,
  SessionLogoutFlow
} from '@okta/spa-platform'
import { createOktaClient } from '@okta/okta-vue/client-js'

const client = new OAuth2Client({
  issuer: 'https://{yourOktaDomain}/oauth2/default',
  clientId: '{clientId}',
  scopes: ['openid', 'profile', 'email', 'offline_access']
})

const signInFlow = new AuthorizationCodeFlow(client, {
  redirectUri: `${window.location.origin}/login/callback`
})

export const signOutFlow = new SessionLogoutFlow(client, {
  logoutRedirectUri: window.location.origin
})

export const orchestrator = new AuthorizationCodeFlowOrchestrator(signInFlow)
export const okta = createOktaClient({ orchestrator, signOutFlow })
```

```typescript
// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { okta } from './okta'

createApp(App)
  .use(router)
  .use(okta)
  .mount('#app')
```

Every piece of this integration derives from that single `orchestrator`: the navigation guard, the
`FetchClient` behind `useOktaFetch`, and the credential the callback route stores. Passing one
instance keeps them in sync — a guard reading one orchestrator while the callback route writes to
another would break the credential handoff with nothing to show for it.

#### `createOktaClient` options

- `orchestrator` **(required)**: An `AuthorizationCodeFlowOrchestrator`.
- `signOutFlow` *(optional)*: A `SessionLogoutFlow`. Required by `useOktaAuth().signOut()`, which
  throws without it.
- `fetchClient` *(optional)*: A `FetchClient` for `useOktaFetch` to use. Defaults to
  `new FetchClient(orchestrator)`. Pass your own only when you need non-default `APIClient`
  configuration or request interceptors — and build it from the same `orchestrator`.
- `restoreOriginalUri` *(optional)*: `(originalUri: string) => void | Promise<void>`. Called by
  `LoginCallback` once the code exchange succeeds. Defaults to `router.replace(originalUri)`.

### Protect routes

Mark protected routes with `meta.requiresAuth` and register the guard. The plugin exposes one bound
to its own orchestrator as `okta.authGuard`:

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { LoginCallback } from '@okta/okta-vue/client-js'
import { okta } from '../okta'
import Home from '../components/Home.vue'
import Protected from '../components/Protected.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/login/callback', component: LoginCallback },
    { path: '/protected', component: Protected, meta: { requiresAuth: true } }
  ]
})

router.beforeEach(okta.authGuard)

export default router
```

A route is protected when it, or any of its ancestors, carries `meta: { requiresAuth: true }`.

To protect a single route instead of registering a global guard, build one with `createAuthGuard()`
and use it as a `beforeEnter`:

```typescript
import { createAuthGuard } from '@okta/okta-vue/client-js'
import { orchestrator } from '../okta'

{
  path: '/protected',
  component: Protected,
  meta: { requiresAuth: true },
  beforeEnter: createAuthGuard(orchestrator)
}
```

#### What the guard does on an invalid or expired session

This matches the `@okta/okta-auth-js` [`navigationGuard`](#add-a-protected-route): the target route
is recorded as the post-login destination, the browser is redirected to Okta, and the navigation is
abandoned.

Concretely, the guard has three outcomes:

- **A credential is available** (possibly after a silent refresh) — the navigation proceeds.
- **None is available** — the orchestrator redirects to Okta. The returned promise never settles,
  because the browser unloads first, so the navigation never completes.
- **None is available and the orchestrator was built with `avoidPrompting: true`** — it declines to
  redirect and returns `null`, so the guard returns `false` and the navigation is aborted with
  nowhere to go. Handle that yourself with an additional guard or a `router.onError` handler.

Unexpected failures — a token endpoint error, a flow already in progress — are left to propagate, so
`vue-router` surfaces them through `router.onError()` rather than silently aborting.

Note that unlike the `okta-auth-js` guard, this one does not re-check when a credential expires
*while* the user sits on a protected route: there is no auth-state subscription to do it with.
Expiry is caught at request time instead, by the `FetchClient` behind `useOktaFetch`, which runs the
same resolve/refresh/redirect logic before every request.

#### `createAuthGuard` options

`createAuthGuard(orchestrator, options?)` accepts:

- `originalUri` *(optional)*: `(to: RouteLocationNormalized) => string`. Where to send the user after
  they sign in. Defaults to `to => to.fullPath`, matching the auth-js path's
  `setOriginalUri(to.fullPath)`. The guard owns this because it is the only place that knows the
  route being *entered* — inside a `beforeEach` guard, `window.location` still points at the page
  being left. It is installed onto the orchestrator only for the duration of that one `getToken()`
  call and then restored, so any `getOriginalUri` you configured on the orchestrator yourself still
  applies to a `signIn()` button or a step-up `getToken()` elsewhere in the app.
- `params` *(optional)*: Extra `AuthorizeParams` (`scopes`, `acrValues`, `maxAge`, …) for the guard's
  token request, or a function deriving them from the route:
  `to => ({ scopes: to.meta.scopes })`.

### Use the `LoginCallback` component

Route your redirect URI at the `LoginCallback` exported from this subpath. It completes the
authorization code exchange, then navigates to the `originalUri` recorded when the flow started
(falling back to `/`). Errors are rendered as text, or through an `error` scoped slot if you provide
one:

```vue
<LoginCallback>
  <template #error="{ error }">
    <p v-if="error">Sign-in failed: {{ error }}</p>
  </template>
</LoginCallback>
```

The slot receives the thrown value itself, not a pre-stringified message, so you can branch on an
OAuth error code or `error.name`. Vue's interpolation already renders an `Error` through `String()`,
so the default `{{ error }}` output reads the same.

The component renders no wrapper element — the slot content (or the fallback text) goes straight into
your layout.

`originalUri` comes out of the flow context, which is untyped external data. Before handing it to
`router.replace()` the component reduces it to a same-origin path, so a value that points off-origin
or doesn't parse falls back to `/`. A `restoreOriginalUri` you supply yourself receives the recorded
value **as-is**, since you own that navigation and may want the absolute URL — validate it if it
could have come from anywhere but your own `createAuthGuard`.

### Show login and logout buttons

```vue
<script setup lang="ts">
import { useOktaAuth } from '@okta/okta-vue/client-js'

const { signIn, signOut } = useOktaAuth()
</script>

<template>
  <button @click="signIn()">Login</button>
  <button @click="signOut()">Logout</button>
</template>
```

`signIn()` resolves without navigating if a usable credential already exists; otherwise it redirects
to Okta. `signOut()` revokes and clears the stored credential, then redirects to Okta's logout
endpoint — pass `{ revokeTokens: false }` to clear local state without telling the authorization
server. It requires the `signOutFlow` you passed to `createOktaClient()`.

If you need the POST-based variant of logout — for instance when the `id_token_hint` would push the
logout URL past a URL length limit — drive it from your own `SessionLogoutFlow` instead of
`signOut()`:

```typescript
import { SessionLogoutFlow } from '@okta/spa-platform'
import { orchestrator, signOutFlow } from './okta'

const credential = await orchestrator.selectCredential({})

// Read the raw id_token first: `revoke('ALL')` removes the credential from storage as well as
// revoking it at the authorization server, so it is unreadable afterwards.
const idToken = credential?.token.idToken?.rawValue

await credential?.revoke('ALL')

if (idToken) {
  await SessionLogoutFlow.PerformPostRedirect(await signOutFlow.start(idToken))
}
```

### Fetch protected resources

`useOktaFetch()` requests an authenticated resource and exposes it as reactive state. The underlying
`FetchClient` resolves a credential, refreshes it if needed, or redirects to Okta if it can't, all
before the request goes out — there is no separate "am I signed in?" check to make first.

```vue
<script setup lang="ts">
import { useOktaFetch } from '@okta/okta-vue/client-js'

interface Message { id: string; text: string }

const { data, error, isLoading } = useOktaFetch<Message[]>('/api/messages')
</script>

<template>
  <p v-if="isLoading">Loading…</p>
  <p v-else-if="error">Could not load messages.</p>
  <ul v-else>
    <li v-for="message in data" :key="message.id">{{ message.text }}</li>
  </ul>
</template>
```

Pass a `ref` or a getter to re-fetch whenever it changes. The superseded request is aborted, and any
response that still arrives out of order is discarded, so `data` always reflects the most recent
request:

```typescript
const route = useRoute()
const { data } = useOktaFetch(() => `/api/users/${route.params.userId}/messages`)
```

The in-flight request is also aborted when the owning component unmounts. Aborts the composable
performs itself are not reported as errors; one triggered through a `signal` you passed in is.

`useOktaFetch(resource, options?)` returns `{ data, error, isLoading, response, refresh }`. The four
state values are **readonly** refs — they're outputs, and a write to `data.value` would be clobbered
by the next fetch anyway. Call `refresh()` to re-run the request. `error` holds a thrown error, or —
for a non-2xx response — the `Response` itself. Beyond `immediate` and `parse` below, remaining
options are forwarded to `FetchClient.fetch()` as the request init, so `method`, `headers`, `body`,
`scopes`, `signal` and friends all work:

- `immediate` *(optional)*: Whether to fetch during setup. Defaults to `true`; pass `false` to skip
  the initial request. This only affects that first request — a reactive `resource` still re-fetches
  when it changes, matching what `immediate` means for `watch`.
- `parse` *(optional)*: Turns a successful `Response` into `data`. Defaults to
  `response => response.json()`.

For imperative requests — form submissions, button handlers — use `useOktaFetchClient()` to get the
`FetchClient` directly:

```vue
<script setup lang="ts">
import { useOktaFetchClient } from '@okta/okta-vue/client-js'

const fetchClient = useOktaFetchClient()

async function save (profile: Profile) {
  await fetchClient.fetch('/api/profile', {
    method: 'POST',
    body: JSON.stringify(profile),
    headers: { 'Content-Type': 'application/json' }
  })
}
</script>
```

Because the client re-authenticates on demand, a component calling `useOktaFetch()` can trigger a
full-page redirect to Okta during setup. That's by design on this path. For routes where you'd
rather resolve authentication before the component mounts at all, guard the route as well.

### Access the orchestrator directly

`useOktaAuth()` also returns the `orchestrator` and a `getToken()` that delegates to it, as the
escape hatch for anything not wrapped here:

```typescript
const { orchestrator, getToken } = useOktaAuth()

const token = await getToken({ scopes: ['openid', 'admin'] })
```

`getToken()` returns `null` only when the orchestrator was built with `avoidPrompting: true` and
declined to redirect; otherwise it either resolves a token or navigates away.

If you'd rather not go through the composables at all, the plugin's context is provided under an
exported injection key:

```typescript
import { inject } from 'vue'
import { OktaClientKey } from '@okta/okta-vue/client-js'

const { orchestrator, fetchClient } = inject(OktaClientKey)!
```

### Known caveats

`@okta/okta-auth-js` is still a required peer dependency of `@okta/okta-vue`, so a project using
only this subpath will see a peer-dependency warning for it. Making it optional is a breaking change
and is deferred to the next major version.

This subpath is **browser-only**, like `@okta/spa-platform` itself. Credentials live in browser
storage, `signOut()` navigates with `window.location.assign()`, and `LoginCallback` reads the
redirect result off `window.location.href`. Under SSR — Nuxt, `vite-ssr`, `@vue/server-renderer` —
none of that exists on the server. Installing the plugin is safe (`createOktaClient()` touches no
browser API), but keep the pieces that do on the client:

- Render `LoginCallback` client-side only (in Nuxt, a `<ClientOnly>` wrapper or a `.client` page).
- Register `okta.authGuard` inside a client-only plugin, so it never runs during server rendering.
- Call `useOktaFetch()` with `immediate: false` and `refresh()` from `onMounted`, or reach for
  `useOktaFetchClient()` in an event handler, if the component also renders on the server.

## Migrating

Each major version release introduces breaking changes, see [MIGRATING GUIDE](MIGRATING.md) to get your application properly updated.

## Contributing

We welcome contributions to all of our open-source packages. Please see the [contribution guide](https://github.com/okta/okta-oidc-js/blob/master/CONTRIBUTING.md) to understand how to structure a contribution.

### Installing dependencies for contributions

We use [yarn](https://yarnpkg.com) for dependency management when developing this package:

```bash
yarn install
```

### Commands

| Command        | Description                        |
| -------------- | ---------------------------------- |
| `yarn install` | Install all dependencies           |
| `yarn start`   | Start the sample app using the SDK |
| `yarn test`    | Run integration tests              |
| `yarn lint`    | Run eslint linting tests           |
