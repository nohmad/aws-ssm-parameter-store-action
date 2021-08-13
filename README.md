# AWS SSM Parameter Store Action

Write each pair of name and value of parameters selected by path out to file, each combined by `=` and `\n`, so as to conform `.env` format.

```yml
  - name: Run aws ssm send-command
    uses: nohmad/aws-ssm-send-command-action@master
    with:
      aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
      aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      aws-region: ap-northeast-2
      path: /config/application/production/
      filename: .env
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

## Outputs

### count

Number of parameters brought by path.

## Author

GY Noh <nohmad@gmail.com>

# LICENSE

MIT License
