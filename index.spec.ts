import * as core from '@actions/core';
import { SSMClient } from '@aws-sdk/client-ssm';
import fs from 'fs';
import { EOL } from 'os';

import main from './index';

jest.mock('@actions/core');
jest.mock('@aws-sdk/client-ssm');
jest.mock('fs');

const MockedClient = SSMClient as jest.Mocked<typeof SSMClient>;
const getInput = core.getInput as jest.MockedFunction<typeof core.getInput>;

const DEFAULT_INPUTS = new Map([
  ['aws-access-key-id', 'aws-access-key-id'],
  ['aws-secret-access-key', 'aws-secret-access-key'],
  ['aws-region', 'aws-region'],
  ['path', '/config/path/'],
]);

describe("aws-parameter-store-action", () => {
  it("get parameters by path and then write out to .env file", async () => {
    const inputs = new Map([...DEFAULT_INPUTS,
      ['format', 'dotenv'],
      ['filename', 'filename.txt'],    
    ]);
    getInput.mockImplementation((key) => inputs.get(key) as string);

    const Parameters = [{Name: '/config/path/xxx', Value: 'xxx'}, {Name: '/config/path/yyy', Value: 'yyy'}];
    const send = jest.fn(async () => Object.assign({Parameters}));
    (MockedClient as jest.Mock).mockImplementation(() => ({send}));

    await main();

    expect(fs.writeFileSync).toHaveBeenCalledWith(inputs.get('filename'), `xxx=xxx${EOL}yyy=yyy`);
    expect(core.setOutput).toHaveBeenCalledWith('xxx', 'xxx');
    expect(core.setOutput).toHaveBeenCalledWith('yyy', 'yyy');
  });

  it("get parameters by path and then write out to file as is", async () => {
    const inputs = new Map([...DEFAULT_INPUTS,
      ['format', 'as-is'],
    ]);
    getInput.mockImplementation((key) => inputs.get(key) as string);

    const Parameters = [{Name: '/config/path/xxx', Value: 'yyy'}];
    const send = jest.fn(async () => Object.assign({Parameters}));
    (MockedClient as jest.Mock).mockImplementation(() => ({send}));

    await main();

    expect(fs.writeFileSync).toHaveBeenCalledWith('xxx', 'yyy');
    expect(core.setOutput).toHaveBeenCalledWith('xxx', 'yyy');
  });
});