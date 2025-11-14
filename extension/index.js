import * as vscode from 'vscode'
import * as path from 'path'

import {
  LanguageClient,
  TransportKind,
} from 'vscode-languageclient/node.js'
import { execCommand, showMessage } from './help.js'

export async function activate(context) {
  // check
  const checkMonkey = await execCommand(
    'npm list -g monkey-js-interpreter'
  )
  if (!checkMonkey.success) {
    const selection = await showMessage(
      'Warning',
      'Warning: "monkey-js-interpreter" is not installed globally. Please run: npm install -g monkey-js-interpreter',
      'Install Now'
    )
    switch (selection) {
      case 'Install Now':
        const installMonkey = await execCommand(
          'npm install -g monkey-js-interpreter'
        )
        if (installMonkey.success) {
          vscode.window.showInformationMessage(
            'Successfully installed "monkey-js-interpreter".'
          )
        } else {
          vscode.window.showErrorMessage(
            'Failed to install "monkey-js-interpreter". Please try manually.'
          )
        }
        break
    }
  }

  // run script

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

      const command = `monkey "${filePath}"`

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

  // language server

  // The server is implemented in node
  let serverModule = context.asAbsolutePath(
    path.join('server', 'server.js')
  )
  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  let debugOptions = {
    execArgv: ['--nolazy', '--inspect=6009'],
  }

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  let serverOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  }

  // Options to control the language client
  let clientOptions = {
    // Register the server for plain text documents
    documentSelector: [
      { scheme: 'file', language: 'monkey' },
    ],
    synchronize: {
      fileEvents:
        vscode.workspace.createFileSystemWatcher(
          '**/.clientrc'
        ),
    },

    // ⭐⭐ 添加 signatureHelpProvider
    capabilities: {
      textDocument: {
        signatureHelp: {
          dynamicRegistration: true,
          signatureInformation: {
            documentationFormat: ['markdown', 'plaintext'],
            parameterInformation: {
              labelOffsetSupport: true,
            },
          },
          contextSupport: true,
        },
      },
    },
  }

  // Create the language client and start the client.
  const client = new LanguageClient(
    'languageServerExample',
    'Language Server Example',
    serverOptions,
    clientOptions
  )

  // Start the client. This will also launch the server
  context.subscriptions.push(client.start())
}

export function deactivate() {}
