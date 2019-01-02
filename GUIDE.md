Guide
=====

The API consists of 6 classes: `Provider`, `Backend`, `Project`, `Namespace`, `DeploymentConfig` and `Resource`. There are two helper functions: `versionedName` and `reference`.

To start deploying resources you will create a project. The project contains namespaces from which you can create deployment-configs that configures the where, how and under which name new resources should be deployed.

With the helper function `versionedName` you can access resources in standarized way during both build time and run time.


# Classes
### Provider
```typescript
new Provider(provider: string, providerBody: object, providerUri: string)
```
The [provider](https://www.terraform.io/docs/providers/aws/index.html) is how you autheniticate with the tennant and also dictates where the resources will be provisioned. The provider for tfinjs can be created using the Provider class:


```javascript
const provider = new Provider(
  'aws',
  {
    region: awsRegion,
    assume_role: {
      role_arn: `arn:aws:iam::${awsAccoundId}:role/DeploymentRole`,
    },
  },
  `aws/${awsAccoundId}/${awsRegion},
);
```

The provider body is a json representation of the HCL from the terraform documentation.
The providerUri must be unique for the tennant and must be a fuction the parameters in the providerBody.

### Backend
```typescript
new Backend(tennantName: string, { backendConfig: function (name: string): object, dataConfig: function (name: string): object, provider: ?provider, create: ?function(resourceCreationFunction: function(type: string, name: string, body: object): backendResource ): backendResource })
```
A [terraform backend](https://www.terraform.io/docs/backends/types/s3.html) is required for tfinjs to work. To define it use the Backend class. If you want to create the backend as well you can add the create function and a provider.

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

### Project
```typescript
new Project(projectName: string, backend: backend)
```
With a backend you can create a new project with a project name

```javascript
const petShop = new Project('pet-shop', backend);
```

### Namespace
```typescript
new Namespace(project: project, namespaceValue: string)
```
When you are bootstraping your projectet you will have different parts of the application spread accross multiple folders. The path to each of these folders could be the namespacing schema. Each namespace represent a group of resources.

```javascript
const addCustomer = new Namespace(petShop, 'services/customers/add')
```


### DeploymentConfig
```typescript
new DeploymentConfig(namespace: namespace, { environment: string, version: string, provider: provider })
```
The version and environment passed to the deployment config could for example be derived from the git hash or branch. These parameters will be used in `versionedName`, thus you deploy the same resource under different deployment parameters. In the provider you specify the tennant configurations, e.g. on aws you would specify the region which is where the resources will be deployed.

```javascript
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
    `aws/${awsAccountId}/${awsRegion}`
  ),
});
```

### Resouce
```typescript
new Resource(deploymentConfig: deploymentConfig, resourceType: string, resourceName: string, resourceBody: object)
```

Whenever creating a new resource it will be added to the project through the constructor call. The `resourceType`, `resourceName` and `resourceBody` corresponds to how you would define a resource in terraform. You cannot have multiple resources with the same `resourceName`, `resourceType` and `deploymentConfig`. The return value is the resource instance which you can use in the `reference` helper function reference a terraform output attribute.

```javascript
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
```


# Helper functions

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


### reference
```typescript
function reference(): function (resource: resource, attributeKey: string)
```
Will return a terraform string interpolation referencing a data resource and attribute that points to the remote backend of the resource.





