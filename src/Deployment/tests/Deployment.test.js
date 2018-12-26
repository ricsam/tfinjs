import hcl2js from 'hcl2js';
import Deployment from '..';

/* eslint-env jest */

test('Deployment of apis', () => {
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

  const result = deployment.build().map((hclFile) => hcl2js.toJSON(hclFile));
  expect(result).toEqual([
    {
      resource: [
        {
          aws_iam_role: [
            {
              pets: [
                { allow: [{ dynamodb: '*' }], name: 'swtdeptstproj649d9b' },
              ],
            },
          ],
        },
      ],
    },
    {
      data: [
        {
          terraform_remote_state: [
            {
              swtdeptstproj649d9b: [
                {
                  backend: 's3',
                  config: [
                    {
                      bucket: 'screed-terraform-state-2',
                      key: 'swtdeptstproj649d9b.terraform.tfstate',
                      region: 'eu-central-1',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      resource: [
        {
          aws_dynamodb_table: [
            {
              pets: [
                {
                  arn: 'data.terraform_remote_state.swtdeptstproj649d9b.arn',
                  name: 'swtdeptstprojd194be',
                  provisionedRWs: [{ read: 5, write: 5 }],
                },
              ],
            },
          ],
        },
      ],
    },
  ]);
});
