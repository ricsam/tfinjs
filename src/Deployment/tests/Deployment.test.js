import hcl2js from 'hcl2js';
import Deployment from '..';
import { join } from 'path';
import hclPrettify from '../../statics/hclPrettify';
import snapshot from '../../testUtils/snapshot';

/* eslint-env jest */

xtest('Deployment of apis', async () => {
  // the deployment will host all of the remote state data sources in terraform.
  const deployment = new Deployment({ dist: './dist/out.tf' });
  // or const deployment = require('../deployment.js');

  // the api is a collection of resources under a certain namespace and deployment params.
  const deploymentParams = {
    project: 'dep-tst-proj',
    environment: 'stage',
    version: 'v1',
    platform: 'aws/eu-north-1',
  };
  const api = deployment.createApi({
    deploymentParams,
    namespace: 'somepath/someservice',
  });
  const petRole = api.resource('aws_iam_role', 'pets', {
    name: api.versionedName(),
    allow: {
      dynamodb: '*',
    },
  });
  const petTable = api.resource('aws_dynamodb_table', 'pets', {
    name: api.versionedName(),
    arn: api.reference(petRole, 'arn'),
    provisionedRWs: {
      read: 5,
      write: 5,
    },
  });

  await Promise.all(
    deployment.build().map(async (hcl, index) => {
      const prettyHcl = await hclPrettify(hcl);
      snapshot(join(__dirname, 'Deployment.test.out', `${index}.tf`), prettyHcl, false);
    }),
  );
});
