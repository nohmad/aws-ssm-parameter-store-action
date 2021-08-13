import * as core from '@actions/core';
import { SSMClient } from '@aws-sdk/client-ssm';
import fs from 'fs';

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
  ['filename', 'filename.txt'],
]);

describe("aws-parameter-store-action", () => {
  beforeEach(() => {
    getInput.mockImplementation((key) => DEFAULT_INPUTS.get(key) as string);
  });

  it("get parameters by path and then write out to file", async () => {
    const [Name, Value] = ['/config/path/XXX', 'yyy'];
    const send = jest.fn(async () => {
      return {Parameters: [{Name, Value}, {Name, Value}]};
    });
    (MockedClient as jest.Mock).mockImplementation(() => ({send}));

    await main();

    expect(fs.writeFileSync).toHaveBeenCalledWith(DEFAULT_INPUTS.get('filename'), `XXX=${Value}\nXXX=${Value}`);
    expect(core.setOutput).toHaveBeenCalledWith('count', 2);
  });
});