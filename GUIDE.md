Guide
=====

The API consists of 6 classes: `Provider`, `Backend`, `Project`, `Namespace`, `DeploymentConfig` and `Resource`. There are two helper functions: `versionedName` and `reference`.

To start deploying resources you will create a project. The project contains namespaces from which you can create deployment-configs that configures the where, how and under which name new resources should be deployed.

With the helper function `versionedName` you can access resources in standarized way during both build time and run time.

First define how you want to access resources by using the Backend class. If you want to create the backend as well you can add the create function and a provider.
### Backend
```javascript
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
```
With a provider and the create function:

```javascript
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
```


### versionedName
```typescript
function versionedName(): function (resource): string
```
The `versionedName()(resource)` will return a string consisting of a substring of the project name and a 8 character slice of an md5 hash derived from. This ensures no naming conflicts will occur when following this schema.

1. project
2. deployment environment
3. deployment version
4. platform uri - identifies the platform might be e.g. `aws/${awsAccountId}/${awsRegion}`. It is important to stay consistent with the construction of the platform uri in order to be able to reference resources during the runtime and avoid naming collisions.
5. namespace
6. resource type - the terraform resource type
7. resource name - a unique name for the resource (unique under the current namespace)







