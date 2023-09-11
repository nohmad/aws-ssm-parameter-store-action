# AWS SSM Parameter Store Action

Write each pair of name and value of parameters selected by path out to file, each combined by `=` and `\n`, so as to conform `.env` format.

Suppose you have following parameters in AWS's parameter store:

  * `/config/application/production/API_ENDPOINT`
  * `/config/application/production/API_KEY`

Run this action:

```yml
    - uses: aws-actions/configure-aws-credentials@v3
      name: Configure AWS Credentials
      with:
        role-to-assume: ROLE_ARN
        aws-region: ap-northeast-2
    - name: Prepare .env file
      uses: nohmad/aws-ssm-parameter-store-action@master
      with:
        path: /config/application/production/
        format: dotenv
        filename: .env
```

Then, you'll have `.env` file with following:

```
API_ENDPOINT=...
API_KEY=...
```

Make sure the IAM role given with `ROLE_ARN` has got `ssm:GetParametersByPath` permission on the parameters you want to get.

## Inputs

### path

**Required**. Path to parameters to get by

### pattern

Filter parameters specified by pattern

### filename

Filename to save the parameters

### format

Format to save as. *dotenv* format. *as-is* is also available. Even if you omit, you can still access to its `outputs`.

## Outputs

Base name and the value of the parameters are mapped to the outputs.

If you have a parameter named `/config/foo`, and you specified the input `path` as `/config/`, then you can access the value of the `/config/foo` by `${{steps.step-id.outputs.foo}}`.

## Author

GY Noh <nohmad@gmail.com>

# LICENSE

MIT License
