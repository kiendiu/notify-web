// Polyfills required for some legacy libraries that expect Node globals in browser
// Defines `global` and a minimal `process.env` to avoid runtime ReferenceErrors
(window as any).global = window as any;
(window as any).process = { env: {} };
