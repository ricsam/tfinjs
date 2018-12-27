import assert from 'assert';
import Resource from '../Resource';
import requiredParam from '../../statics/requiredParam';
import createTerraformStringInterpolation from '../statics/createTerraformStringInterpolation';
import assertDeploymentParamsSignature from '../../assertions/assertDeploymentParamsSignature';
import Deployment from '..';
import Provider from '../Provider';

/**
 *
 *
 * @param {object} params - Function parameters
 * @param {deploymentParams} params.deploymentParams - Deployment params
 * @param {namespace} params.namespace - Namepsace
 * @param {deployment} params.deployment - Deployment instance
 * @param {provider} params.provider - Provider instance
 * @class Api
 */
class Api {
  constructor({
    deploymentParams = requiredParam('deploymentParams'),
    namespace = requiredParam('namespace'),
    deployment = requiredParam('deployment'),
    provider = requiredParam('provider'),
  }) {
    assertDeploymentParamsSignature(deploymentParams, this.constructor);
    assert(typeof namespace === 'string', 'namespace must be string');
    assert(
      deployment instanceof Deployment,
      'deployment must be an instance of Deployment',
    );
    assert(
      provider instanceof Provider,
      'provider must be an instance of Provider',
    );

    this.deploymentParams = deploymentParams;

    this.namespace = namespace;
    this.deployment = deployment;
    this.provider = provider;
  }

  /**
   * Exposed in the public API
   *
   * @param {string} type - Resource type
   * @param {string} name - Resource name
   * @param {string} body - Resource body
   * @returns resource
   * @memberof Api
   */
  resource(
    type = requiredParam('type'),
    name = requiredParam('name'),
    body = requiredParam('body'),
  ) {
    assert(typeof type === 'string', 'type must be string');
    assert(typeof name === 'string', 'name must be string');
    assert(typeof body === 'object', 'namespace must be object');

    const resource = new Resource({
      api: this,
      type,
      name,
      body,
    });

    this.deployment.addResource(resource);

    return resource;
  }

  /**
   * Exposed in the public API
   *
   * @static
   * @returns {function} resourceBodyCallback - will return the versioned name of the resource
   * @memberof Api
   */
  static versionedName() {
    return (resource = requiredParam('resource')) => {
      assert(
        resource instanceof Resource,
        'resource must be an instance of Resource',
      );

      return resource.versionedName();
    };
  }

  /**
   * Gets the id of the API.
   * Is unique based on
   * project, environment, version,
   * provider id and the namespace.
   *
   * @returns {apiId} apiId - The Api id
   * @memberof Api
   */
  getId() {
    const { project, environment, version } = this.deploymentParams;
    const id = `${project}/${environment}/${version}/${this.provider.getId()}/${this.namespace}`;
    return id;
  }

  /**
   * Exposed in the public API
   *
   * @static
   * @param {string} resource - resource
   * @param {string} key - Resource key to access
   * @returns {function} resourceBodyCallback - will register the a remote state and return the HCL interpolation string.
   * @memberof Api
   */
  static reference(
    resource = requiredParam('resource'),
    key = requiredParam('key'),
  ) {
    assert(
      resource instanceof Resource,
      'resource must be an instance of Resource',
    );
    assert(typeof key === 'string', 'key must be string');

    return (sourceResource = requiredParam('sourceResource')) => {
      assert(
        sourceResource instanceof Resource,
        'sourceResource must be an instance of Resource',
      );
      sourceResource.registerRemoteState(resource);
      resource.addOutputKey(key);

      return createTerraformStringInterpolation(
        `data.terraform_remote_state.${resource.versionedName()}.${key}`,
      );
    };
  }
}
export default Api;
