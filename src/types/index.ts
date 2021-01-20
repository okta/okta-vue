import { OktaAuth, AuthState } from '@okta/okta-auth-js';

export type OnAuthRequiredFunction = (oktaAuth: OktaAuth) => Promise<void> | void;

export interface OktaVueOptions {
  oktaAuth: OktaAuth;
  onAuthRequired: OnAuthRequiredFunction;
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $auth: OktaAuth;
    authState: AuthState;
    $_oktaVue_handleAuthStateUpdate: (authState: AuthState) => void;
  }
}
