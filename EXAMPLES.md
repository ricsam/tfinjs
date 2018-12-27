Examples
========


## Table of Contents
* [Lambda deployment](#lambda-deployment)



## Lambda deployment
```javascript
const deployment = new Deployment({
  backend: new Backend('s3', {
    backendConfig: (versionedName) => ({
      bucket: 'terraform-state-prod',
      key: `${versionedName}.terraform.tfstate`,
      region: 'us-east-1',
    }),
    dataConfig: (versionedName) => ({
      bucket: 'terraform-state-prod',
      key: `${versionedName}.terraform.tfstate`,
      region: 'us-east-1',
    }),
  }),
});

const awsAccoundId = '133713371337';
const awsRegion = 'eu-north-1';

/* the api is a collection of resources under
    a certain namespace and deployment params. */
const api = deployment.createApi({
  deploymentParams: {
    project: 'pet-shop',
    environment: 'stage',
    version: 'v1',
  },
  namespace: 'services/lambdas/add-pet',
  provider: new Provider(
    'aws',
    {
      region: awsRegion,
      assume_role: {
        role_arn: `arn:aws:iam::${awsAccoundId}:role/DeploymentRole`,
      },
    },
    awsProviderId(awsAccoundId, awsRegion),
  ),
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
  /* api.reference registers a remote state
      on the petLambda resource and gets the
      terraform interpolation string to reference
      the arn of the remote state */
  role: api.reference(petLambdaExecRole, 'arn'),
  /* function_name === s3_key here.
      api.versionedName is a helper that
      returns a callback that returns the
      versionedName of the petLambda resource */
  function_name: api.versionedName(),
  s3_key: (resource) => resource.versionedName(),
  s3_bucket: 'pet-lambda-bucket',
  handler: 'service.handler',
  runtime: 'nodejs8.10',
  timeout: 20,
  memory_size: 512,
});

const petLambdaName = petLambda.versionedName();

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
          Resource: `${logGroupPrefix}/${petLambdaName}:*`,
        },
        {
          Action: ['logs:PutLogEvents'],
          Effect: 'Allow',
          Resource: `${logGroupPrefix}/${petLambdaName}:*:*`,
        },
      ],
    }),
  },
);

api.resource(
  'aws_iam_role_policy_attachment',
  'cloud_watch_role_attachment',
  {
    role: api.reference(petLambdaExecRole, 'name'),
    policy_arn: api.reference(cloudwatchPolicy, 'arn'),
  },
);

```
