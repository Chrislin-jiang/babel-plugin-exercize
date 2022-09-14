const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default
const types = require('@babel/types');
const template = require('@babel/template').default;

const sourceCode = `
console.log(1);

function func() {
    console.info(2);
}

export default class Clazz {
    say() {
        console.debug(3);
    }
    render() {
        return <div>{console.error(4)}</div>
    }
}
`;

const sourceCode1 = `console.log(1);`

const sourceCode2 = `
console.log(1);

function func() {
    console.info(2);
}
`

const ast = parser.parse(sourceCode, {
  sourceType: 'unambiguous',
  plugins: ['jsx']
})

const targetCalleeName = ['log', 'info', 'error', 'debug'].map(ele => `console.${ele}`)

traverse(ast, {
  CallExpression(path, state) {
    // console.log("path", path);
    // console.log("path.node", path.node);
    // if (types.isMemberExpression(path.node.callee)
    //   && path.node.callee.object.name === 'console'
    //   && ['log', 'info', 'error', 'debug'].includes(path.node.callee.property.name)
    // ) {
    //   const { line, column } = path.node.loc.start
    //   path.node.arguments.unshift(types.stringLiteral(`msg:(${line}, ${column})`))
    // }
    // const calleeName = generate(path.node.callee).code
    // const calleeName = path.get('callee').toString()
    // if (targetCalleeName.includes(calleeName)) {
    //   const { line, column } = path.node.loc.start
    //   path.node.arguments.unshift(types.stringLiteral(`msg:(${line}, ${column})`))
    // }
    if (path.node.isNew) {
      return;
    }
    const calleeName = generate(path.node.callee).code;
    if (targetCalleeName.includes(calleeName)) {
      const { line, column } = path.node.loc.start;
      const newNode = template.expression(`console.log("msg:(${line}, ${column})")`)();
      newNode.isNew = true;
      if (path.findParent(path => path.isJSXElement())) {
        path.replaceWith(types.arrayExpression([newNode, path.node]))
        path.skip()
      } else {
        path.insertBefore(newNode)
      }
    }
  }
})

const { code, map } = generate(ast)
console.log(code)
