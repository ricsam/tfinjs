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

/**
 * Create collection of API instances and resources. All created resources are accessable in the instance of the Deployment.
 *
 * @class Deployment
 */
class Deployment {
  /**
   * Array of added resources
   *
   * @memberof Deployment
   */
  resources = [];

  /**
   * Registers a new resource
   *
   * @param {resource} resource - The resource to be added
   * @memberof Deployment
   */
  addResource(resource = requiredParam('resource')) {
    if (resourceExistsInList(this.resources, resource)) {
      const error = new Error(
        'You currently have multiple resources with the same properties which is not allowed',
      );
      throw error;
    }

    this.resources.push(resource);
  }

  /**
   * Creates a public api within a namespace and a set of deployment params
   *
   * @param {object} params - Function parameters
   * @param {deploymentParams} params.deploymentParams - Deployment params
   * @param {string} params.namespace - The namespace
   * @returns publicApi - The public api
   * @memberof Deployment
   */
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

  /**
   * Returns the HCL files for the deployment in an array.
   *
   * @returns {string[]} isolatedDeployments - Array of hcl files that should be deployed in isolation
   * @memberof Deployment
   */
  build() {
    return this.resources.map((resource) => resource.getHcl());
  }
}

export default Deployment;
