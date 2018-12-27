Examples
========


## Table of Contents
* [Lambda deployment](#lambda-deployment)



## Lambda deployment
```javascript
// the deployment will host ALL of the resources
const deployment = new Deployment();

const awsAccoundId = '133713371337';
const awsRegion = 'eu-north-1';

// the api is a collection of resources under a certain namespace and deployment params.
const api = deployment.createApi({
  deploymentParams: {
    project: 'pet-shop',
    environment: 'stage',
    version: 'v1',
    platform: `aws/${awsAccoundId}/${awsRegion}`,
  },
  namespace: 'services/lambdas/add-pet',
});

const petLambdaExecRole = api.resource('aws_iam_role', 'pets', {
  assume_role_policy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Principal: {
          Service: 'lambda.amazonaws.com',
        },
        Effect: 'Allow',
        Sid: '',
      },
    ],
  }),
});

const logGroupPrefix = `arn:aws:logs:${awsRegion}:${awsAccoundId}:log-group:/aws/lambda`;


const petLambda = api.resource('aws_dynamodb_table', 'pets', {
  description: 'pet lambda',
  role: api.reference(petLambdaExecRole, 'arn'),
  function_name: api.versionedName(),
  s3_bucket: 'pet-lambda-bucket',
  s3_key: api.versionedName(),
  handler: 'service.handler',
  runtime: 'nodejs8.10',
  timeout: 20,
  memory_size: 512,
});

const petLambdaName = petLambda.getVersionedName();

const cloudwatchPolicy = api.resource(
  'aws_iam_policy',
  'cloudwatch_attachable_policy',
  {
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: ['logs:CreateLogStream'],
          Effect: 'Allow',
          Resource:
            `${logGroupPrefix}/${petLambdaName}:*`,
        },
        {
          Action: ['logs:PutLogEvents'],
          Effect: 'Allow',
          Resource:
            `${logGroupPrefix}/${petLambdaName}:*:*`,
        },
      ],
    }),
  },
);

api.resource('aws_iam_role_policy_attachment', 'cloud_watch_role_attachment', {
  role: api.reference(petLambdaExecRole, 'name'),
  policy_arn: api.reference(cloudwatchPolicy, 'arn'),
});

```