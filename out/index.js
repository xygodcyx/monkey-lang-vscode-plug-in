import * as vscode from 'vscode';
import * as path from 'path';
import { LanguageClient, TransportKind, } from 'vscode-languageclient/node.js';
import { checkCommand, execCommand, showMessage, } from './help.js';
async function checkDependencies(userCheck = false) {
    const checkMonkey = await execCommand('npm list -g monkey-js-interpreter');
    if (!checkMonkey.success) {
        const selection = await showMessage('Warning', '"monkey-js-interpreter" is not installed globally. Please run: npm install -g monkey-js-interpreter', 'Install Now');
        switch (selection) {
            case 'Install Now':
                const installMonkey = await execCommand('npm install -g monkey-js-interpreter');
                if (installMonkey.success) {
                    showMessage('Info', 'Successfully installed "monkey-js-interpreter".');
                }
                else {
                    showMessage('Error', 'Failed to install "monkey-js-interpreter". Please try manually.');
                }
                break;
        }
    }
    else if (userCheck) {
        showMessage('Info', 'Successfully installed "monkey-js-interpreter".');
    }
    return checkMonkey;
}
export async function activate(context) {
    // check dependencies
    await checkDependencies();
    const checked = vscode.commands.registerCommand('monkey.checkDependencies', () => {
        showMessage('Info', 'Monkey: CheckDependencies...');
        checkDependencies(true);
    });
    context.subscriptions.push(checked);
    // run script
    let terminal = null;
    const disposable = vscode.commands.registerCommand('monkey.runFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            await showMessage('Error', 'No active Monkey file!');
            return;
        }
        const filePath = editor.document.fileName;
        const hasMonkey = await checkCommand('monkey');
        const command = `${hasMonkey.success ? 'monkey' : 'npx monkey'} "${filePath}"`;
        if (terminal) {
            terminal.dispose();
            terminal = null;
        }
        terminal = vscode.window.createTerminal('Monkey REPL');
        terminal.show();
        terminal.sendText(command);
    });
    context.subscriptions.push(disposable);
    // language server
    // The server is implemented in node
    let serverModule = context.asAbsolutePath(path.join('out', 'server', 'server.js'));
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    let debugOptions = {
        execArgv: ['--nolazy', '--inspect=6009'],
    };
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
    };
    let clientOptions = {
        documentSelector: [
            { scheme: 'file', language: 'monkey' },
        ],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc'),
        },
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
    };
    // Create the language client and start the client.
    const client = new LanguageClient('languageServerExample', 'Language Server Example', serverOptions, clientOptions);
    // Start the client. This will also launch the server
    client.start();
    context.subscriptions.push(client);
}
export function deactivate() { }
//# sourceMappingURL=index.js.map