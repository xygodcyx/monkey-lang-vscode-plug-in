import PromptSync from 'prompt-sync';

import { newEnvironment } from './environment.js';
import Eval, {
    applyFunction,
    evalExpressions,
    newError,
    SingleObjectInstance,
    unwrapReturnValue,
} from './evaluator.js';
import {
    ArrayObject,
    BaseObject,
    BooleanObj,
    BuiltinObject,
    FunctionObject,
    IntegerObj,
    StringObj,
} from './object.js';
import { rl } from './repl.js';

const prompt = PromptSync();

export const builtins = {
    len: new BuiltinObject(builtinLen),
    time: new BuiltinObject(builtinTime),
    str: new BuiltinObject(builtinStr),
    int: new BuiltinObject(builtinInt),
    interval: new BuiltinObject(builtinInterval),
    clearInterval: new BuiltinObject(builtinClearInterval),
    print: new BuiltinObject(builtinPrint),
    push_arr: new BuiltinObject(builtinPushArr),
    pop_arr: new BuiltinObject(builtinPopArr),
    each: new BuiltinObject(builtinEach),
    input: new BuiltinObject(builtinInput),
};

/**
 * 返回传入函数length,支持深度求值
 * @param {BaseObject[]} args 参数列表
 * @param {BooleanObj} deep 是否深度求值(仅支持数组)
 * @returns {BaseObject} 返回的对象
 */
function builtinLen(args) {
    if (args.length !== 1 && args.length !== 2) {
        return newError(`wrong number of arguments. got=${args.length}, want=1 || 2`);
    }
    const obj = args[0];
    const deep = args[1] || SingleObjectInstance.FALSE;
    if (!(deep instanceof BooleanObj)) {
        return newError(`argument to len[deep] not supported, got ${deep.Type()}`);
    }
    if (obj instanceof StringObj) {
        return new IntegerObj(obj.value.length);
    } else if (obj instanceof ArrayObject) {
        if (deep.value) {
            return new IntegerObj(calcDeepLen(obj));
        } else {
            return new IntegerObj(obj.elements.length);
        }
    } else {
        return newError(`argument to len[obj] not supported, got ${obj.Type()}`);
    }
}

/**
 * 计算多维数组的长度
 * @param {ArrayObject} array 数组对象
 * @returns {number} 数组对象的长度
 */
function calcDeepLen(array, len = 0) {
    len += array.elements.length;
    array.elements.forEach(element => {
        if (element instanceof ArrayObject) {
            len = calcDeepLen(element, len);
        }
    });
    return len;
}

/**
 * 返回当前日期的时间戳
 * @param {BaseObject[]} args 参数列表
 * @returns {BaseObject} 返回的对象
 */
function builtinTime(args) {
    const date = new Date();
    let time = date.getTime();

    switch (args.length) {
        case 0:
            time = date.getTime();
            break;
        case 1:
            const flag = args[0];
            if (!(flag instanceof StringObj)) {
                return newError(`argument to time[flag] not supported, got ${flag.Type()}`);
            }
            switch (flag.value) {
                case 'year':
                    time = date.getFullYear();
                    break;
                case 'month':
                    time = date.getMonth();
                    break;
                case 'day':
                    time = date.getDate();
                    break;
                case 'week':
                    time = date.getDay();
                    break;
                case 'hour':
                    time = date.getHours();
                    break;
                case 'minute':
                    time = date.getMinutes();
                    break;
                case 'second':
                    time = date.getSeconds();
                    break;
            }
            break;

        default:
            return newError(`wrong number of arguments. got=${args.length}, want=0 || 1`);
    }

    return new IntegerObj(time);
}

/**
 * 将给定的任意对象转为字符类型
 * @param {BaseObject[]} args 参数列表
 * @returns {BaseObject} 返回的对象
 */
function builtinStr(args) {
    if (args.length !== 1) {
        return newError(`wrong number of arguments. got=${args.length}, want=1`);
    }
    const obj = args[0];
    return new StringObj(obj.value);
}

/**
 * 将给定的字符对象转为字符类型
 * @param {BaseObject[]} args 参数列表
 * @returns {BaseObject} 返回的对象
 */
function builtinInt(args) {
    if (args.length !== 1) {
        return newError(`wrong number of arguments. got=${args.length}, want=1`);
    }
    const obj = args[0];
    if (!(obj instanceof StringObj) && !(obj instanceof IntegerObj)) {
        return newError(`argument to interval[str] not supported, got ${obj.Type()}`);
    }
    const n = parseInt(obj.value);
    console.log(n)
    if (isNaN(n)) return new newError('invalid int');
    return new IntegerObj(n);
}

/**
 * 定时执行传入的函数
 * @param {BaseObject[]} args 参数列表
 * @returns {number} 定时器id
 */
function builtinInterval(args) {
    switch (args.length) {
        case 3:
        // parameters
        case 2:
        // timeout
        case 1:
            const parameters = args[2] || [];
            const timeout = (args[1] || new IntegerObj(0)).value;
            const obj = args[0];
            if (!(obj instanceof FunctionObject || obj instanceof BuiltinObject)) {
                return newError(`argument to interval[func] not supported, got ${obj.Type()}`);
            }
            run();
            function run() {
                if (obj instanceof FunctionObject) {
                    const val = applyFunction(obj, parameters);
                    if (val.value) {
                        console.log(val.value);
                    } else {
                        console.log(val);
                    }
                } else if (obj instanceof BuiltinObject) {
                    const val = applyFunction(obj, parameters);
                    if (val.value) {
                        console.log(val.value);
                    } else {
                        console.log(val);
                    }
                }
            }
            const id = setInterval(run, timeout);
            return new IntegerObj(id);
        default:
            return newError(`wrong number of arguments. got=${args.length}, want=1 || 2`);
    }
}

/**
 * 定时执行传入的函数
 * @param {BaseObject[]} args 参数列表
 */
function builtinClearInterval(args) {
    if (args.length !== 1) {
        return newError(`wrong number of arguments. got=${args.length}, want=1`);
    }
    const obj = args[0];
    if (!(obj instanceof IntegerObj)) {
        return newError(`argument to clearInterval[id] not supported, got ${obj.Type()}`);
    }
    clearInterval(obj.value);
}

/**
 * 输出函数
 * @param {BaseObject[]} args 参数列表
 */
function builtinPrint(args) {
    console.log(...args.map(arg => arg.Inspect()));
    return SingleObjectInstance.VOID;
}

/**
 * 数组push函数
 * @param {BaseObject[]} args 参数列表
 */
function builtinPushArr(args) {
    if (args.length < 2) {
        return newError(`wrong number of arguments. got=${args.length}, want less 2`);
    }
    const obj = args[0];
    const pushElements = args.slice(1);
    if (!(obj instanceof ArrayObject)) {
        return newError(`argument to push[arr] not supported, got ${obj.Type()}`);
    }
    obj.elements.push(...pushElements);
    return pushElements.length === 1 ? pushElements[0] : new ArrayObject(pushElements);
}

/**
 * 数组pop函数
 * @param {BaseObject[]} args 参数列表
 */
function builtinPopArr(args) {
    if (args.length !== 1) {
        return newError(`wrong number of arguments. got=${args.length}, want = 1`);
    }
    const obj = args[0];
    if (!(obj instanceof ArrayObject)) {
        return newError(`argument to pop[arr] not supported, got ${obj.Type()}`);
    }
    return obj.elements.pop();
}

/**
 * 数组each函数
 * @param {BaseObject[]} args 参数列表
 */
function builtinEach(args) {
    if (args.length !== 2) {
        return newError(`wrong number of arguments. got=${args.length}, want = 2`);
    }
    const obj = args[0];
    if (!(obj instanceof ArrayObject)) {
        return newError(`argument to each[arr] not supported, got ${obj.Type()}`);
    }
    const eachFn = args[1];
    if (!(eachFn instanceof FunctionObject)) {
        return newError(`argument to each[func] not supported, got ${eachFn.Type()}`);
    }
    obj.elements.forEach((element, i, elements) => {
        applyFunction(eachFn, [element, new IntegerObj(i), new ArrayObject(elements)]);
    });
    return SingleObjectInstance.VOID;
}

/**
 * 从控制台读取一行输入
 * @param {BaseObject[]} args 参数列表
 * @returns {BaseObject} 返回字符串对象
 */
async function builtinInput(args) {
    let pendingInputResolve = null;
    if (args.length > 1) {
        return newError(`wrong number of arguments. got=${args.length}, want <= 1`);
    }
    const text = args[0]?.value || 'User Input: ';
    return new Promise(resolve => {
        pendingInputResolve = userInput => {
            pendingInputResolve = null;
            resolve(new StringObj(+userInput));
        };
        rl.question(text, answer => {
            if (pendingInputResolve) {
                pendingInputResolve(answer);
            }
        });
    });
}
