module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    rules: {
        'indent'  : [1, 4],
        'semi'    : [1, 'always'],
        'quotes'  : [2, 'single', 'avoid-escape']
    }
};
