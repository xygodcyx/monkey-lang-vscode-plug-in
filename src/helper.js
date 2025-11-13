import {
  BooleanLiteral,
  Expression,
  Identifier,
  InfixExpression,
  IntegerLiteral,
} from '../src/ast.js'
import Parser from '../src/parser.js'
import Eval, {
  SingleObjectInstance,
} from '../src/evaluator.js'
import {
  BaseObject,
  BooleanObj,
  IntegerObj,
  NullObject,
  StringObj,
  UndefinedObject,
  VoidObject,
} from '../src/object.js'
import Lexer from '../src/lexer.js'
import { newEnvironment } from '../src/environment.js'

/**
 * 检查解析器是否存在错误。如果有，则打印错误并中止测试。
 * @param {Parser} parser
 */
export function checkParserErrors(parser) {
  const errors = parser.Errors()
  if (errors.length === 0) return

  console.error(`解析器共出现 ${errors.length} 个错误：`)
  for (const msg of errors) {
    console.error(`  解析器错误：${msg}`)
  }
  throw new Error('❌ 解析器存在错误，请检查日志输出')
}
/**
 * 打印出解析过程中的错误
 * @param {Object} t
 * @param {string[]} errors
 */
export function printParserErrors(t, errors) {
  const MONKEY_FACE = `            __,__
   .--.  .-"     "-.  .--.
  / .. \/  .-. .-.  \/ .. \
 | |  '|  /   Y   \  |'  | |
 | \   \  \ 0 | 0 /  /   / |
  \ '- ,\.-"""""""-./, -' /
   ''-' /_   ^ ^   _\ '-''
       |  \._   _./  |
       \   \ '~' /   /
        '._ '-=-' _.'
           '-----'
`
  console.log(MONKEY_FACE, '\n')
  console.log(
    'Woops! We ran into some monkey business here!\n'
  )
  console.log('parser errors:\n')
  for (const error of errors) {
    console.log(`\t${error}\n`)
    continue
  }
}

/**
 * @param {object} t - 测试对象，包含错误报告方法
 * @param {Expression} exp - 要检查的表达式节点
 * @param {number} expected - 预期的整数值
 * @returns {boolean} - 是否测试通过
 */
export function testIntegerLiteral(t, exp, expected) {
  if (!exp || !(exp instanceof IntegerLiteral)) {
    t.error(
      `exp is not IntegerLiteral. got=${exp?.constructor?.name}`
    )
    return false
  }

  if (exp.value !== expected) {
    t.error(`exp.value not ${expected}. got=${exp.value}`)
    return false
  }

  if (exp.tokenLiteral() !== expected.toString()) {
    t.error(
      `exp.tokenLiteral not ${expected}. got=${exp.tokenLiteral()}`
    )
    return false
  }

  return true
}

/**
 * 测试表达式是否为标识符并验证其值
 * @param {object} t - 测试对象，包含错误报告方法
 * @param {Expression} exp - 要测试的表达式
 * @param {string} value - 预期的标识符值
 * @returns {boolean} 如果所有检查通过返回 true，否则返回 false
 */
export function testIdentifier(t, exp, value) {
  // 类型检查：确认 exp 是 Identifier 类型
  if (!(exp instanceof Identifier)) {
    t.error(
      `exp 不是 *ast.Identifier. 实际类型=${exp.constructor.name}`
    )
    return false
  }

  const ident = /** @type {Identifier} */ (exp)

  // 检查标识符值
  if (ident.value !== value) {
    t.error(
      `ident.Value 不是 ${value}. 实际值=${ident.value}`
    )
    return false
  }

  // 检查 TokenLiteral 值
  if (ident.tokenLiteral() !== value) {
    t.error(
      `ident.TokenLiteral 不是 ${value}. 实际值=${ident.tokenLiteral()}`
    )
    return false
  }

  return true
}

/**
 * 测试中缀表达式（如 5 + 5）
 * @param {object} t - 测试框架对象（需实现 error 方法）
 * @param {Expression} exp - 要测试的表达式
 * @param {number|boolean|string} left - 左操作数期望值
 * @param {string} operator - 期望的运算符
 * @param {number|boolean|string} right - 右操作数期望值
 * @returns {boolean} 是否通过测试
 */
export function testInfixExpression(
  t,
  exp,
  left,
  operator,
  right
) {
  // 类型检查
  if (!(exp instanceof InfixExpression)) {
    t.error(
      `exp 不是 InfixExpression. 实际类型= ${exp?.constructor?.name}`
    )
    return false
  }

  // 测试左操作数
  if (!testLiteralExpression(t, exp.left, left)) {
    t.error(`左操作数测试失败`)
    return false
  }

  // 测试运算符
  if (exp.operator !== operator) {
    t.error(
      `运算符不是 '${operator}'. 实际值= '${exp.operator}'`
    )
    return false
  }

  // 测试右操作数
  if (!testLiteralExpression(t, exp.right, right)) {
    t.error(`右操作数测试失败`)
    return false
  }

  return true
}

/**
 * 测试布尔字面量
 * @param {object} t - 测试框架对象
 * @param {Expression} exp - 要测试的表达式
 * @param {boolean} value - 期望的布尔值
 * @returns {boolean} 是否通过测试
 */
export function testBooleanLiteral(t, exp, value) {
  if (!(exp instanceof BooleanLiteral)) {
    t.error(
      `exp 不是 BooleanLiteral. 实际类型=${exp.constructor.name}`
    )
    return false
  }
  if (exp.value !== value) {
    t.error(`布尔值不是 ${value}. 实际值=${exp.value}`)
    return false
  }

  if (exp.tokenLiteral() !== String(value)) {
    t.error(
      `tokenLiteral 不是 ${value}. 实际值=${exp.tokenLiteral()}`
    )
    return false
  }

  return true
}

/**
 * 测试字面量表达式（支持整数、布尔值、标识符）
 * @param {object} t - 测试框架对象
 * @param {Expression} exp - 要测试的表达式
 * @param {number|boolean|string} expected - 期望值
 * @returns {boolean} 是否通过测试
 */
export function testLiteralExpression(t, exp, expected) {
  switch (typeof expected) {
    case 'number':
      return testIntegerLiteral(t, exp, expected)
    case 'boolean':
      return testBooleanLiteral(t, exp, expected)
    case 'string':
      return testIdentifier(t, exp, expected)
    default:
      t.error(`未处理的表达式类型: ${typeof exp}`)
      return false
  }
}

/**
 * 将输入源码解析为 AST 并执行求值
 * @param {string} input
 * @returns {BaseObject}
 */
export async function testEval(input) {
  const l = new Lexer(input)
  const p = new Parser(l)
  const program = p.parseProgram()
  checkParserErrors(p)
  const env = newEnvironment()
  return await Eval(program, env)
}

/**
 * 检查返回对象是否为 Integer 并且值正确
 * @param {BaseObject} obj
 * @param {number} expected
 * @returns {boolean}
 */
export function testIntegerObject(obj, expected) {
  if (!(obj instanceof IntegerObj)) {
    console.error(
      `object is not Integer. got=${
        obj?.constructor?.name
      } (${JSON.stringify(obj)})`
    )
    return false
  }
  if (obj.value !== expected) {
    console.error(
      `object has wrong value. got=${obj.value}, want=${expected}`
    )
    return false
  }
  return true
}

/**
 * 检查返回对象是否为 String 并且值正确
 * @param {BaseObject} obj
 * @param {string} expected
 * @returns {boolean}
 */
export function testStringObject(obj, expected) {
  if (!(obj instanceof StringObj)) {
    console.error(
      `object is not String. got=${
        obj?.constructor?.name
      } (${JSON.stringify(obj)})`
    )
    return false
  }
  if (obj.value !== expected) {
    console.error(
      `object has wrong value. got=${obj.value}, want=${expected}`
    )
    return false
  }
  return true
}

/**
 * 检查返回对象是否为 Boolean 并且值正确
 * @param {BaseObject} obj
 * @param {boolean} expected
 * @returns {boolean}
 */
export function testBooleanObject(obj, expected) {
  if (!(obj instanceof BooleanObj)) {
    console.error(
      `object is not Boolean. got=${
        obj?.constructor?.name
      } (${JSON.stringify(obj)})`
    )
    return false
  }
  if (obj.value !== expected) {
    console.error(
      `object has wrong value. got=${obj.value}, want=${expected}`
    )
    return false
  }
  return true
}

export function testNotValueObject(obj, expected) {
  if (expected instanceof NullObject) {
    return testNullObject(obj)
  } else if (expected instanceof VoidObject) {
    return testVoidObject(obj)
  } else if (expected instanceof UndefinedObject) {
    return testUndefinedObject(obj)
  }
  console.error(
    `object is not NotValueObject. got=${
      obj?.constructor?.name
    } (${JSON.stringify(obj)})`
  )
}

/**
 * 检查对象是否为 NULL
 * @param {BaseObject} obj
 * @returns {boolean}
 */
export function testNullObject(obj) {
  if (obj !== SingleObjectInstance.NULL) {
    console.error(
      `object is not NULL. got=${
        obj?.constructor?.name
      } (${JSON.stringify(obj)})`
    )
    return false
  }
  return true
}

/**
 * 检查对象是否为 VOID
 * @param {BaseObject} obj
 * @returns {boolean}
 */
export function testVoidObject(obj) {
  if (obj !== SingleObjectInstance.VOID) {
    console.error(
      `object is not VOID. got=${
        obj?.constructor?.name
      } (${JSON.stringify(obj)})`
    )
    return false
  }
  return true
}

/**
 * 检查对象是否为 UNDEFINED
 * @param {BaseObject} obj
 * @returns {boolean}
 */
export function testUndefinedObject(obj) {
  if (obj !== SingleObjectInstance.UNDEFINED) {
    console.error(
      `object is not UNDEFINED. got=${
        obj?.constructor?.name
      } (${JSON.stringify(obj)})`
    )
    return false
  }
  return true
}
