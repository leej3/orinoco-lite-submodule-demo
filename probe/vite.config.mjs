export default {
  root: new URL('.', import.meta.url).pathname,
  base: '/orinoco-lite-submodule-demo/auth-test/',
  define: { __SOURCE__: JSON.stringify(process.env.ORINOCO_PROBE_SOURCE) },
  build: { outDir: '../build/pages/auth-test', emptyOutDir: true },
};
