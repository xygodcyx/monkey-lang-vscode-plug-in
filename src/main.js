import fs from 'fs'
import { runMonkey } from './interpreter.js'

function main() {
  // src/main.js

  const file = process.argv[2]
  const source = fs.readFileSync(file, 'utf-8')

  runMonkey(source)
}

main()
