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

const auth = useAuth();

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
