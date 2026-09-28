import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// ESLint 9's scope analyzer (eslint-scope) is never told that the parser is
// in JSX mode, so a variable that is only referenced as a component tag —
// e.g. `function ContentTable({ EmptyIcon }) { return <EmptyIcon /> }` —
// is reported by `no-unused-vars` as unused. eslint-scope has supported JSX
// reference tracking since 8.3.0, but only via an opt-in `jsx` analysis
// option that ESLint 9 does not pass (ESLint 10 does), so no version pin
// or parser flag can enable it on this setup. This local rule mirrors
// `react/jsx-uses-vars` (not a dependency of this project): it marks
// capitalized JSX element names — and `<Foo.Bar />` member-expression
// roots — as used. Genuinely unused props are still reported; a name's
// casing is never treated as proof of usage.
const jsxUsesVars = {
  meta: {
    type: 'problem',
    docs: { description: 'Mark variables referenced from JSX as used.' },
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode()

    const markAsUsed = (name, node) => {
      if (typeof sourceCode.markVariableAsUsed === 'function') {
        sourceCode.markVariableAsUsed(name, node)
      } else if (typeof context.markVariableAsUsed === 'function') {
        context.markVariableAsUsed(name)
      }
    }

    return {
      JSXOpeningElement(node) {
        if (node.name.type === 'JSXIdentifier') {
          // Lowercase tags (e.g. `div`) are host tags, not variable
          // references; `_`-prefixed names are references just like
          // capitalized ones.
          if (/^[A-Z_]/.test(node.name.name)) {
            markAsUsed(node.name.name, node)
          }
        } else if (node.name.type === 'JSXMemberExpression') {
          // `<Foo.Bar />` — only the root object is a variable reference.
          let root = node.name.object
          while (root.type === 'JSXMemberExpression') root = root.object
          if (root.type === 'JSXIdentifier') markAsUsed(root.name, node)
        }
      },
    }
  },
}

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    name: 'local/jsx-uses-vars',
    files: ['**/*.{js,jsx}'],
    plugins: {
      local: {
        rules: {
          'jsx-uses-vars': jsxUsesVars,
        },
      },
    },
    rules: {
      'local/jsx-uses-vars': 'error',
    },
  },
])
