import * as vscode from 'vscode'
import path from 'path'

export function activate(context) {
  /**
   * @type {import('vscode').Terminal}
   */
  let terminal = null
  const disposable = vscode.commands.registerCommand(
    'monkey.runFile',
    () => {
      const editor = vscode.window.activeTextEditor
      if (!editor) {
        vscode.window.showErrorMessage(
          'No active Monkey file!'
        )
        return
      }

      const filePath = editor.document.fileName
      const extensionPath = context.extensionPath // 插件安装根目录
      const mainPath = path.join(
        extensionPath,
        'src',
        'main.js'
      )

      // 构造命令（保证能找到 main.js）
      const command = `node "${mainPath}" "${filePath}"`

      if (terminal) {
        terminal.dispose()
        terminal = null
      }
      terminal = vscode.window.createTerminal('Monkey REPL')
      terminal.show()
      terminal.sendText(command)
    }
  )

  context.subscriptions.push(disposable)
}

export function deactivate() {}
