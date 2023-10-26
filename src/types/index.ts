import { OktaAuth, AuthState } from '@okta/okta-auth-js';

export type OnAuthRequiredFunction = (oktaAuth: OktaAuth) => Promise<void> | void;

export interface OktaVueOptions {
  oktaAuth: OktaAuth;
  onAuthRequired?: OnAuthRequiredFunction;
  onAuthResume?: OnAuthRequiredFunction;
}

export type OktaAuthVue = OktaAuth & {
  isInteractionRequiredError?: (error: Error) => boolean;
  options: {
    onAuthRequired?: OnAuthRequiredFunction;
    onAuthResume?: OnAuthRequiredFunction;
  };
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $auth: OktaAuthVue;
    authState: AuthState;
  }
}

declare global {
  const __VUE_OPTIONS_API__: boolean;
}
