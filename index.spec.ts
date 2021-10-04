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
  it("writes out as dotenv format to the given file", async () => {
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

  it("writes out as dotenv format matches pattern to file named .env if no filename given", async () => {
    const inputs = new Map([...DEFAULT_INPUTS,
      ['format', 'dotenv'],
      ['pattern', 'xxx'],
    ]);
    getInput.mockImplementation((key) => inputs.get(key) as string);

    const Parameters = [{Name: '/config/path/xxx', Value: 'xxx'}, {Name: '/config/path/yyy', Value: 'yyy'}];
    const send = jest.fn(async () => Object.assign({Parameters}));
    (MockedClient as jest.Mock).mockImplementation(() => ({send}));

    await main();

    expect(fs.writeFileSync).toHaveBeenCalledWith('.env', `xxx=xxx`);
  });

  it("writes out as-is to the given file", async () => {
    const inputs = new Map([...DEFAULT_INPUTS,
      ['format', 'as-is'],
      ['filename', 'xxx.txt'],
    ]);
    getInput.mockImplementation((key) => inputs.get(key) as string);

    const Parameters = [{Name: '/config/path/xxx', Value: 'yyy'}];
    const send = jest.fn(async () => Object.assign({Parameters}));
    (MockedClient as jest.Mock).mockImplementation(() => ({send}));

    await main();

    expect(fs.writeFileSync).toHaveBeenCalledWith('xxx.txt', 'yyy');
    expect(core.setOutput).toHaveBeenCalledWith('xxx', 'yyy');
  });

  it("writes out as-is to the first element's name of the list retrieved", async () => {
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

  it("retrieves parameters without format", async () => {
    const inputs = new Map([...DEFAULT_INPUTS,
      ['format', undefined],
    ]);
    getInput.mockImplementation((key) => inputs.get(key) as string);

    const send = jest.fn(async () => Object.assign({}));
    (MockedClient as jest.Mock).mockImplementation(() => ({send}));

    await main();

    expect(core.setOutput).not.toHaveBeenCalled();
  });

  it("prints out debug log if enabled debugging", async () => {
    (core.isDebug as jest.MockedFunction<typeof core.isDebug>).mockReturnValue(true);
    const Parameters = [{Name: 'xxx', Value: 'yyy'}];
    const send = jest.fn(async () => Object.assign({Parameters}));
    (MockedClient as jest.Mock).mockImplementation(() => ({send}));

    await main();

    expect(core.debug).toHaveBeenCalledWith(JSON.stringify(Parameters));
  });

  it("executes additional commands if NextToken present", async () => {
    const Parameters = [{Name: 'xxx', Value: 'yyy'}];
    let calls = 0;
    const send = jest.fn(async () => {
      if (calls == 0) {
        calls++;
        return ({Parameters, NextToken: 'x'});
      } else {
        return ({Parameters});
      }
    });
    (MockedClient as jest.Mock).mockImplementationOnce(() => ({send}));

    await main();

    expect(send).toHaveBeenCalledTimes(2);
  });
});