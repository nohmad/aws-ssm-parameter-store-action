import fs from 'fs';
import { EOL } from 'os';
import path from 'path';
import { SSMClient, GetParametersByPathCommand, Parameter, GetParametersByPathCommandInput } from '@aws-sdk/client-ssm';
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
  const pattern = core.getInput('pattern');
  const client = new SSMClient({region, credentials});
  const input: GetParametersByPathCommandInput = {
    Path,
    WithDecryption: core.getBooleanInput('with-decryption'),
    Recursive: core.getBooleanInput('recursive'),
  };
  const parameters: MandatoryParameter[] = [];
  const mandate = ((parameters: Parameter[]) => parameters.filter(p => p.Name && p.Value)) as MandatorFunction;
  const matcher = (parameter: MandatoryParameter) => pattern ? minimatch(path.basename(parameter.Name), pattern) : true;

  while (true) {
    const command = new GetParametersByPathCommand(input);
    const result = await client.send(command);
    parameters.push(...(mandate(result.Parameters || []).filter(matcher)));
    if (result.NextToken) {
      Object.assign(input, {NextToken: result.NextToken});
    } else {
      break;
    }
  }
  if (core.isDebug()) {
    core.debug(JSON.stringify(parameters));
  }
  parameters.forEach(parameter => {
    core.setOutput(path.basename(parameter.Name), parameter.Value);
  });
  FORMATTERS.get(core.getInput('format'))?.call(null, parameters);
}
main().catch(e => core.setFailed(e.message));

export default main;
