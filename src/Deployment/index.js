import assert from 'assert';
import resourceExistsInList from './statics/resourceExistsInList';
import Api from './Api';
import requiredParam from '../statics/requiredParam';
import Backend from './Backend';
import Resource from './Resource';
import assertDeploymentParamsSignature from '../assertions/assertDeploymentParamsSignature';
import Provider from './Provider';

/**
 * Create collection of API instances and resources.
 * All created resources are accessable in the instance of the Deployment.
 *
 * @class Deployment
 */
class Deployment {
  constructor({ backend = requiredParam('backend') }) {
    assert(
      backend instanceof Backend,
      'backend must be an instance of Backend',
    );
    this.backend = backend;
  }

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
    assert(
      resource instanceof Resource,
      'resource must be an instance of Resource',
    );
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
   * @param {provider} params.provider - The provider instance
   * @returns publicApi - The public api
   * @memberof Deployment
   */
  createApi({
    deploymentParams = requiredParam('deploymentParams'),
    namespace = requiredParam('namespace'),
    provider = requiredParam('provider'),
  }) {
    assertDeploymentParamsSignature(deploymentParams, this.createApi);
    assert(typeof namespace === 'string', 'namespace must be string');
    assert(
      provider instanceof Provider,
      'provider must be an instance of Provider',
    );

    const props = {
      deploymentParams,
      namespace,
      deployment: this,
      provider,
    };

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
