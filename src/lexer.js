// lexer.js

import Token, { lookupIdent, TokenTypes } from './token.js';

export default class Lexer {
    /**
     * @param {string} input - 要进行词法分析的源代码
     */
    constructor(input) {
        this.input = input;
        this.position = 0; // 当前字符的索引
        this.readPosition = 0; // 当前字符之后的索引
        this.ch = ''; // 当前正在查看的字符

        this.readChar(); // 初始化，读取第一个字符
    }

    /**
     * 读取下一个字符并更新状态
     */
    readChar() {
        if (this.readPosition >= this.input.length) {
            this.ch = null; // 表示 EOF
        } else {
            this.ch = this.input[this.readPosition];
        }
        this.position = this.readPosition;
        this.readPosition += 1;
    }
    /**
     * 读取下一个字符
     * @returns {string}
     */
    peekChar() {
        if (this.readPosition >= this.input.length) {
            return undefined;
        }
        return this.input[this.readPosition];
    }

    isWhitespace(char) {
        return char === ' ' || char === '\t' || char === '\n' || char === '\r';
    }

    skipWhitespace() {
        while (this.isWhitespace(this.ch)) {
            this.readChar();
        }
    }
    /**
     * 返回当前的 Token，并推进到下一个字符
     */
    nextToken() {
        this.skipWhitespace();
        let tok;
        switch (this.ch) {
            case '=':
                if (this.peekChar() === '=') {
                    tok = new Token(TokenTypes.EQ, this.ch + '=');
                    this.readChar();
                } else {
                    tok = new Token(TokenTypes.ASSIGN, this.ch);
                }
                break;
            case '+':
                tok = new Token(TokenTypes.PLUS, this.ch);
                break;
            case '-':
                tok = new Token(TokenTypes.MINUS, this.ch);
                break;
            case '*':
                tok = new Token(TokenTypes.ASTERISK, this.ch);
                break;
            case '/':
                tok = new Token(TokenTypes.SLASH, this.ch);
                break;
            case '!':
                if (this.peekChar() === '=') {
                    tok = new Token(TokenTypes.NOT_EQ, this.ch + '=');
                    this.readChar();
                } else {
                    tok = new Token(TokenTypes.BANG, this.ch);
                }
                break;
            case '<':
                tok = new Token(TokenTypes.LT, this.ch);
                break;
            case '>':
                tok = new Token(TokenTypes.GT, this.ch);
                break;
            case '(':
                tok = new Token(TokenTypes.LPAREN, this.ch);
                break;
            case ')':
                tok = new Token(TokenTypes.RPAREN, this.ch);
                break;
            case '{':
                tok = new Token(TokenTypes.LBRACE, this.ch);
                break;
            case '}':
                tok = new Token(TokenTypes.RBRACE, this.ch);
                break;
            case '[':
                tok = new Token(TokenTypes.LBRACKET, this.ch);
                break;
            case ']':
                tok = new Token(TokenTypes.RBRACKET, this.ch);
                break;
            case ',':
                tok = new Token(TokenTypes.COMMA, this.ch);
                break;
            case ';':
                tok = new Token(TokenTypes.SEMICOLON, this.ch);
                break;
            case '"':
                tok = new Token(TokenTypes.STRING);
                tok.literal = this.readString();
                break;
            case null:
                tok = new Token(TokenTypes.EOF, '');
                break;
            default:
                if (this.isLetter(this.ch)) {
                    const literal = this.readIdentifier();
                    tok = new Token(lookupIdent(literal), literal);
                    return tok;
                } else if (this.isDigit(this.ch)) {
                    const literal = this.readNumber();
                    tok = new Token(TokenTypes.INT, literal);
                    return tok;
                } else {
                    tok = new Token(TokenTypes.ILLEGAL, this.ch);
                }
        }

        this.readChar(); // 移动到下一个字符
        return tok;
    }
    // 读字面量
    readIdentifier() {
        const pos = this.position;
        while (this.isLetter(this.ch)) {
            this.readChar();
        }
        // 直到当前字符不是合法的标识符字符时返回截取到的全部标识符
        return this.input.substring(pos, this.position);
    }
    isLetter(c) {
        return ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_') && c !== null;
    }
    // 读数字
    readNumber() {
        const pos = this.position;
        while (this.isDigit(this.ch)) {
            this.readChar();
        }
        return this.input.substring(pos, this.position);
    }
    // 读字符串
    readString() {
        const pos = this.position + 1;
        this.readChar();
        while (this.isString(this.ch)) {
            this.readChar();
        }
        return this.input.substring(pos, this.position);
    }
    isDigit(c) {
        return c >= '0' && c <= '9' && c !== null;
    }
    isString(c) {
        return c !== '"';
    }
}
