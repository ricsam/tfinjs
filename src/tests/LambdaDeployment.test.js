import { join } from 'path';
import Provider from '../Provider';
import Backend from '../Backend';
import Project from '../Project';
import Namespace from '../Namespace';
import DeploymentConfig from '../DeploymentConfig';
import Resource from '../Resource';
import { reference, versionedName } from '../helpers';
import saveProject from './saveProject';

const awsProviderUri = (accountId, region) => `aws/${accountId}/${region}`;

/* eslint-env jest */
test('The lambda deployment example test', async () => {
  const backend = new Backend('s3', {
    backendConfig: (name) => ({
      bucket: 'terraform-state-prod',
      key: `${name}.terraform.tfstate`,
      region: 'us-east-1',
    }),
    dataConfig: (name) => ({
      bucket: 'terraform-state-prod',
      key: `${name}.terraform.tfstate`,
      region: 'us-east-1',
    }),
  });

  const awsAccoundId = '133713371337';
  const awsRegion = 'eu-north-1';

  const project = new Project('pet-shop', backend);

  const namespace = new Namespace(project, 'services/lambdas/add-pet');

  const deploymentConfig = new DeploymentConfig(namespace, {
    environment: 'stage',
    version: 'v1',
    provider: new Provider(
      'aws',
      {
        region: awsRegion,
        assume_role: {
          role_arn: `arn:aws:iam::${awsAccoundId}:role/DeploymentRole`,
        },
      },
      awsProviderUri(awsAccoundId, awsRegion),
    ),
  });

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
      /* api.reference registers a remote state
       on the petLambda resource and gets the
       terraform interpolation string to reference
       the arn of the remote state */
      role: reference(petLambdaExecRole, 'arn'),
      /* function_name === s3_key here.
       api.versionedName is a helper that
       returns a callback that returns the
       versionedName of the petLambda resource */
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

  await saveProject(project, join(__dirname, 'LambdaDeployment.test.out'));
});
