import assertApiConstructorParams from '../assertions/assertApiConstructorParams';
import Resource from '../Resource';
import requiredParam from '../../statics/requiredParam';

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

  resource(type = requiredParam('type'), name = requiredParam('name'), params = requiredParam('params')) {
    if (typeof type !== 'string') {
      const error = new Error('type must be a string');
      throw error;
    }
    if (typeof name !== 'string') {
      const error = new Error('name must be a string');
      throw error;
    }
    const resource = new Resource({
      deploymentParams: this.deploymentParams,
      namespace: this.namespace,
      type,
      name,
      params,
    });

    this.addResource(resource);

    return resource;
  }

  static assertConstructorParams = assertApiConstructorParams;

  static versionedName() {
    return (resource = requiredParam('resource')) => {
      if (!(resource instanceof Resource)) {
        const error = new Error('resource must be a instance of Resource');
        throw error;
      }

      return resource.getVersionedName();
    };
  }

  static reference(resource = requiredParam('resource'), param = requiredParam('param')) {
    if (!(resource instanceof Resource) || typeof param !== 'string') {
      const error = new Error(
        'Invalid signature of the refenrece, resource must be instance of Resource and param must be a stirng',
      );
      throw error;
    }

    return (sourceResource = requiredParam('sourceResource')) => {
      sourceResource.registerRemoteState(resource);

      return `data.terraform_remote_state.${resource.getVersionedName()}.${param}`;
    };
  }
}
export default Api;
