import { defineConfig } from 'vite'
import path from 'path';
import vue from '@vitejs/plugin-vue'
import envModule from '@okta/env';

envModule.setEnvironmentVarsFromTestEnv();

const PORT = process.env.PORT || 8080;
process.env.BASE_URI = process.env.BASE_URI || `http://localhost:${PORT}`

process.env.CLIENT_ID = process.env.SPA_CLIENT_ID || process.env.CLIENT_ID;
process.env.OKTA_TESTING_DISABLEHTTPSCHECK = process.env.OKTA_TESTING_DISABLEHTTPSCHECK || false;
process.env.USE_INTERACTION_CODE = process.env.USE_INTERACTION_CODE || false;

const env = {};

// List of environment variables made available to the app
[
  'ISSUER',
  'CLIENT_ID',
  'OKTA_TESTING_DISABLEHTTPSCHECK',
  'BASE_URI'
].forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Environment variable ${key} must be set. See README.md`);
  }
  env[key] = process.env[key];
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue()
  ],
  define: {
    'process.env': env,
    'CONFIG': env,
    '__VUE_OPTIONS_API__': false
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, '/src') }
    ]
  },
  server: {
    port: process.env.PORT || 8080
  },
  preview: {
    port: process.env.PORT || 8080
  }
})
