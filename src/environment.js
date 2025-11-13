// src/environment.js

import { BaseObject } from './object.js';

/**
 * 环境（Environment）
 * 用于保存变量名与对应的值（对象绑定）
 */
export class Environment {
    /**
     * @constructor
     * @param {Environment | null} outer 函数的外部环境
     */
    constructor(outer) {
        /** @type {Record<string, BaseObject>} */
        this.store = {};
        /** @type {Environment | null} */
        this.outer = outer;
    }

    /**
     * 获取变量
     * @param {string} name
     * @returns {BaseObject | null} 值
     */
    get(name) {
        let val = this.store[name];
        if (!val && this.outer) {
            val = this.outer.get(name);
        }
        return val;
    }

    /**
     * 设置变量
     * @param {string} name
     * @param {BaseObject} val
     * @returns {BaseObject}
     */
    set(name, val) {
        this.store[name] = val;
        return val;
    }
}

/**
 * 创建新环境
 * @returns {Environment}
 */
export function newEnvironment() {
    return new Environment(null);
}

/**
 * 创建新闭合环境
 * @param {Environment} outer
 * @returns {Environment}
 */
export function newEnclosedEnvironment(outer) {
    return new Environment(outer);
}
