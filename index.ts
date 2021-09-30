import fs from 'fs';
import { EOL } from 'os';
import path from 'path';
import { SSMClient, GetParametersByPathCommand, GetParametersByPathCommandOutput, Parameter } from '@aws-sdk/client-ssm';
import * as core from '@actions/core';
import minimatch from 'minimatch';

interface Formatter {
  save(parameters: MandatoryParameter[]): void;
}

class DotenvFormatter implements Formatter {
  save(parameters: MandatoryParameter[]) {
    const filename = core.getInput('filename');
    const content = parameters.map(param => `${path.basename(param.Name)}=${param.Value}`).join(EOL);
    fs.writeFileSync(filename, content || '');
  }
}

class AsisFormatter implements Formatter {
  save(parameters: MandatoryParameter[]) {
    const {Name, Value} = parameters[0];
    if (!Name || !Value) {
      throw new Error("No parameter found!");
    }
    const filename = core.getInput('filename') || path.basename(Name);
    fs.writeFileSync(filename, Value);
  }
}

const FORMATTERS = new Map([
  ['dotenv', new DotenvFormatter()],
  ['as-is',  new AsisFormatter()],
]);

interface MandatoryParameter extends Parameter {
  Name: string;
}
type MandatorFunction = (parameters: Parameter[]) => MandatoryParameter[];

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
  const pattern = core.getInput('pattern');
  const matcher = (parameter: MandatoryParameter) => pattern ? minimatch(parameter.Name, pattern) : true;
  const mandate = ((parameters: Parameter[]) => parameters.filter(p => p.Name && p.Value)) as MandatorFunction;
  const parameters = mandate(result.Parameters || []).filter(matcher);
  parameters.forEach(parameter => {
    core.setOutput(path.basename(parameter.Name), parameter.Value);
  });
  const formatter = FORMATTERS.get(core.getInput('format'));
  if (formatter) {
    formatter.save(parameters);
  }
}
main().catch(e => core.setFailed(e.message));

export default main;
