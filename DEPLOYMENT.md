# Deployment Guide to AWS Lambda

## Prerequisites

1. **AWS Account** - Create one at https://aws.amazon.com
2. **AWS Credentials** - Get Access Key ID and Secret Access Key
3. **AWS CLI** - Already installed ✅

## Step 1: Configure AWS Credentials

You need valid AWS Access Key and Secret Access Key from your AWS Account.

```powershell
aws configure
```

When prompted, enter:
- **AWS Access Key ID**: Your access key
- **AWS Secret Access Key**: Your secret key
- **Default region name**: eu-central-1
- **Default output format**: json

## Step 2: Verify Credentials

```powershell
aws sts get-caller-identity
```

Should return your AWS Account ID and user info.

## Step 3: Deploy to AWS Lambda

### Deploy to Development:
```powershell
npx serverless deploy --stage dev
```

### Deploy to Production:
```powershell
npx serverless deploy --stage prod
```

## Step 4: Test Your Deployment

After deployment, you'll get an HTTPS endpoint. Test it with:

```powershell
$endpoint = "YOUR_ENDPOINT_HERE"
$query = @{ query = "{ listBooks { id title } }" } | ConvertTo-Json

Invoke-RestMethod -Uri "$endpoint/graphql" -Method Post `
  -Headers @{"Content-Type"="application/json"} `
  -Body $query
```

## Step 5: View Logs

```powershell
npx serverless logs -f graphql --stage dev
```

## Step 6: Remove Deployment (if needed)

```powershell
npx serverless remove --stage dev
```

## Environment Variables

The deployment will automatically create:
- **DynamoDB Tables**: `bookhub-api-books-dev` and `bookhub-api-authors-dev`
- **Lambda Function**: `bookhub-api-dev-graphql`
- **API Endpoint**: HTTPS endpoint for your GraphQL API

## Cost Considerations

- **DynamoDB**: Pay per request (usually very cheap for low traffic)
- **Lambda**: Free tier includes 1M invocations/month
- **API Gateway**: $0.75 per million requests

## Troubleshooting

### Invalid credentials
- Check your AWS Access Key ID and Secret Access Key
- Ensure they're from an IAM user with proper permissions

### Deployment fails
- Run with `--verbose` for more details: `npx serverless deploy --verbose`
- Check CloudFormation stack errors in AWS Console

### Lambda timeout
- Increase timeout in serverless.yml under `functions.graphql.timeout: 30`
