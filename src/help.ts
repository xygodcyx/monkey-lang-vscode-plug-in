import { exec, ExecException } from 'child_process'
import * as vscode from 'vscode'

interface PromiseKVResult {
  success: boolean,
  err?: (ExecException | null) | string
  out?: string
}

export async function execCommand(command: string): Promise<PromiseKVResult> {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err || stderr) {
        resolve({
          success: false,
          err: err || stderr,
        })
        return
      }
      resolve({
        success: true,
        out: stdout,
      })
    })
  })
}

export function checkCommand(command: string): Promise<PromiseKVResult> {
  return new Promise((resolve, reject) => {
    exec(`where ${command}`, (err, stdout, stderr) => {
      if (err || stderr) {
        resolve({
          success: false,
          err: err || stderr,
        })
        return
      }
      resolve({
        success: true,
        out: stdout,
      })
    })
  })
}

export async function showMessage(type: string, ...message: string[]): Promise<string | undefined> {
  return new Promise((resolve) => {
    switch (type) {
      case 'Warning': {
        vscode.window
          .showWarningMessage<string>(
            message[0],
            ...message.slice(1)
          )
          .then(resolve)
        break
      }
      case 'Info': {
        vscode.window
          .showInformationMessage(
            message[0],
            ...message.slice(1)
          )
          .then(resolve)
        break
      }
      case 'Error': {
        vscode.window
          .showErrorMessage(message[0], ...message.slice(1))
          .then(resolve)
        break
      }
    }
  })
}
