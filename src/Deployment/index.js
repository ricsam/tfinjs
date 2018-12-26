import resourceExistsInList from './statics/resourceExistsInList';
import assertApiConstructorParams from './assertions/assertApiConstructorParams';
import Api from './Api';
import requiredParam from '../statics/requiredParam';

/*

    // the deployment will host all of the remote state data sources in terraform.
    const deployment = new Deployment({ dist: './dist/out.tf' });
    // or const deployment = require('../deployment.js');

    // the api is a collection of resources under a certain namespace and deployment params.
    const api = deployment.createApi({
      deploymentParams: { ... },
      namespace: 'somepath/someservice'
    });
    const petRole = api.resource('aws_iam_role', 'pets', {
      name: api.versionedName,
      allow: {
        dynamodb: '*'
      }
    });
    const petTable = api.resource('aws_dynamodb_table', 'pets', {
      name: api.versionedName,
      arn: reference(petRole, 'arn'),
      provisionedRWs: {
        read: 5,
        write: 5
      }
    });
  */

class Deployment {
  resources = [];

  addResource(resource = requiredParam('resource')) {
    if (resourceExistsInList(this.resources, resource)) {
      const error = new Error(
        'You currently have multiple resources with the same properties which is not allowed',
      );
      throw error;
    }

    this.resources.push(resource);
  }

  createApi({
    deploymentParams = requiredParam('deploymentParams'),
    namespace = requiredParam('namespace'),
  }) {
    const props = {
      deploymentParams,
      namespace,
      addResource: this.addResource.bind(this),
    };
    assertApiConstructorParams(props, this.createApi);

    const api = new Api(props);
    /* statics */
    const { versionedName, reference } = Api;

    /* public */
    return {
      resource: api.resource.bind(api),
      versionedName,
      reference,
    };
  }

  build() {
    return this.resources.map((resource) => resource.getHcl());
  }
}

export default Deployment;
