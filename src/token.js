export const TokenTypes = {
    // 特殊标识
    ILLEGAL: 'ILLEGAL',
    EOF: 'EOF',

    // 标识符 + 字面量
    IDENT: 'IDENT', // add, foobar, x, y, ...
    INT: 'INT', // 1343456
    STRING: 'STRING', // "hello world"

    // 运算符
    PLUS: '+',
    MINUS: '-',
    ASTERISK: '*',
    SLASH: '/',
    ASSIGN: '=',

    // 比较符
    BANG: '!',
    GT: '>',
    LT: '<',
    EQ: '==',
    NOT_EQ: '!=',

    // 分隔符
    COMMA: ',',
    SEMICOLON: ';',

    LPAREN: '(',
    RPAREN: ')',
    LBRACE: '{',
    RBRACE: '}',
    LBRACKET: '[',
    RBRACKET: ']',

    // 关键字
    FUNCTION: 'FUNCTION',
    LET: 'LET',
    IF: 'IF',
    ELSE: 'ELSE',
    WHILE: 'WHILE',
    RETURN: 'RETURN',
    TRUE: 'TRUE',
    FALSE: 'FALSE',
};

const keywords = {
    func: TokenTypes.FUNCTION,
    fn: TokenTypes.FUNCTION,
    while : TokenTypes.WHILE,
    let: TokenTypes.LET,
    if: TokenTypes.IF,
    else: TokenTypes.ELSE,
    return: TokenTypes.RETURN,
    true: TokenTypes.TRUE,
    false: TokenTypes.FALSE,
};

export function lookupIdent(ident) {
    return keywords[ident] || TokenTypes.IDENT;
}

export default class Token {
    /**
     * @param {string} type - token 的类型，如 IDENT、INT 等
     * @param {string} literal - token 的字面值
     */
    constructor(type, literal) {
        this.type = type;
        this.literal = literal;
    }
}
