import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: ['templates/**/*', 'utils/bridge.ts'],
  rules: {
    'e18e/prefer-static-regex': 'off',
  },
})
