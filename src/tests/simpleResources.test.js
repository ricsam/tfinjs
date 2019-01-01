/* eslint-env jest */
import { join } from 'path';
import awsProviderUri from '../Provider/uris/aws';
import Provider from '../Provider';
import Backend from '../Backend';
import saveProject from './saveProject';
import Project from '../Project';
import Namespace from '../Namespace';
import DeploymentConfig from '../DeploymentConfig';
import Resource from '../Resource';
import { reference, versionedName } from '../helpers';

test('simpleResources', async () => {
  const awsAccoundId = 13371337;
  const awsRegion = 'eu-north-1';
  const backendBucketName = 'terraform-state-prod';
  const backendBucketRegion = 'us-east-1';

  const backend = new Backend('s3', {
    backendConfig: (name) => ({
      bucket: backendBucketName,
      key: `${name}.terraform.tfstate`,
      region: backendBucketRegion,
    }),
    dataConfig: (name) => ({
      bucket: backendBucketName,
      key: `${name}.terraform.tfstate`,
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
  });

  const project = new Project('pet-shop', backend);

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

  const namespace = new Namespace(project, 'services/lambdas/add-pet');

  const deploymentConfig = new DeploymentConfig(namespace, {
    environment: 'stage',
    version: 'v1',
    provider,
  });

  /* the api is a collection of resources under
   a certain namespace and deployment params. */

  const petLambdaExecRole = new Resource(
    deploymentConfig,
    'aws_iam_role',
    'pets',
    {
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
    },
  );
  const logGroupPrefix = `arn:aws:logs:${awsRegion}:${awsAccoundId}:log-group:/aws/lambda`;
  const petLambda = new Resource(
    deploymentConfig,
    'aws_dynamodb_table',
    'pets',
    {
      description: 'pet lambda',
      role: reference(petLambdaExecRole, 'arn'),
      function_name: versionedName(),
      s3_key: versionedName(),
      s3_bucket: 'pet-lambda-bucket',
      handler: 'service.handler',
      runtime: 'nodejs8.10',
      timeout: 20,
      memory_size: 512,
    },
  );
  const petLambdaName = petLambda.versionedName();
  const cloudwatchPolicy = new Resource(
    deploymentConfig,
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
  const config = new Resource(
    deploymentConfig,
    'aws_iam_role_policy_attachment',
    'cloud_watch_role_attachment',
    {
      role: reference(petLambdaExecRole, 'name'),
      policy_arn: reference(cloudwatchPolicy, 'arn'),
    },
  );
  await saveProject(project, join(__dirname, 'simpleResources.test.out'));
});
