// parser.js

/**
 * @typedef {( ) => Expression} PrefixParseFn
 * @typedef {(left: Expression) => Expression} InfixParseFn
 */

import Token from './token.js';
import { TokenTypes } from './token.js';

import Program, {
    LetStatement,
    Identifier,
    Statement,
    ReturnStatement,
    ExpressionStatement,
    Expression,
    IntegerLiteral,
    PrefixExpression,
    InfixExpression,
    BooleanLiteral,
    IfExpression,
    BlockStatement,
    FunctionLiteral,
    CallExpression,
    AssignStatement,
    StringLiteral,
    ArrayLiteral,
    IndexExpression,
    WhileExpression,
} from './ast.js';
import Lexer from './lexer.js';
import { newError } from './evaluator.js';

const PrecedencesInt = {
    LOWEST: 1,
    EQUALS: 2,
    LESS_GREATER: 3,
    SUM: 4,
    PRODUCT: 5,
    PREFIX: 6,
    CALL: 7,
    INDEX: 8,
};

export const precedences = {
    // [TokenTypes.ASSIGN]: PrecedencesInt.ASSIGN,
    [TokenTypes.EQ]: PrecedencesInt.EQUALS,
    [TokenTypes.NOT_EQ]: PrecedencesInt.EQUALS,
    [TokenTypes.LT]: PrecedencesInt.LESS_GREATER,
    [TokenTypes.GT]: PrecedencesInt.LESS_GREATER,
    [TokenTypes.PLUS]: PrecedencesInt.SUM,
    [TokenTypes.MINUS]: PrecedencesInt.SUM,
    [TokenTypes.SLASH]: PrecedencesInt.PRODUCT,
    [TokenTypes.ASTERISK]: PrecedencesInt.PRODUCT,
    [TokenTypes.LPAREN]: PrecedencesInt.CALL,
    [TokenTypes.LBRACKET]: PrecedencesInt.INDEX,
};
/**
 * 解析器 Parser 类
 */
export default class Parser {
    /**
     * @param {Lexer} lexer - 词法分析器实例
     */
    constructor(lexer) {
        this.lexer = lexer;

        /** @type {Token} */
        this.curToken = null;

        /** @type {Token} */
        this.peekToken = null;

        /** @type {string[]} */
        this.errors = [];

        // 前缀与中缀函数映射表
        /** @type {Object<string, PrefixParseFn>} */
        this.prefixParseFns = {};

        /** @type {Object<string, InfixParseFn>} */
        this.infixParseFns = {};

        this.nextToken();
        this.nextToken();

        // 注册前缀解析函数
        this.registerPrefix(TokenTypes.IDENT, this.parseIdentifier.bind(this));
        this.registerPrefix(TokenTypes.INT, this.parseIntegerLiteral.bind(this));
        this.registerPrefix(TokenTypes.STRING, this.parseStringLiteral.bind(this));
        this.registerPrefix(TokenTypes.TRUE, this.parseBoolean.bind(this));
        this.registerPrefix(TokenTypes.FALSE, this.parseBoolean.bind(this));

        this.registerPrefix(TokenTypes.BANG, this.parsePrefixExpression.bind(this));

        this.registerPrefix(TokenTypes.MINUS, this.parsePrefixExpression.bind(this));

        this.registerPrefix(TokenTypes.LPAREN, this.parseGroupedExpression.bind(this));

        this.registerPrefix(TokenTypes.LBRACKET, this.parseArrayLiteral.bind(this));

        this.registerPrefix(TokenTypes.IF, this.parseIfExpression.bind(this));
        this.registerPrefix(TokenTypes.WHILE, this.parseWhileExpression.bind(this));

        this.registerPrefix(TokenTypes.FUNCTION, this.parseFunctionLiteral.bind(this));

        // 注册中缀解析函数
        this.registerInfix(TokenTypes.PLUS, this.parseInfixExpression.bind(this));
        this.registerInfix(TokenTypes.MINUS, this.parseInfixExpression.bind(this));
        this.registerInfix(TokenTypes.SLASH, this.parseInfixExpression.bind(this));
        this.registerInfix(TokenTypes.ASTERISK, this.parseInfixExpression.bind(this));
        this.registerInfix(TokenTypes.EQ, this.parseInfixExpression.bind(this));
        this.registerInfix(TokenTypes.NOT_EQ, this.parseInfixExpression.bind(this));
        this.registerInfix(TokenTypes.LT, this.parseInfixExpression.bind(this));
        this.registerInfix(TokenTypes.GT, this.parseInfixExpression.bind(this));

        this.registerInfix(TokenTypes.LPAREN, this.parseCallExpression.bind(this));
        this.registerInfix(TokenTypes.LBRACKET, this.parseIndexExpression.bind(this));
    }

    /**
     * 注册前缀解析函数
     * @param {string} tokenType
     * @param {PrefixParseFn} fn
     */
    registerPrefix(tokenType, fn) {
        this.prefixParseFns[tokenType] = fn;
    }

    /**
     * 注册中缀解析函数
     * @param {string} tokenType
     * @param {InfixParseFn} fn
     */
    registerInfix(tokenType, fn) {
        this.infixParseFns[tokenType] = fn;
    }

    /**
     * 查看下一个 token 的优先级
     * @returns {number}
     */
    peekPrecedence() {
        return precedences[this.peekToken.type] ?? PrecedencesInt.LOWEST;
    }

    /**
     * 获取当前 token 的优先级
     * @returns {number}
     */
    curPrecedence() {
        return precedences[this.curToken.type] ?? PrecedencesInt.LOWEST;
    }

    /**
     * 返回收集到的所有错误
     * @returns {string[]}
     */
    Errors() {
        return this.errors;
    }

    /**
     * 添加一个 peek 错误消息
     * @param {string} expectedType
     */
    peekError(expectedType) {
        const msg = `expected next token to be ${expectedType}, got ${this.peekToken.type} instead`;
        this.errors.push(msg);
    }

    /**
     * 获取下一个 token，更新当前和下一个 token
     */
    nextToken() {
        this.curToken = this.peekToken;
        this.peekToken = this.lexer.nextToken();
    }

    /**
     * 解析程序主入口
     * @returns {Program}
     */
    parseProgram() {
        const program = new Program();
        program.statements = [];

        while (this.curToken.type !== TokenTypes.EOF) {
            const stmt = this.parseStatement();
            if (stmt !== null) {
                program.statements.push(stmt);
            }
            this.nextToken();
        }

        return program;
    }

    /**
     * 根据当前 token 类型解析语句
     * @returns {Statement | null}
     */
    parseStatement() {
        // 如果当前是标识符并且下一个是 ASSIGN，则解析赋值语句
        if (this.curToken.type === TokenTypes.IDENT && this.peekTokenIs(TokenTypes.ASSIGN)) {
            return this.parseAssignStatement();
        }

        switch (this.curToken.type) {
            case TokenTypes.LET:
                return this.parseLetStatement();
            case TokenTypes.RETURN:
                return this.parseReturnStatement();
            default:
                return this.parseExpressionStatement();
        }
    }

    /**
     * 解析表达式语句
     * @returns {ExpressionStatement}
     */
    parseExpressionStatement() {
        const stmt = new ExpressionStatement(this.curToken);

        stmt.expression = this.parseExpression(PrecedencesInt.LOWEST);

        if (this.peekTokenIs(TokenTypes.SEMICOLON)) {
            this.nextToken();
        }

        return stmt;
    }

    /**
     *@param {string} tokenType
     */
    noPrefixParseFnError(tokenType) {
        this.errors.push(`no prefix parse function for ${tokenType} found`);
    }
    // a + b * c + d / e - f
    /**
     * 解析表达式，支持优先级和中缀表达式递归处理。
     * @param {number} precedence 当前表达式优先级
     * @returns {Expression | null}
     */
    parseExpression(precedence) {
        const prefix = this.prefixParseFns[this.curToken.type];
        if (!prefix) {
            this.noPrefixParseFnError(this.curToken.type);
            return null;
        }

        let leftExp = prefix.call(this);
        while (!this.peekTokenIs(TokenTypes.SEMICOLON) && precedence < this.peekPrecedence()) {
            const infix = this.infixParseFns[this.peekToken.type];
            if (!infix) {
                return leftExp;
            }

            this.nextToken();
            leftExp = infix.call(this, leftExp);
        }

        return leftExp;
    }

    /**
     * 解析中缀表达式，如 5 + 5
     * @param {Expression} left 左侧表达式
     * @returns {Expression}
     */
    parseInfixExpression(left) {
        const expression = new InfixExpression(this.curToken, left, this.curToken.literal);
        const precedence = this.curPrecedence();
        this.nextToken();
        expression.right = this.parseExpression(precedence);
        return expression;
    }

    /**
     * 解析前缀表达式，如 -5
     * @returns {Expression}
     */
    parsePrefixExpression() {
        const expression = new PrefixExpression(this.curToken, this.curToken.literal);

        this.nextToken();

        expression.right = this.parseExpression(PrecedencesInt.PREFIX);

        return expression;
    }

    /**
     * 解析分组表达式,如 (1 + 1）* 2
     * @returns {Expression}
     */
    parseGroupedExpression() {
        this.nextToken();
        const exp = this.parseExpression(PrecedencesInt.LOWEST);
        if (!this.expectPeek(TokenTypes.RPAREN)) {
            return null;
        }
        return exp;
    }

    /**
     * 解析IF表达式,如 if (x > y)
     * @returns {Expression}
     */
    parseIfExpression() {
        const expression = new IfExpression(this.curToken);
        if (!this.expectPeek(TokenTypes.LPAREN)) {
            return null;
        }
        this.nextToken();
        expression.condition = this.parseExpression(PrecedencesInt.LOWEST);
        if (!this.expectPeek(TokenTypes.RPAREN)) {
            return null;
        }
        if (!this.expectPeek(TokenTypes.LBRACE)) {
            return null;
        }
        expression.consequence = this.parseBlockStatement();

        if (this.peekTokenIs(TokenTypes.ELSE)) {
            this.nextToken();
            if (!this.expectPeek(TokenTypes.LBRACE)) {
                return null;
            }
            expression.alternative = this.parseBlockStatement();
        }
        return expression;
    }
    /**
     * 解析WHILE表达式,如 while (x > y)
     * @returns {Expression}
     */
    parseWhileExpression() {
        const expression = new WhileExpression(this.curToken);
        if (!this.expectPeek(TokenTypes.LPAREN)) {
            return null;
        }
        this.nextToken();
        expression.condition = this.parseExpression(PrecedencesInt.LOWEST);
        if (!this.expectPeek(TokenTypes.RPAREN)) {
            return null;
        }
        if (!this.expectPeek(TokenTypes.LBRACE)) {
            return null;
        }
        expression.consequence = this.parseBlockStatement();

        return expression;
    }

    /**
     * 解析Function字面量,如 fn (a,b)
     * @returns {FunctionLiteral}
     */
    parseFunctionLiteral() {
        const lit = new FunctionLiteral(this.curToken);
        if (!this.expectPeek(TokenTypes.LPAREN)) {
            return null;
        }
        lit.params = this.parseFunctionParameters();
        if (!this.expectPeek(TokenTypes.LBRACE)) {
            return null;
        }
        lit.body = this.parseBlockStatement();
        return lit;
    }

    /**
     * 解析Function参数列表,如 (a,b)
     * @returns {Identifier[]}
     */
    parseFunctionParameters() {
        const identifiers = [];
        if (this.peekTokenIs(TokenTypes.RPAREN)) {
            this.nextToken();
            return identifiers;
        }
        this.nextToken();

        identifiers.push(new Identifier(this.curToken, this.curToken.literal));
        while (this.peekTokenIs(TokenTypes.COMMA)) {
            this.nextToken();
            this.nextToken();
            const ident = new Identifier(this.curToken, this.curToken.literal);
            identifiers.push(ident);
        }
        if (!this.expectPeek(TokenTypes.RPAREN)) {
            return null;
        }

        return identifiers;
    }

    /**
     * 解析大括号语句,如 { x }
     * @returns {BlockStatement}
     */
    parseBlockStatement() {
        const block = new BlockStatement(this.curToken);
        block.statements = [];
        this.nextToken();
        while (!this.curTokenIs(TokenTypes.RBRACE) && !this.curTokenIs(TokenTypes.EOF)) {
            var stmt = this.parseStatement();
            if (stmt != null) {
                block.statements.push(stmt);
            }
            this.nextToken();
        }
        return block;
    }

    /**
     * 解析调用表达式语句,如 add()
     * @returns {CallExpression}
     */
    parseCallExpression(func) {
        const exp = new CallExpression(this.curToken, func);
        exp.arguments = this.parseExpressionList(TokenTypes.RPAREN);
        return exp;
    }

    /**
     * 解析索引表达式语句,如 myArray[1]
     * @returns {CallExpression}
     */
    parseIndexExpression(left) {
        const exp = new IndexExpression(this.curToken, left);
        this.nextToken();
        exp.index = this.parseExpression(PrecedencesInt.LOWEST);
        if (!this.expectPeek(TokenTypes.RBRACKET)) {
            return null;
        }
        return exp;
    }

    /**
     * 解析 let 语句
     * @returns {LetStatement | null}
     */
    parseLetStatement() {
        const stmt = new LetStatement(this.curToken);

        if (!this.expectPeek(TokenTypes.IDENT)) {
            return null;
        }

        stmt.name = new Identifier(this.curToken, this.curToken.literal);

        if (!this.expectPeek(TokenTypes.ASSIGN)) {
            return null;
        }

        this.nextToken();

        stmt.value = this.parseExpression(PrecedencesInt.LOWEST);

        if (this.peekTokenIs(TokenTypes.SEMICOLON)) {
            this.nextToken();
        }

        return stmt;
    }

    /**
     * 解析赋值语句： IDENT ASSIGN expression ;
     * @returns {AssignStatement | null}
     */
    parseAssignStatement() {
        const stmt = new AssignStatement(this.curToken); // token 是 IDENT token
        stmt.name = new Identifier(this.curToken, this.curToken.literal);

        if (!this.expectPeek(TokenTypes.ASSIGN)) {
            return null;
        }

        // 现在 curToken 是 ASSIGN，前进到右侧表达式开始
        this.nextToken();
        stmt.value = this.parseExpression(PrecedencesInt.LOWEST);

        if (this.peekTokenIs(TokenTypes.SEMICOLON)) {
            this.nextToken();
        }

        return stmt;
    }

    /**
     * 前缀表达式解析器：Identifier
     * @returns {Identifier}
     */
    parseIdentifier() {
        return new Identifier(this.curToken, this.curToken.literal);
    }

    /**
     * @returns {IntegerLiteral | null}
     */
    parseIntegerLiteral() {
        const lit = new IntegerLiteral(this.curToken);

        const value = Number(this.curToken.literal);
        if (Number.isNaN(value)) {
            const msg = `could not parse ${this.curToken.literal} as integer`;
            this.errors.push(msg);
            return null;
        }

        lit.value = value;

        return lit;
    }

    /**
     * @returns {StringLiteral | null}
     */
    parseStringLiteral() {
        const lit = new StringLiteral(this.curToken);

        const value = String(this.curToken.literal);

        lit.value = value;

        return lit;
    }

    /**
     * @returns {ArrayLiteral | null}
     */
    parseArrayLiteral() {
        const lit = new ArrayLiteral(this.curToken);

        lit.elements = this.parseExpressionList(TokenTypes.RBRACKET);

        return lit;
    }
    /**
     * @param {typeof TokenTypes} end
     * @returns {Expression[]}
     */
    parseExpressionList(end) {
        const list = [];
        if (this.peekTokenIs(end)) {
            this.nextToken();
            return list;
        }

        this.nextToken();
        list.push(this.parseExpression(PrecedencesInt.LOWEST));
        while (this.peekTokenIs(TokenTypes.COMMA)) {
            this.nextToken();
            this.nextToken();
            list.push(this.parseExpression(PrecedencesInt.LOWEST));
        }
        if (!this.expectPeek(end)) {
            return null;
        }

        return list;
    }

    /**
     * 解析 return 语句。
     * @returns {ReturnStatement}
     */
    parseReturnStatement() {
        const stmt = new ReturnStatement(this.curToken);

        this.nextToken();

        stmt.returnValue = this.parseExpression(PrecedencesInt.LOWEST);

        if (this.peekTokenIs(TokenTypes.SEMICOLON)) {
            this.nextToken();
        }

        return stmt;
    }
    /**
     * 解析 boolean 字面量
     * @returns {BooleanLiteral}
     */
    parseBoolean() {
        return new BooleanLiteral(this.curToken, this.curTokenIs(TokenTypes.TRUE));
    }

    /**
     * 判断当前 token 是否为指定类型
     * @param {string} t
     * @returns {boolean}
     */
    curTokenIs(t) {
        return this.curToken.type === t;
    }

    /**
     * 判断下一个 token 是否为指定类型
     * @param {string} t
     * @returns {boolean}
     */
    peekTokenIs(t) {
        return this.peekToken.type === t;
    }

    /**
     * 如果下一个 token 是指定类型，就前进一格；否则记录错误
     * @param {string} t - 预期的 token 类型
     * @returns {boolean}
     */
    expectPeek(t) {
        if (this.peekTokenIs(t)) {
            this.nextToken();
            return true;
        } else {
            this.peekError(t);
            return false;
        }
    }
}
