'use strict';
import * as vscode from 'vscode';
import fs = require('fs');
const AOMI_PAY_NAME = 'pay';
const ARGS = new Map([
  [AOMI_PAY_NAME, ['dev:test', 'dev:phone']],
  ['default', ['dev']]
]);

export function activate(context: vscode.ExtensionContext) {
  const files = vscode.workspace.workspaceFolders || [];
  if (files !== []) {
    const rootPath = files[0].uri.fsPath;
    vscode.window.showInformationMessage(rootPath);
    fs.readFile(rootPath + "//package.json", (err, data) => {
      if (err)  {
        vscode.window.showErrorMessage(JSON.stringify(err));
        throw err;
      }
      if (!data) {
        vscode.window.showErrorMessage('没有package.json文件');
        return;
      }
      const packageJson = JSON.parse(data.toString());
      if (!packageJson.scripts) {
        vscode.window.showErrorMessage('package.json没有scripts变量');
        return;
      }
      if (packageJson.name === AOMI_PAY_NAME) {
        setIPInScripts(packageJson, rootPath);
      }
      executeScripts(packageJson, rootPath);
    });
  }
}

function setIPInScripts(packageJson: any, rootPath: string) {
  const IP = getIP();
  packageJson.scripts["dev:phone"] = `cross-env SERVER_ADDRESS=aomi API_ENV=test TEST_ON=phone PORT=3000 HOST=${IP} nuxt`;
  fs.writeFileSync(rootPath + '//package.json', JSON.stringify(packageJson, null, 4));
  vscode.window.showInformationMessage("write in package.json");
}

function getIP() {
  const interfaces = require('os').networkInterfaces();
  for(const devName in interfaces){
    const iface = interfaces[devName];
    for(let i = 0;i < iface.length; i++){
      const alias = iface[i];
        if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){
            return alias.address;
        }
    }
  }
}

function executeScripts(packageJson: any, rootPath: string) {
  const projectName = ARGS.has(packageJson.name) ? packageJson.name : 'default';
  const scripts = ARGS.get(projectName) || []
  for (const arg of scripts) {
    const lastArg = packageJson.scripts[arg];
    if (lastArg) {
      const script = `npm run ${arg}`;
      const terminal = vscode.window.createTerminal({ cwd: rootPath });
      terminal.sendText(script);
      vscode.window.showInformationMessage(script);
    }
  }
}

export function deactivate() {
}