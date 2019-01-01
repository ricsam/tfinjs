/* eslint-env jest */
import { join } from 'path';
import awsProviderUri from '../Provider/uris/aws';
import Provider from '../Provider';
import Deployment from '..';
import Backend from '../Backend';
import saveDeployment from './saveDeployment';

test('simpleResources', async () => {
  const awsAccoundId = 13371337;
  const awsRegion = 'eu-north-1';

  const provider = new Provider(
    'aws',
    {
      region: awsRegion,
      assume_role: {
        role_arn: `arn:aws:iam::${awsAccoundId}:role/DeploymentRole`,
      },
    },
    awsProviderUri(awsAccoundId, awsRegion),
  );

  const backendBucketName = 'terraform-state-prod';
  const backendBucketRegion = 'us-east-1';

  const deployment = new Deployment({
    backend: new Backend('s3', {
      backendConfig: (versionedName) => ({
        bucket: backendBucketName,
        key: `${versionedName}.terraform.tfstate`,
        region: backendBucketRegion,
      }),
      dataConfig: (versionedName) => ({
        bucket: backendBucketName,
        key: `${versionedName}.terraform.tfstate`,
        region: backendBucketRegion,
      }),
      provider: new Provider(
        'aws',
        {
          region: backendBucketRegion,
          assume_role: {
            role_arn: `arn:aws:iam::${awsAccoundId}:role/DeploymentRole`,
          },
        },
        awsProviderUri(awsAccoundId, backendBucketRegion),
      ),
      create: (resource) =>
        resource('aws_s3_bucket', 'terraform_state_prod', {
          bucket: backendBucketName,
          acl: 'private',
          versioning: {
            enabled: true,
          },
        }),
    }),
  });
  /* the api is a collection of resources under
   a certain namespace and deployment params. */
  const api = deployment.createApi({
    deploymentParams: {
      project: 'pet-shop',
      environment: 'stage',
      version: 'v1',
    },
    namespace: 'services/lambdas/add-pet',
    provider,
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
    s3_key: api.versionedName(),
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
  await saveDeployment(deployment, join(__dirname, 'simpleResources.test.out'));
});
