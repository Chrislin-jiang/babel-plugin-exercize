const fs = require('fs')
const path = require('path')

// 负责 code -> ast
const { parse } = require('@babel/parser')
// 负责 ast -> ast
const traverse = require('@babel/traverse').default
// 负责 ast -> code
const generate = require('@babel/generator').default

let moduleId = 0

const preorder = function (root, res = []) {
  if (root == null) return res
  res.push(root.val)
  root.children.forEach(item => {
      preorder(item, res)
  })
  return res
};

function buildModule(filename) {
  // 如果入口位置为相对路径，则根据此时的 __dirname 生成绝对文件路径
  filename = path.resolve(__dirname, filename)

  // 同步读取文件，并使用 utf8 读做字符串
  const code = fs.readFileSync(filename, 'utf8')

  // 使用 babel 解析源码为 AST
  const ast = parse(code, {
    sourceType: 'module'
  })

  const deps = []
  const currentModuleId = moduleId

  traverse(ast, {
    enter({ node }) {
      // 根据 AST 定位到所有的 require 函数，寻找出所有的依赖
      if (node.type === 'CallExpression' && node.callee.name === 'require') {
        const argument = node.arguments[0]

        // 找到依赖的模块名称
        // require('lodash') -> lodash (argument.value)
        if (argument.type === 'StringLiteral') {

          // 深度优先搜索，当寻找到一个依赖时，则 moduleId 自增一
          // 并深度递归进入该模块，解析该模块的模块依赖树
          moduleId++;
          const nextFilename = path.join(path.dirname(filename), argument.value)

          // 如果 lodash 的 moduleId 为 3 的话
          // require('lodash') -> require(3)
          argument.value = moduleId
          deps.push(buildModule(nextFilename))
        }
      }
    }
  })
  return {
    filename,
    deps,
    code: generate(ast).code,
    id: currentModuleId
  }
}

function moduleTreeToQueue(moduleTree) {
  const { deps, ...module } = moduleTree

  const moduleQueue = deps.reduce((acc, m) => {
    return acc.concat(moduleTreeToQueue(m))
  }, [module])

  return moduleQueue
}

const entry = './moduleIndex.js'
const moduleTree = buildModule(entry)
const modules = moduleTreeToQueue(moduleTree)
console.log("modules", modules);