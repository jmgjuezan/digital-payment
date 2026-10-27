import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const filename = fileURLToPath(import.meta.url)
const directory = dirname(filename)
const compat = new FlatCompat({ baseDirectory: directory })

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['node_modules/**', '.next/**', 'nextjs-scaffold/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
]

export default eslintConfig