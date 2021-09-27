import path from 'path';
import { SSMClient, GetParametersByPathCommand, GetParametersByPathCommandOutput, Parameter,  } from '@aws-sdk/client-ssm';
import * as core from '@actions/core';
import fs from 'fs';
import { EOL } from 'os';

interface Formatter {
  format(output: GetParametersByPathCommandOutput): void;
}

class DotenvFormatter implements Formatter {
  path: string;
  constructor(path: string) {
    this.path = path;
  }

  format(output: GetParametersByPathCommandOutput) {
    const params = output.Parameters || [];
    const content = params.map((param: Parameter) => `${path.basename(param.Name || '')}=${param.Value}`).join(EOL);
    const filename = core.getInput('filename');
    fs.writeFileSync(filename, content || '');
    core.setOutput('count', params.length);
  }
}

class AsisFormatter implements Formatter {
  path: string
  constructor(path: string) {
    this.path = path;
  }

  format(output: GetParametersByPathCommandOutput) {
    const {Name = '', Value = ''} = output.Parameters?.[0] || {};
    const filename = core.getInput('filename') || path.basename(Name);
    fs.writeFileSync(filename, Value);
    core.setOutput('count', 1);
  }
}

async function main() {
  const credentials = {
    accessKeyId: core.getInput('aws-access-key-id'),
    secretAccessKey: core.getInput('aws-secret-access-key'),
  };
  const region = core.getInput('aws-region');
  const Path = core.getInput('path');
  const client = new SSMClient({region, credentials});
  const command = new GetParametersByPathCommand({
    Path,
    WithDecryption: core.getBooleanInput('with-decryption'),
    Recursive: core.getBooleanInput('recursive'),
  });

  const result: GetParametersByPathCommandOutput = await client.send(command);
  const formatter: Formatter = core.getInput('format') == 'as-is' ? new AsisFormatter(Path) : new DotenvFormatter(Path);
  formatter.format(result);
}
main().catch(e => core.setFailed(e.message));

export default main;
