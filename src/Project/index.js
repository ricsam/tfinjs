import assert from 'assert';
import Backend from '../Backend';
import requiredParam from '../statics/requiredParam';
import Resource from '../Resource';
import resourceExistsInList from '../statics/resourceExistsInList';

class Project {
  constructor(project, backend) {
    assert(typeof project === 'string', 'project must be a string');
    assert(backend instanceof Backend, 'backend must be instance of Backend');
    this.project = project;
    this.backend = backend;
  }

  getValue() {
    return this.project;
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
   * Gets the resources of the deployment
   *
   * @returns {resources[]} resources - array of resources
   * @memberof Deployment
   */
  getResources() {
    return this.resources;
  }
}

export default Project;
