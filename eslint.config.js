import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: ['templates/**/*'],
  rules: {
    'e18e/prefer-static-regex': 'off',
  },
})
