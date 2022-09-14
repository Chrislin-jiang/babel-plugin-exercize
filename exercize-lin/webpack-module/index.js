// import { resolve as pathResolve } from 'path'
// import { readFileSync } from 'fs'
// import { parse } from '@babel/parser'
// import traverse from '@babel/traverse'

const pathResolve = require('path').resolve
const readFileSync = require('fs').readFileSync
const parse = require('@babel/parser').parse
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default
const types = require('@babel/types');
const template = require('@babel/template').default;

function getModules(entry, modules = []) {
  // 拼绝对路径
  const fullPath = pathResolve(__dirname, entry)
  // 拿到 code
  const code = readFileSync(fullPath, 'utf8')
  // 通过 babel/parse -> parse 将 code 转为 AST
  const AST = parse(code, { sourceType: 'module' })
  // 通过 babel/traverse 操作 AST
  traverse(AST, {
    enter({ node }) {
      // #1 通过 AST 可知，require 的 type 是 CallExpression，并且 node.callee.name 是 require
      if (node.type === 'CallExpression' && node.callee.name === 'require') {
        const argument = node.arguments[0]

        // 并且 Token 是一个字符串，那么就意味着引入了一个模块，需要递归处理【深度优先搜索】
        if (argument.type === 'StringLiteral') {
          const moduleValue = argument.value
          getModules(moduleValue)
          modules.push(moduleValue)
        }
      }
    },
  })
  return modules
}

const modules = getModules('./moduleIndex.js')
console.log("modules", modules);