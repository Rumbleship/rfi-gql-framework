module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports,
    project: ['./tsconfig.json', './tsconfig-build.json', './tsconfig-base.json']
  },
  extends: [
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin,
    'prettier/@typescript-eslint', // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
    'plugin:prettier/recommended' // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  rules: {
    'import/no-cycle': 'warn', // I'm not sure if this should be error or warn.
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/no-unused-vars': 0,
    '@typescript-eslint/no-floating-promises': 'error',
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    // e.g. "@typescript-eslint/explicit-function-return-type": "off",
  },
  overrides:[
    {
      files: ['**/*.test.ts'],
      rules: {
        // We want to be able to use `!` in tests, generally, and even in optional chains
        // to easily index into transformed graph objects. Leave at warning to encourage
        // avoiding it, but allow it to be committed an pass lint.
        '@typescript-eslint/no-non-null-assertion': 1,
        '@typescript-eslint/no-non-null-asserted-optional-chain': 1
      }
    },
    {
      // Attrib/Builder/Mixin files define functions that need to use TypeScript's inflection to generate types
      // Route files define handlers in the Hapi ecosystem and it's annoying to boilerplate copy it.
      files: ['**/*.attribs.ts', '**/*.builder.ts', '**/*.mixin.ts', '**/*.route.ts'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 0
      }
    },
    {
      // Mixins *also* need to be able to extend `ClassType<object>` to get type-inflection working.
      // (**not** ClassType<Record<string,any>> as eslint suggests**)
      files: ['src/gql/relay/mixins/*.mixin.ts'],
      rules: {
        '@typescript-eslint/ban-types': 0,
      }
    }
  ]
};
