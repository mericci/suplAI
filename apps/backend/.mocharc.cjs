process.env.TZ = 'UTC';

module.exports = {
  extension: ['ts'],
  spec: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  require: ['./mocha.hooks.cjs'],
  'node-option': ['import=tsx']
};
