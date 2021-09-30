import fs from 'fs';
import { EOL } from 'os';
import path from 'path';
import { SSMClient, GetParametersByPathCommand, Parameter } from '@aws-sdk/client-ssm';
import * as core from '@actions/core';
import minimatch from 'minimatch';

const DEFAULT_DOTENV_FILENAME = '.env';

interface MandatoryParameter extends Parameter {
  Name: string;
  Value: string;
}
type MandatorFunction = (parameters: Parameter[]) => MandatoryParameter[];

const FORMATTERS = new Map([
  ['dotenv', (parameters: MandatoryParameter[]) => {
    const filename = core.getInput('filename') || DEFAULT_DOTENV_FILENAME;
    const content = parameters.map(param => `${path.basename(param.Name)}=${param.Value}`).join(EOL);
    fs.writeFileSync(filename, content);
  }],
  ['as-is', (parameters: MandatoryParameter[]) => {
    const {Name, Value} = parameters[0];
    const filename = core.getInput('filename') || path.basename(Name);
    fs.writeFileSync(filename, Value);
  }],
]);

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
  // if (core.isDebug()) {
  //   core.debug(JSON.stringify(result));
  // }
  const pattern = core.getInput('pattern');
  const matcher = (parameter: MandatoryParameter) => pattern ? minimatch(path.basename(parameter.Name), pattern) : true;
  const mandate = ((parameters: Parameter[]) => parameters.filter(p => p.Name && p.Value)) as MandatorFunction;
  const parameters = mandate(result.Parameters || []).filter(matcher);
  parameters.forEach(parameter => {
    core.setOutput(path.basename(parameter.Name), parameter.Value);
  });
  FORMATTERS.get(core.getInput('format'))?.call(null, parameters);
}
main().catch(e => core.setFailed(e.message));

export default main;
