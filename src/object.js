// src/object.js
/**
 * Monkey 对象系统（Object System）
 * 支持 INTEGER、BOOLEAN、NULL 三种基本类型。
 */

import { BlockStatement, Identifier, Statement } from './ast.js';
import { Environment } from './environment.js';

/**
 * ObjectType 常量表
 * 与 TokenTypes 设计风格保持一致。
 */
export const ObjectType = {
    INTEGER_OBJ: 'INTEGER',
    STRING_OBJ: 'STRING',
    BOOLEAN_OBJ: 'BOOLEAN',
    NULL_OBJ: 'NULL',
    RETURN_VALUE_OBJ: 'RETURN_VALUE',
    ERROR_OBJ: 'ERROR',
    FUNCTION_OBJ: 'FUNCTION',
    BUILTIN_OBJ: 'BUILTIN',
    ARRAY_OBJ: 'ARRAY',
    VOID_OBJ: 'VOID',
    UNDEFINED_OBJ: 'UNDEFINED',
};

/**
 * 所有运行时对象的基类。
 */
export class BaseObject {
    /**
     * @returns {string} 对象类型，来自 ObjectType 常量表
     */
    Type() {
        throw new Error('Type() must be implemented by subclass');
    }

    /**
     * @returns {string} 对象的可打印字符串形式
     */
    Inspect() {
        throw new Error('Inspect() must be implemented by subclass');
    }
}

/**
 * 整数对象
 */
export class IntegerObj extends BaseObject {
    /**
     * @param {number} value
     */
    constructor(value) {
        super();
        this.value = value;
    }

    Type() {
        return ObjectType.INTEGER_OBJ;
    }

    Inspect() {
        return String(this.value);
    }
}
/**
 * 字符串对象
 */
export class StringObj extends BaseObject {
    /**
     * @param {string} value
     */
    constructor(value) {
        super();
        this.value = value;
    }

    Type() {
        return ObjectType.STRING_OBJ;
    }

    Inspect() {
        return String(this.value);
    }
}

/**
 * 布尔对象
 */
export class BooleanObj extends BaseObject {
    /**
     * @param {boolean} value
     */
    constructor(value) {
        super();
        this.value = value;
    }

    Type() {
        return ObjectType.BOOLEAN_OBJ;
    }

    Inspect() {
        return String(this.value);
    }
}

/**
 * 空对象（Null）
 */
export class NullObject extends BaseObject {
    Type() {
        return ObjectType.NULL_OBJ;
    }

    Inspect() {
        return 'null';
    }
}

/**
 * 无效对象(void)
 */
export class VoidObject extends BaseObject {
    constructor() {
        super();
    }
    Type() {
        return ObjectType.VOID_OBJ;
    }

    Inspect() {
        return 'void';
    }
}

/**
 * 未定义对象(undefined)
 */
export class UndefinedObject extends BaseObject {
    constructor() {
        super();
    }
    Type() {
        return ObjectType.UNDEFINED_OBJ;
    }

    Inspect() {
        return 'undefined';
    }
}

/**
 * 返回值
 */
export class ReturnValueObject extends BaseObject {
    /**
     * @constructor
     * @param {BaseObject} value 返回的值，可以是任意BaseObject实例
     */
    constructor(value) {
        super();
        this.value = value;
    }
    Type() {
        return ObjectType.RETURN_VALUE_OBJ;
    }

    Inspect() {
        return this.value.Inspect();
    }
}

/**
 * 函数
 */
export class FunctionObject extends BaseObject {
    /**
     * @constructor
     * @param {Identifier[]} parameters 参数列表
     * @param {BlockStatement} body 函数体
     * @param {Environment} env 函数体
     */
    constructor(parameters, body, env) {
        super();
        this.parameters = parameters;
        this.body = body;
        this.env = env;
    }
    Type() {
        return ObjectType.FUNCTION_OBJ;
    }

    Inspect() {
        let out = `fn(${(this.params || []).join(', ')}){\n${this.body.toString()}\n}`;
        return out;
    }
}

/**
 * @typedef {(...args:BaseObject[]) => BaseObject} BuiltinFunction
 */

/**
 * 内置函数
 */
export class BuiltinObject extends BaseObject {
    /**
     * @constructor
     * @param {BuiltinFunction} fn 参数列表
     */
    constructor(fn) {
        super();
        /**
         * @type {BuiltinFunction}
         */
        this.fn = fn;
    }
    Type() {
        return ObjectType.FUNCTION_OBJ;
    }

    Inspect() {
        let out = `fn(${(this.params || []).join(', ')}){\n${this.body.toString()}\n}`;
        return out;
    }
}

/**
 * 数组
 */
export class ArrayObject extends BaseObject {
    /**
     * @constructor
     * @param {BaseObject[]} elements 元素列表
     */
    constructor(elements) {
        super();
        this.elements = elements;
    }
    Type() {
        return ObjectType.ARRAY_OBJ;
    }

    Inspect() {
        let out = `[${this.elements.map(el => el.Inspect()).join(', ')}]`;
        return out;
    }
}

/**
 * 错误处理
 */
export class ErrorObject extends BaseObject {
    /**
     * @constructor
     * @param {string} value
     */
    constructor(value) {
        super();
        this.message = value;
    }
    Type() {
        return ObjectType.ERROR_OBJ;
    }

    Inspect() {
        return 'ERROR: ' + this.message;
    }
}
