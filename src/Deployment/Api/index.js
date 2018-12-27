import assertApiConstructorParams from '../assertions/assertApiConstructorParams';
import Resource from '../Resource';
import requiredParam from '../../statics/requiredParam';

/**
 *
 *
 * @param {object} params - Function parameters
 * @param {deploymentParams} params.deploymentParams - Deployment params
 * @param {namespace} params.namespace - Namepsace
 * @param {addResource} params.addResource - Function which will add resource to the deployment instance
 * @class Api
 */
class Api {
  constructor({
    deploymentParams = requiredParam('deploymentParams'),
    namespace = requiredParam('namespace'),
    addResource = requiredParam('addResource'),
  }) {
    assertApiConstructorParams(
      {
        deploymentParams,
        namespace,
        addResource,
      },
      this.constructor,
    );

    this.deploymentParams = deploymentParams;
    this.namespace = namespace;
    this.addResource = addResource;
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
    if (typeof type !== 'string') {
      const error = new Error('type must be a string');
      throw error;
    }
    if (typeof name !== 'string') {
      const error = new Error('name must be a string');
      throw error;
    }
    if (typeof body !== 'object') {
      const error = new Error('body must be an object');
      throw error;
    }
    const resource = new Resource({
      deploymentParams: this.deploymentParams,
      namespace: this.namespace,
      type,
      name,
      body,
    });

    this.addResource(resource);

    return resource;
  }

  /**
   * Exposed in the public API
   *
   * @static
   * @returns versionedName
   * @memberof Api
   */
  static versionedName() {
    return (resource = requiredParam('resource')) => {
      if (!(resource instanceof Resource)) {
        const error = new Error('resource must be a instance of Resource');
        throw error;
      }

      return resource.getVersionedName();
    };
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
    if (!(resource instanceof Resource) || typeof key !== 'string') {
      const error = new Error(
        'Invalid signature of the refenrece, resource must be instance of Resource and key must be a string',
      );
      throw error;
    }

    return (sourceResource = requiredParam('sourceResource')) => {
      sourceResource.registerRemoteState(resource);

      return `data.terraform_remote_state.${resource.getVersionedName()}.${key}`;
    };
  }
}
export default Api;
