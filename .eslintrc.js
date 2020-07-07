module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2020: true,
    node: true,
    mocha: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    // "plugin:react-hooks/recommended",
    // "plugin:react-redux/recommended",
    "plugin:node/recommended",
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 11,
  },
  plugins: ["react"],
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    "node/no-extraneous-require": [
      "error",
      {
        allowModules: ["express"],
      },
    ],
    "node/no-unsupported-features/es-syntax": "off",
    "node/no-unpublished-require": 0,
  },
};
