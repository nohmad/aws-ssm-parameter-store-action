# AWS SSM Parameter Store Action

Write each pair of name and value of parameters selected by path out to file, each combined by `=` and `\n`, so as to conform `.env` format.

Suppose you have following parameters in AWS's parameter store:

  * `/config/application/production/API_ENDPOINT`
  * `/config/application/production/API_KEY`

Run this action:

```yml
  - name: Configure environment variables
    uses: nohmad/aws-ssm-parameter-store-action@master
    with:
      aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
      aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      aws-region: ap-northeast-2
      path: /config/application/production/
      filename: .env
```

Then, you'll have `.env` file with following:

```
API_ENDPOINT=...
API_KEY=...
```

## Inputs

### aws-access-key-id

**Required**. `secrets.AWS_ACCESS_KEY_ID`

### aws-secret-access-key

**Required**. `secrets.AWS_SECRET_ACCESS_KEY`

### aws-region

**Required**. `secrets.AWS_REGION`

### path

**Required**.

### filename

**Required**. Filename to save the parameter values

## Outputs

### count

Number of parameters brought by path.

## Author

GY Noh <nohmad@gmail.com>

# LICENSE

MIT License
