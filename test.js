const fs = require('fs');
const {EOL} = require('os');
const path = require('path');
const { SSMClient, GetParametersByPathCommand, Parameter } = require('@aws-sdk/client-ssm');

const DEFAULT_DOTENV_FILENAME = '.env';

const FORMATTERS = new Map([
  ['dotenv', (parameters) => {
    const filename = core.getInput('filename') || DEFAULT_DOTENV_FILENAME;
    const content = parameters.map(param => `${path.basename(param.Name)}=${param.Value}`).join(EOL);
    fs.writeFileSync(filename, content);
  }],
  ['as-is', (parameters) => {
    const {Name, Value} = parameters[0];
    const filename = core.getInput('filename') || path.basename(Name);
    fs.writeFileSync(filename, Value);
  }],
]);

async function main() {
  const region = 'ap-northeast-2';
  const client = new SSMClient({region});
  const parameters = [];
  const input = {
      Path: '/config/backoffice/production',
      WithDecryption: true,
      Recursive: false,
  };
  while (true) {
    const command = new GetParametersByPathCommand(input);
    const result = await client.send(command);
    parameters.push(...result.Parameters);
    if (result.NextToken) {
      Object.assign(input, {NextToken: result.NextToken});
    } else {
      break;
    }
  }
  console.log(parameters);
}

main();
