import { SSMClient, GetParametersByPathCommand } from '@aws-sdk/client-ssm';
import * as core from '@actions/core';
import fs from 'fs';

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
  const result = await client.send(command);
  const {Parameters = []} = result;
  const lines = Parameters?.map(param => {
    const {Name, Value} = param;
    const name = Name?.replace(Path, '');
    return `${name}=${Value}`;
  }).join('\n');  
  fs.writeFileSync(core.getInput('filename', {required: true}), lines);
  core.setOutput('count', Parameters?.length);
}
main().catch(e => core.setFailed(e.message));

export default main;