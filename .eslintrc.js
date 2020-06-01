module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  extends: ["plugin:@typescript-eslint/recommended"],
  rules: {
    "max-len": ["error", 110],
    "@typescript-eslint/no-inferrable-types": false,
  },
};
