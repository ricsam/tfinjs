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
    if (this.backend.shouldCreateBackend()) {
      /* create dummy deployment and api where the backend can be created */
      const deployment = new Deployment({
        backend: new Backend(null),
      });
      const api = deployment.createApi({
        deploymentParams: {
          project: '_',
          environment: '_',
          version: '_',
        },
        namespace: '_',
        provider: this.backend.getProvider(),
      });
      const create = this.backend.getCreate();
      create(api.resource.bind(api));
      this.resources = [
        ...deployment.resources,
      ];
    }
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
   * Gets the resources of the deployment
   *
   * @returns {resources[]} resources - array of resources
   * @memberof Deployment
   */
  getResources() {
    return this.resources;
  }
}

export default Deployment;
