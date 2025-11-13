import Lexer from './lexer.js'
import Parser from './parser.js'
import Eval, { globalEnv } from './evaluator.js'
import { ObjectType } from './object.js'

export async function runMonkey(source) {
  const lexer = new Lexer(source)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()
  if (parser.Errors().length !== 0) {
    printParserErrors(console, parser.Errors())
    rl.prompt()
    return
  }
  const evaluated = await Eval(program, globalEnv)
  if (evaluated) {
    evaluated.Type() !== ObjectType.VOID_OBJ &&
      console.log(`${evaluated.Inspect()}`)
  }
}
