// server/server.js
import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  CompletionItemKind,
  TextDocumentSyncKind,
} from 'vscode-languageserver/node.js'

// 建立 connection 与 document 管理器
const connection = createConnection(ProposedFeatures.all)
// const documents = new TextDocuments()

// 在接收到文档变化时做简单 diagnostics 检查
// documents.onDidChangeContent(change => {
//   const text = change.document.getText()
//   const diagnostics = []

//   // 示例检测：禁止 "??" 出现
//   const idx = text.indexOf('??')
//   if (idx !== -1) {
//     diagnostics.push({
//       severity: 1,
//       range: {
//         start: change.document.positionAt(idx),
//         end: change.document.positionAt(idx + 2),
//       },
//       message: '非法符号 "??"',
//       source: 'monkey-ls',
//     })
//   }

//   connection.sendDiagnostics({
//     uri: change.document.uri,
//     diagnostics,
//   })
// })

// 初始化时声明能力
connection.onInitialize(() => {
  return {
    capabilities: {
      // textDocumentSync: TextDocumentSyncKind.Incremental,
      // Completion：触发字符可按需填
      // completionProvider: {
      //   triggerCharacters: ['.', '(', ','],
      //   resolveProvider: false  // 若要实现 resolve，则实现 onCompletionResolve
      // },
      // // Signature Help（参数提示）
      // signatureHelpProvider: {
      //   triggerCharacters: ['(', ','],
      // },
      // hoverProvider: false,
    },
  }
})

// 简单补全（Completion）
connection.onCompletion(() => {
  return [
    {
      label: 'let',
      kind: CompletionItemKind.Keyword,
      documentation: '声明变量',
    },
    {
      label: 'fn',
      kind: CompletionItemKind.Keyword,
      documentation: '函数定义',
    },
    {
      label: 'func',
      kind: CompletionItemKind.Keyword,
      documentation: '函数定义',
    },
    {
      label: 'while',
      kind: CompletionItemKind.Keyword,
      documentation: 'while循环',
    },
    {
      label: 'return',
      kind: CompletionItemKind.Keyword,
      documentation: '返回值',
    },
    {
      label: 'print',
      kind: CompletionItemKind.Function,
      documentation: '打印函数',
    },
    {
      label: 'randi',
      kind: CompletionItemKind.Function,
      documentation: '返回从start-end的随机整数',
    },
  ]
})

// 如果你在 capabilities 里声明 resolveProvider: true，则需要实现下面
connection.onCompletionResolve(item => {
  // 可以在这里丰富 item.detail / documentation
  item.detail = item.detail || 'Monkey built-in'
  return item
})

// 参数提示（Signature Help）
// connection.onSignatureHelp(params => {
//   // 先安全获取文档
//   const doc = documents.get(params.textDocument.uri)
//   if (!doc) return null // 防御性写法，避免 getText 报错

//   const posOffset = doc.offsetAt(params.position)
//   const textBefore = doc.getText().slice(0, posOffset)

//   // 简单判断：光标前是 "print(" 则返回签名
//   if (/\bprint\s*\($/.test(textBefore)) {
//     return {
//       signatures: [
//         {
//           label: 'print(message)',
//           documentation: '打印 message 到控制台',
//           parameters: [
//             {
//               label: 'message',
//               documentation: '要打印的值',
//             },
//           ],
//         },
//       ],
//       activeSignature: 0,
//       activeParameter: 0,
//     }
//   }

//   // 也可以检查其它函数，如 randi(start, end)
//   if (/\brandi\s*\($/.test(textBefore)) {
//     return {
//       signatures: [
//         {
//           label: 'rand(start, end)',
//           documentation: '返回随机整数',
//           parameters: [
//             { label: 'start', documentation: '含起始值' },
//             { label: 'end', documentation: '含结束值' },
//           ],
//         },
//       ],
//       activeSignature: 0,
//       activeParameter: 0,
//     }
//   }

//   return null
// })

// hover 示例
// connection.onHover(params => {
//   const doc = documents.get(params.textDocument.uri)
//   if (!doc) return null
//   return {
//     contents: {
//       kind: 'markdown',
//       value: '**Monkey** — custom language',
//     },
//   }
// })

// 启动监听
// documents.listen(connection)
connection.listen()
