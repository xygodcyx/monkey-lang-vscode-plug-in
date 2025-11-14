import { exec } from 'child_process'
import * as vscode from 'vscode'

export async function execCommand(command) {
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

export async function showMessage(type, ...message) {
  return new Promise((resolve, reject) => {
    switch (type) {
      case 'Warning':
        vscode.window
          .showWarningMessage(
            message[0],
            ...message.slice(1)
          )
          .then(resolve)
        break
    }
  })
}
