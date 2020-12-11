import Vue from 'vue'
import VueRouter from 'vue-router'
import { toRelativeUrl, OktaAuth, AuthState } from '@okta/okta-auth-js'
import { OktaVueOptions, OnAuthRequiredFunction } from './okta-vue'

let _oktaAuth: OktaAuth
let _onAuthRequired: OnAuthRequiredFunction
let _router: VueRouter
let originalUriTracker: string

const guardSecureRoute = async (authState: AuthState) => {
  if (!authState.isAuthenticated) {
    _oktaAuth.setOriginalUri(originalUriTracker)
    if (_onAuthRequired) {
      await _onAuthRequired(_oktaAuth)
    } else {
      await _oktaAuth.signInWithRedirect()
    }
  }
}

export const OktaVueMixin = Vue.extend({
  data () {
    return {
      authState: _oktaAuth.authStateManager.getAuthState()
    }
  },
  beforeCreate() {
    // assign router for the default restoreOriginalUri callback
    _router = this.$router

    // add default restoreOriginalUri callback
    if (!_oktaAuth.options.restoreOriginalUri) {
      _oktaAuth.options.restoreOriginalUri = async (oktaAuth: OktaAuth, originalUri: string) => {
        // If a router is available, provide a default implementation
        if (_router) {
          const path = toRelativeUrl(originalUri, window.location.origin)
          _router.replace({ path })
          return
        }
      }
    }
  },
  created () {
    // subscribe to the latest authState
    _oktaAuth.authStateManager.subscribe(this.$_oktaVue_handleAuthStateUpdate)
    if (!_oktaAuth.token.isLoginRedirect()) {
      // trigger an initial change event to make sure authState is latest
      _oktaAuth.authStateManager.updateAuthState()
    }
  },
  beforeDestroy () {
    _oktaAuth.authStateManager.unsubscribe(this.$_oktaVue_handleAuthStateUpdate)
  },
  // "beforeRouteEnter" does NOT have access to `this` component instance
  async beforeRouteEnter (to, from, next) {
    if (to.matched.some(record => record.meta.requiresAuth)) {
      // track the originalUri for guardSecureRoute
      originalUriTracker = to.fullPath

      // subscribe to authState change to protect secure routes when authState change
      // all secure routes should subscribe before enter the route
      _oktaAuth.authStateManager.subscribe(guardSecureRoute)

      // guard the secure route based on the authState when enter
      const isAuthenticated = await _oktaAuth.isAuthenticated()
      if (!isAuthenticated) {
        const authState = _oktaAuth.authStateManager.getAuthState()
        await guardSecureRoute(authState)
      } else {
        next()
      }
    } else {
      next()
    }
  },
  beforeRouteLeave (to, from, next) {
    _oktaAuth.authStateManager.unsubscribe(guardSecureRoute)
    next()
  },
  // private property naming convention follows
  // https://vuejs.org/v2/style-guide/#Private-property-names-essential
  methods: {
    async $_oktaVue_handleAuthStateUpdate (authState: AuthState) {
      this.authState = Object.assign(this.authState, authState)
    }
  }
})  

export default ({ oktaAuth, onAuthRequired }: OktaVueOptions) => {
  _oktaAuth = oktaAuth
  _onAuthRequired = onAuthRequired

  Vue.mixin(OktaVueMixin)
}
