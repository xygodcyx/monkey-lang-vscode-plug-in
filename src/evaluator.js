import Program, {
    ArrayLiteral,
    AssignStatement,
    BlockStatement,
    BooleanLiteral,
    CallExpression,
    Expression,
    ExpressionStatement,
    FunctionLiteral,
    Identifier,
    IfExpression,
    IndexExpression,
    InfixExpression,
    IntegerLiteral,
    LetStatement,
    Node,
    PrefixExpression,
    ReturnStatement,
    Statement,
    StringLiteral,
    WhileExpression,
} from './ast.js';
import { builtins } from './builtins.js';
import { Environment, newEnclosedEnvironment, newEnvironment } from './environment.js';
import {
    ArrayObject,
    BaseObject,
    BooleanObj,
    BuiltinObject,
    ErrorObject,
    FunctionObject,
    IntegerObj,
    NullObject,
    ObjectType,
    ReturnValueObject,
    StringObj,
    UndefinedObject,
    VoidObject,
} from './object.js';

export const globalEnv = newEnvironment();

export const SingleObjectInstance = {
    NULL: new NullObject(),
    VOID: new VoidObject(),
    UNDEFINED: new UndefinedObject(),
    TRUE: new BooleanObj(true),
    FALSE: new BooleanObj(false),
};

/**
 * newError
 *
 * 统一创建错误对象。
 *
 * @param {string} message
 * @returns {ErrorObject}
 */
export function newError(message) {
    // 简单实现 fmt.Sprintf 的效果
    return new ErrorObject(message);
}

/**
 * 判断给定对象是否为错误对象。
 *
 * @param {BaseObject} obj - 要检测的对象
 * @returns {boolean} - 如果是 ErrorObject 返回 true，否则 false
 */
export function isError(obj) {
    if (obj == null) return false;
    return obj instanceof ErrorObject && obj.Type() === ObjectType.ERROR_OBJ;
}

/**
 * 解释ast节点的值
 * @param {Node} node ast节点
 * @param {Environment} env 上下文环境
 * @returns {BaseObject} 返回说明
 */
export default async function Eval(node, env) {
    if (node instanceof Program) {
        return await evalProgram(node, env);
    } else if (node instanceof ExpressionStatement) {
        return await Eval(node.expression, env);
    } else if (node instanceof IntegerLiteral) {
        return new IntegerObj(node.value);
    } else if (node instanceof StringLiteral) {
        return new StringObj(node.value);
    } else if (node instanceof BooleanLiteral) {
        return await nativeBoolToBooleanObject(node.value);
    } else if (node instanceof PrefixExpression) {
        const right = await Eval(node.right, env);
        if (isError(right)) {
            return right;
        }
        return await evalPrefixExpression(node.operator, right);
    } else if (node instanceof InfixExpression) {
        const left = await Eval(node.left, env);
        if (isError(left)) {
            return left;
        }
        const right = await Eval(node.right, env);
        if (isError(right)) {
            return right;
        }
        const result = await evalInfixExpression(node.operator, left, right);
        return result;
    } else if (node instanceof BlockStatement) {
        return await evalBlockStatement(node, env);
    } else if (node instanceof IfExpression) {
        // const blockEnv = newEnclosedEnvironment(env);
        return await evalIfExpression(node, env);
    } else if (node instanceof WhileExpression) {
        return await evalWhileExpression(node, env);
    } else if (node instanceof ReturnStatement) {
        const value = await Eval(node.returnValue, env);
        if (isError(value)) {
            return value;
        }
        return new ReturnValueObject(value);
    } else if (node instanceof LetStatement) {
        // if (env.get(node.name.value)) {
        //     return newError(`identifier has declaration: ${node.name.value}`);
        // }
        const val = await Eval(node.value, env);
        if (isError(val)) {
            return val;
        }
        env.set(node.name.value, val);
        return val;
    } else if (node instanceof AssignStatement) {
        const val = await Eval(node.value, env);
        if (isError(val)) {
            return val;
        }
        const existing = env.get(node.name.value);
        if (!existing) {
            // 如果不存在,则直接在全局作用域中赋值
            console.log(
                `被动设置到全局作用域 ${globalEnv} ${node.name.value} : ${val.Type()} -> ${val.Inspect()}`
            );
            globalEnv.set(node.name.value, val);
        } else {
            console.log(
                `设置到当前作用域 ${env} ${node.name.value} : ${val.Type()} -> ${val.Inspect()}`
            );
            env.set(node.name.value, val);
        }
        return val;
    } else if (node instanceof Identifier) {
        return await evalIdentifier(node, env);
    } else if (node instanceof FunctionLiteral) {
        const params = node.params;
        const body = node.body;
        return new FunctionObject(params, body, env);
    } else if (node instanceof CallExpression) {
        const func = await Eval(node.function, env);
        if (isError(func)) {
            return func;
        }
        const args = await evalExpressions(node.arguments, env);
        if (args.length === 1 && isError(args[0])) {
            return args[0];
        }
        return await applyFunction(func, args);
    } else if (node instanceof ArrayLiteral) {
        const elements = await evalExpressions(node.elements, env);
        if (elements.length === 1 && isError(elements[0])) {
            return elements[0];
        }
        return new ArrayObject(elements);
    } else if (node instanceof IndexExpression) {
        const left = await Eval(node.left, env);
        if (isError(left)) {
            return left;
        }
        const index = await Eval(node.index, env);
        if (isError(index)) {
            return index;
        }
        return await evalIndexExpression(left, index);
    }
    return SingleObjectInstance.NULL;
}

/**
 * 解释程序根语句
 * @param {Program} program 根语句数组
 * @param {Environment} env 上下文环境
 * @returns {BaseObject} 解释后的对象
 */
async function evalProgram(program, env) {
    let result = null;
    for (const stmt of program.statements) {
        result = await Eval(stmt, env);
        if (result instanceof ReturnValueObject) {
            return result.value;
        } else if (result instanceof ErrorObject) {
            return result;
        }
    }
    return result;
}

/**
 * 解析块语句
 * @param {BlockStatement} block 块语句
 * @param {Environment} env 上下文环境
 * @returns {BaseObject}
 */
async function evalBlockStatement(block, env) {
    for (const stmt of block.statements) {
        const result = await Eval(stmt, env);
        if (result instanceof ReturnValueObject) {
            return result;
        } else if (result instanceof ErrorObject || result.Type() === ObjectType.ERROR_OBJ) {
            return result;
        }
    }
    return SingleObjectInstance.VOID;
}

/**
 * 布尔字面量转为布尔对象
 * @param {boolean} input 布尔字面量
 * @returns {BooleanObj} 布尔对象
 */
function nativeBoolToBooleanObject(input) {
    return input ? SingleObjectInstance.TRUE : SingleObjectInstance.FALSE;
}

/**
 * 解析前缀表达式
 * @param {string} operator 前缀操作符
 * @param {BaseObject} right 前缀操作符
 * @returns {BaseObject}
 */
function evalPrefixExpression(operator, right) {
    switch (operator) {
        case '!':
            return evalBangOperatorExpression(right);
        case '-':
            return evalMinusPrefixOperatorExpression(right);
        default:
            return newError(`unknown operator: ${operator} ${right.Type()}`);
    }
}

/**
 * 解析!前缀运算符表达式
 * @param {BaseObject} right 右操作数
 * @returns {BaseObject}
 */
function evalBangOperatorExpression(right) {
    switch (right) {
        case SingleObjectInstance.TRUE:
            return SingleObjectInstance.FALSE;
        case SingleObjectInstance.FALSE:
            return SingleObjectInstance.TRUE;
        case SingleObjectInstance.NULL:
            return SingleObjectInstance.TRUE;
        default:
            return SingleObjectInstance.FALSE;
    }
}
/**
 * 解析-前缀运算符表达式
 * @param {BaseObject} right 右操作数
 * @returns {BaseObject}
 */
function evalMinusPrefixOperatorExpression(right) {
    if (right.Type() != ObjectType.INTEGER_OBJ || !(right instanceof IntegerObj)) {
        return newError(`unknown operator: -${right.Type()}`);
    }
    const value = right.value;
    return new IntegerObj(-value);
}

/**
 * 解析中缀表达式
 * @param {string} operator 前缀操作符
 * @param {BaseObject} left 左操作数
 * @param {BaseObject} right 右操作数
 * @returns {BaseObject}
 */
function evalInfixExpression(operator, left, right) {
    // 错误处理，类型不相等不能使用中缀运算符

    if (left.Type() !== right.Type()) {
        return newError(`type mismatch: ${left.Type()} ${operator} ${right.Type()}`);
    }

    if (left.Type() === ObjectType.INTEGER_OBJ && right.Type() === ObjectType.INTEGER_OBJ) {
        return evalIntegerInfixExpression(operator, left, right);
    } else if (left.Type() === ObjectType.STRING_OBJ && right.Type() === ObjectType.STRING_OBJ) {
        return evalStringInfixExpression(operator, left, right);
    }

    switch (operator) {
        case '==':
            return nativeBoolToBooleanObject(left === right);
        case '!=':
            return nativeBoolToBooleanObject(left !== right);
        default:
            return newError(`unknown operator: ${left.Type()} ${operator} ${right.Type()}`);
    }
}

/**
 * 解析整数中缀表达式
 * @param {string} operator 前缀操作符
 * @param {IntegerObj} left 左操作数
 * @param {IntegerObj} right 右操作数
 * @returns {IntegerObj | NullObject}
 */
function evalIntegerInfixExpression(operator, left, right) {
    const leftValue = left.value;
    const rightValue = right.value;
    switch (operator) {
        case '+':
            return new IntegerObj(leftValue + rightValue);
        case '-':
            return new IntegerObj(leftValue - rightValue);
        case '*':
            return new IntegerObj(leftValue * rightValue);
        case '/':
            return new IntegerObj(leftValue / rightValue);
        case '>':
            return nativeBoolToBooleanObject(leftValue > rightValue);
        case '<':
            return nativeBoolToBooleanObject(leftValue < rightValue);
        case '==':
            return nativeBoolToBooleanObject(leftValue === rightValue);
        case '!=':
            return nativeBoolToBooleanObject(leftValue !== rightValue);
        default:
            return newError(`unknown operator: ${left.Type()} ${operator} ${right.Type()}`);
    }
}

/**
 * 解析字符串中缀表达式
 * @param {string} operator 前缀操作符
 * @param {StringObj} left 左操作数
 * @param {StringObj} right 右操作数
 * @returns {StringObj | NullObject}
 */
function evalStringInfixExpression(operator, left, right) {
    const leftValue = left.value;
    const rightValue = right.value;
    switch (operator) {
        case '+':
            return new StringObj(leftValue + rightValue);
        case '==':
            return nativeBoolToBooleanObject(leftValue === rightValue);
        case '!=':
            return nativeBoolToBooleanObject(leftValue !== rightValue);
        default:
            return newError(`unknown operator: ${left.Type()} ${operator} ${right.Type()}`);
    }
}

/**
 * 解析if表达式
 * @param {IfExpression} ie if表达式
 * @param {Environment} env 上下文环境
 * @returns {BaseObject}
 */
async function evalIfExpression(ie, env) {
    const condition = await Eval(ie.condition, env);
    if (isError(condition)) {
        return condition;
    }
    if (isTruthy(condition)) {
        return await Eval(ie.consequence, env);
    } else if (ie.alternative !== null) {
        return await Eval(ie.alternative, env);
    } else {
        return SingleObjectInstance.VOID;
    }
}

/**
 * 解析while表达式
 * @param {WhileExpression} we if表达式
 * @param {Environment} env 上下文环境
 * @returns {BaseObject}
 */
async function evalWhileExpression(ie, env) {
    while (true) {
        const condition = await Eval(ie.condition, env);
        if (isError(condition)) {
            return condition;
        }
        if (isTruthy(condition)) {
            const result = await Eval(ie.consequence, env);
            if (isReturnValue(result)) {
                return unwrapReturnValue(result);
            }
            await new Promise(resolve => setImmediate(resolve));
        } else {
            return SingleObjectInstance.VOID;
        }
    }
}

/**
 * 解析标识符
 * @param {Identifier} node if表达式
 * @param {Environment} env 上下文环境
 * @returns {BaseObject}
 */
function evalIdentifier(node, env) {
    const val = env.get(node.value);

    if (val) {
        return val;
    }

    const builtin = builtins[node.value];

    if (builtin) {
        return builtin;
    }

    return SingleObjectInstance.UNDEFINED;
}

/**
 * 解析表达式语句
 * @param {Expression[]} exps 表达式语句
 * @param {Environment} env 上下文环境
 * @returns {BaseObject[]}
 */
export async function evalExpressions(exps, env) {
    const results = [];
    for (const exp of exps) {
        const evaluated = await Eval(exp, env);
        if (isError(evaluated)) {
            return [evaluated];
        }
        results.push(evaluated);
    }
    return results;
}

/**
 * 调用函数
 * @param {BaseObject} func 函数对象
 * @param {BaseObject[]} args 实参
 * @returns {BaseObject}
 */
export async function applyFunction(func, args) {
    if (func instanceof FunctionObject) {
        const extendEnv = extendFunctionEnv(func, args);
        const evaluated = await Eval(func.body, extendEnv);
        return unwrapReturnValue(evaluated);
    } else if (func instanceof BuiltinObject) {
        return func.fn(args);
    }
    return newError(`not a function: ${func.Type()}`);
}

/**
 * 索引表达式求值
 * @param {BaseObject} left 要求值的含索引表达式
 * @param {BaseObject} index 索引值
 * @returns {BaseObject}
 */
function evalIndexExpression(left, index) {
    if (left instanceof ArrayObject && index instanceof IntegerObj) {
        return evalArrayIndexExpression(left, index);
    } else {
        return newError(`index operator not supported: ${left.Type()}`);
    }
}

/**
 * 数组索引表达式求值
 * @param {ArrayObject} left 要求值的含索引表达式
 * @param {IntegerObj} index 索引值
 * @returns {BaseObject}
 */
function evalArrayIndexExpression(left, index) {
    const arrayObject = left;
    const idx = index.value;
    const max = arrayObject.elements.length - 1;
    if (idx < 0 || idx > max) {
        return SingleObjectInstance.NULL;
    }
    return arrayObject.elements[idx];
}

/**
 * 拓展函数环境，绑定形参和实参
 * @param {FunctionObject} func 函数对象
 * @param {BaseObject[]} args 实参
 * @returns {Environment}
 */
function extendFunctionEnv(func, args) {
    const env = newEnclosedEnvironment(func.env);
    func.parameters.forEach((param, paramInx) => {
        env.set(param.value, args[paramInx]);
    });
    return env;
}

/**
 * 是否是返回值对象
 * @param {BaseObject} object 要接包的对象
 * @returns {boolean}
 */
function isReturnValue(obj) {
    return obj?.Type() === ObjectType.RETURN_VALUE_OBJ;
}

/**
 * 解包返回值
 * @param {BaseObject} object 要接包的对象
 * @returns {BaseObject}
 */
export function unwrapReturnValue(object) {
    if (object instanceof ReturnValueObject) {
        return object.value;
    }
    return object;
}

/**
 * 判断给定的解析后对象是否为“真”语义
 * @param {BaseObject} obj 要判断的解析后对象
 * @returns {IntegerObj}
 */
function isTruthy(obj) {
    switch (obj) {
        case SingleObjectInstance.NULL:
            return false;
        case SingleObjectInstance.FALSE:
            return false;
        case SingleObjectInstance.TRUE:
            return true;
        default:
            return true;
    }
}
