// ast/ast.js

import { TokenTypes } from './token.js';

/**
 * @typedef {object} Token
 * @property {string} type
 * @property {string} literal
 */

/**
 * 表示完整程序的根节点
 */
export default class Program {
    constructor() {
        /** @type {Statement[]} */
        this.statements = [];
    }

    /**
     * 返回程序中第一个语句的 token 字面量
     * @returns {string}
     */
    tokenLiteral() {
        return this.statements.length > 0 ? this.statements[0].tokenLiteral() : '';
    }

    /**
     * 返回整个程序的字符串表示（用于调试 AST）
     * @returns {string}
     */
    toString() {
        return this.statements.map(s => s.toString()).join('');
    }
}

/**
 * 表示所有 AST 节点的基类接口
 * @interface
 */
export class Node {
    /**
     * 返回该节点的 token literal（用于调试）
     * @returns {string}
     */
    tokenLiteral() {
        throw new Error('tokenLiteral() must be implemented');
    }
    /**
     * 返回该节点的字符串形式（用于调试或打印 AST）
     * @returns {string}
     */
    toString() {
        throw new Error('toString() must be implemented');
    }
}

/**
 * 表示语句的接口（如 let 声明）
 * @interface
 * @extends Node
 */
export class Statement extends Node {
    statementNode() {
        throw new Error('statementNode() must be implemented');
    }
}

/**
 * 表示表达式的接口（如变量名、1+1）
 * @interface
 * @extends Node
 */
export class Expression extends Node {
    expressionNode() {
        throw new Error('expressionNode() must be implemented');
    }
}

/**
 * 表示一个变量声明语句（如 let x = 5;）
 * @extends Statement
 */
export class LetStatement extends Statement {
    /**
     * 创建 LetStatement 节点
     * @param {Token} token - 表示 'let' 的 token
     * @param {Identifier} name - 变量名
     * @param {Expression} value - 表达式（变量的值）
     */
    constructor(token, name, value) {
        super();
        this.token = token; // 一般是 { type: 'LET', literal: 'let' }
        this.name = name; // Identifier 类型
        this.value = value; // Expression 类型（可以是 Literal、Identifier 等）
    }

    /**
     * 标识此为语句节点
     */
    statementNode() {}

    /**
     * 返回该语句的 token 字面量（'let'）
     * @returns {string}
     */
    tokenLiteral() {
        return this.token.literal;
    }

    toString() {
        let out = '';

        out += this.tokenLiteral() + ' ';
        out += this.name.toString();
        out += ' = ';

        if (this.value) {
            out += this.value.toString();
        }

        out += ';';

        return out;
    }
}

/**
 * 赋值语句：a = 1;
 * @extends Statement
 */
export class AssignStatement extends Statement {
    /**
     * @param {Token} token - 当前 token，通常是标识符 token
     * @param {Identifier} name - 左侧标识符
     * @param {Expression} value - 右侧表达式
     */
    constructor(token, name, value = null) {
        super();
        this.token = token;
        this.name = name;
        this.value = value;
    }

    statementNode() {}

    tokenLiteral() {
        return this.token.literal;
    }

    toString() {
        let out = '';
        out += this.name.toString();
        out += ' = ';
        if (this.value) {
            out += this.value.toString();
        }
        out += ';';
        return out;
    }
}

/**
 * 表示一个标识符（变量名等，如 x、y、result）
 * @extends Expression
 */
export class Identifier extends Expression {
    /**
     * 创建一个标识符节点
     * @param {Token} token - 一般是 { type: 'IDENT', literal: 'x' }
     * @param {string} value - 变量名（如 "x"）
     */
    constructor(token, value) {
        super();
        this.token = token;
        this.value = value;
    }

    /**
     * 标识此为表达式节点
     */
    expressionNode() {}

    /**
     * 返回该标识符的原始字面量（变量名）
     * @returns {string}
     */
    tokenLiteral() {
        return `${this.token.literal}`;
    }

    toString() {
        return this.value;
    }
}

/**
 * 表示 return 语句
 */
export class ReturnStatement {
    /**
     * @param {Token} token - 'return' 词法单元
     * @param {Expression|null} returnValue - 返回的表达式
     */
    constructor(token, returnValue = null) {
        this.token = token;
        this.returnValue = returnValue;
    }

    /**
     * 表示这是一个语句节点（空方法，用于类型标识）
     */
    statementNode() {}

    /**
     * 返回 token 的字面量
     * @returns {string}
     */
    tokenLiteral() {
        return this.token.literal;
    }

    toString() {
        let out = '';

        out += this.tokenLiteral() + ' ';

        if (this.returnValue) {
            out += this.returnValue.toString();
        }

        out += ';';

        return out;
    }
}

/**
 * 表达式语句（statement）类。
 * 每条语句其实就是一个表达式（如 `x + 10;`）。
 */
export class ExpressionStatement {
    /**
     * @param {Token} token - 该语句中的第一个词法单元
     */
    constructor(token) {
        /** @type {Token} */
        this.token = token;

        /** @type {Expression | null} */
        this.expression = null;
    }

    /**
     * 返回该语句的 token 的字面量，用于调试输出。
     * @returns {string}
     */
    tokenLiteral() {
        return this.token.literal;
    }

    /**
     * 为了统一接口，表示这是一个语句（Statement）。
     * 没有实际用途，只为兼容结构。
     */
    statementNode() {}

    toString() {
        if (this.expression) {
            return this.expression.toString();
        }
        return '';
    }
}

export class IntegerLiteral {
    /**
     * @param {Token} token
     */
    constructor(token) {
        /** @type {Token} */
        this.token = token;

        /** @type {number} */
        this.value = 0; // 默认值，后续由解析器设置
    }

    /**
     * 返回该表达式对应的词法字面量（例如 "5"）
     * @returns {string}
     */
    tokenLiteral() {
        return this.token.literal;
    }

    /**
     * 将该节点转换为代码字符串表示（如 "5"）
     * @returns {string}
     */
    toString() {
        return this.token.literal;
    }
}
export class StringLiteral {
    /**
     * @param {Token} token
     */
    constructor(token) {
        /** @type {Token} */
        this.token = token;

        /** @type {string} */
        this.value = ''; // 默认值，后续由解析器设置
    }

    /**
     * 返回该表达式对应的词法字面量（例如 "hello world"）
     * @returns {string}
     */
    tokenLiteral() {
        return this.token.literal;
    }

    /**
     * 将该节点转换为代码字符串表示（如 "hello world"）
     * @returns {string}
     */
    toString() {
        return this.token.literal;
    }
}

/**
 * 表示前缀表达式节点，如 `!5` 或 `-x`
 */
export class PrefixExpression {
    /**
     * @param {Token} token 前缀运算符的词法单元（如 '!'）
     * @param {string} operator 运算符本身（如 '!' 或 '-'）
     * @param {Expression} right 运算符右侧的表达式
     */
    constructor(token, operator, right = null) {
        this.token = token;
        this.operator = operator;
        this.right = right;
    }

    /** @returns {string} 返回词法单元字面量（如 '!'） */
    tokenLiteral() {
        return this.token.literal;
    }

    /** @returns {string} 还原表达式源码字符串，如 `(!5)` */
    toString() {
        return `(${this.operator}${this.right?.toString() ?? ''})`;
    }
}

/**
 * 表示一个中缀表达式节点，如 "5 + 5"
 */
export class InfixExpression extends Expression {
    /**
     * @param {Token} token - 运算符的词法单元（如 "+"）
     * @param {Expression} left - 左操作数表达式
     * @param {string} operator - 运算符字符串（如 "+"）
     * @param {Expression} right - 右操作数表达式
     */
    constructor(token, left, operator, right) {
        super();
        this.token = token;
        this.left = left;
        this.operator = operator;
        this.right = right;
    }

    expressionNode() {}

    tokenLiteral() {
        return this.token.literal;
    }

    toString() {
        return `(${this.left.toString()} ${this.operator} ${this.right.toString()})`;
    }
}

/**
 * 表示布尔值字面量的 AST 节点（如 true/false）
 * @extends Expression
 */
export class BooleanLiteral {
    /**
     * 创建布尔值节点
     * @param {Token} token - 布尔值的 token（类型应为 'TRUE' 或 'FALSE'）
     * @param {boolean} value - 布尔值
     */
    constructor(token, value) {
        this.token = token;
        this.value = value;
    }

    /**
     * 标识此为表达式节点
     */
    expressionNode() {}

    /**
     * 返回 token 的字面量（'true' 或 'false'）
     * @returns {string}
     */
    tokenLiteral() {
        return this.token.literal;
    }

    /**
     * 返回布尔值的字符串表示（'true' 或 'false'）
     * @returns {string}
     */
    toString() {
        return this.token.literal;
    }
}

/**
 * if 条件表达式节点
 * @extends Expression
 */
export class IfExpression extends Expression {
    /**
     * 创建 if 表达式节点
     * @param {Token} token - 'if' 关键词的 token
     * @param {Expression} condition - 条件表达式
     * @param {BlockStatement} consequence - 条件为真时的语句块
     * @param {BlockStatement | null} alternative - else 语句块（可选）
     */
    constructor(token, condition, consequence, alternative = null) {
        super();
        this.token = token;
        this.condition = condition;
        this.consequence = consequence;
        this.alternative = alternative;
    }

    /**
     * 标识此为表达式节点
     */
    expressionNode() {}

    /**
     * 返回 if 关键词的字面量
     * @returns {string}
     */
    tokenLiteral() {
        return this.token.literal;
    }

    /**
     * 返回 if 表达式的字符串表示
     * @returns {string}
     */
    toString() {
        let out = `if${this.condition.toString()}{${this.consequence.toString()}}`;

        if (this.alternative !== null) {
            out += `else${this.alternative.toString()}`;
        }

        return out;
    }
}

/**
 * while循环 表达式节点
 * @extends Expression
 */
export class WhileExpression extends Expression {
    /**
     * 创建 while 表达式节点
     * @param {Token} token - 'while' 关键词的 token
     * @param {Expression} condition - 条件表达式
     * @param {BlockStatement} consequence - 条件为真时的语句块
     */
    constructor(token, condition, consequence) {
        super();
        this.token = token;
        this.condition = condition;
        this.consequence = consequence;
    }

    /**
     * 标识此为表达式节点
     */
    expressionNode() {}

    /**
     * 返回 while 关键词的字面量
     * @returns {string}
     */
    tokenLiteral() {
        return this.token.literal;
    }

    /**
     * 返回 while 表达式的字符串表示
     * @returns {string}
     */
    toString() {
        let out = `while${this.condition.toString()}{${this.consequence.toString()}}`;
        return out;
    }
}

/**
 * 语句块节点
 * @extends Statement
 */
export class BlockStatement extends Statement {
    /**
     * 创建语句块节点
     * @param {Token} token - '{' 词法单元
     */
    constructor(token) {
        super();
        this.token = token;
        /** @type {Statement[]} */
        this.statements = [];
    }

    /**
     * 标识此为语句节点
     */
    statementNode() {}

    /**
     * 返回语句块的 token 字面量
     * @returns {string}
     */
    tokenLiteral() {
        return this.token.literal;
    }

    /**
     * 返回语句块的字符串表示
     * @returns {string}
     */
    toString() {
        let out = '';
        out += this.statements.map(s => s.toString()).join('');
        return out;
    }
}

export class FunctionLiteral extends Expression {
    /**
     * 创建 fn 表达式节点
     * @param {Token} token - fn 关键词的 token
     * @param {Identifier[]} params - 函数参数
     * @param {BlockStatement} body - 函数块
     */
    constructor(token, params, body) {
        super();
        this.token = token;
        this.params = params;
        this.body = body;
    }

    /**
     * 标识此为表达式节点
     */
    expressionNode() {}

    /**
     * 返回 fn 关键词的字面量
     * @returns {string}
     */
    tokenLiteral() {
        return this.token.literal;
    }

    /**
     * 返回 fn 表达式的字符串表示
     * @returns {string}
     */
    toString() {
        let out = `${this.tokenLiteral()} (${this.params.join(',')})\n`;
        if (this.body !== null) {
            out += `${this.body.toString()}`;
        }
        return out;
    }
}

/**
 * Call Expression
 * @extends Expression
 */
export class CallExpression extends Expression {
    /**
     * 创建 fn 表达式节点
     * @param {Token} token - fn 关键词的 token
     * @param {Expression} func - 要调用的函数
     * @param {Expression[]} args - 传入给函数的实参
     */
    constructor(token, func, args) {
        super();
        this.token = token;
        this.function = func;
        this.arguments = args;
    }

    /**
     * 标识此为表达式节点
     */
    expressionNode() {}

    /**
     * 返回 call 的字面量
     * @returns {string}
     */
    tokenLiteral() {
        return this.token.literal;
    }

    /**
     * 返回 call 表达式的字符串表示
     * @returns {string}
     */
    toString() {
        let out = `${this.function.toString()}(${this.arguments.join(', ')})`;
        return out;
    }
}

/**
 * 数组
 * @extends Expression
 */
export class ArrayLiteral extends Expression {
    /**
     * 创建 array 表达式节点
     * @param {Token} token - array 关键词的 token
     * @param {Expression[]} elements - 数组里的元素
     */
    constructor(token, elements) {
        super();
        this.token = token;
        this.elements = elements;
    }

    /**
     * 标识此为表达式节点
     */
    expressionNode() {}

    /**
     * 返回 call 的字面量
     * @returns {string}
     */
    tokenLiteral() {
        return this.token.literal;
    }

    /**
     * 返回 call 表达式的字符串表示
     * @returns {string}
     */
    toString() {
        let out = `[${this.elements.join(', ')}]`;
        return out;
    }
}
/**
 * 索引表达式
 * @extends Expression
 */
export class IndexExpression extends Expression {
    /**
     * 创建 index 表达式节点
     * @param {Token} token - index的token
     * @param {Expression} left - 要求值的表达式
     * @param {Expression} index 表示索引的表达式
     */
    constructor(token, left, index) {
        super();
        this.token = token;
        this.left = left;
        this.index = index;
    }

    /**
     * 标识此为表达式节点
     */
    expressionNode() {}

    /**
     * 返回 call 的字面量
     * @returns {string}
     */
    tokenLiteral() {
        return this.token.literal;
    }

    /**
     * 返回 call 表达式的字符串表示
     * @returns {string}
     */
    toString() {
        let out = `(${this.left.toString()}[${this.index.toString()}])`;
        return out;
    }
}
