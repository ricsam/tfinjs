import assertApiConstructorParams from '../assertions/assertApiConstructorParams';
import resourceExistsInList from '../statics/resourceExistsInList';
import JsToHcl from '../../JsToHcl';
import requiredParam from '../../statics/requiredParam';
import md5 from '../../statics/md5';
import throwError from '../../statics/throwError';

/**
 * Creates an instance of Resource.
 *
 * @param {params} params - Function parameters
 * @param {deploymentParams} params.deploymentParams - Deployment params
 * @param {namespace} params.namespace - Namepsace
 * @param {type} params.type - Resource type, e.g. aws_iam_role
 * @param {name} params.name - Resource name, some name for the resource
 * @param {body} params.body - Resource body, the terraform key value pairs
 * @class Resource
 */
class Resource {
  constructor({
    deploymentParams = requiredParam('deploymentParams'),
    namespace = requiredParam('namespace'),
    type = requiredParam('type'),
    name = requiredParam('name'),
    body = requiredParam('body'),
  }) {
    assertApiConstructorParams(
      { deploymentParams, namespace },
      this.constructor,
    );

    if (
      typeof type !== 'string'
      || typeof name !== 'string'
      || typeof body !== 'object'
    ) {
      const error = new Error(
        'Invalid signature of the resource params: type, name, body',
      );
      throw error;
    }

    this.type = type;
    this.name = name;

    this.deploymentParams = deploymentParams;
    this.namespace = namespace;

    this.body = this.parseValue(body);
  }

  /**
   * Gets the resource body
   *
   * @returns {body} body - Resource body
   * @memberof Resource
   */
  getBody() {
    return this.body;
  }

  /**
   * Gets the resource type
   *
   * @returns {type} type - Resource type
   * @memberof Resource
   */
  getType() {
    return this.type;
  }

  /**
   * Gets the resource name
   *
   * @returns {name} name - Resource name
   * @memberof Resource
   */
  getName() {
    return this.name;
  }

  /**
   * Recursivly searches through the params for values of type function and then evaulates that function
   *
   * @param {params} params - params
   * @returns {params} params - params
   * @memberof Resource
   */
  parseValue(params = requiredParam('params')) {
    let result = params;
    if (typeof params === 'function') {
      result = params(this);
    } else if (typeof params === 'object' && !Array.isArray(params)) {
      result = this.mapObject(params);
    } else if (Array.isArray(params)) {
      result = this.mapArray(params);
    }
    if (result === null || typeof result === 'undefined') {
      throwError('Value cannot be null or undefined', this.parseValue);
    }
    return result;
  }

  /**
   * Parses each value in an object
   *
   * @param {params} params - params
   * @returns {params} params - params
   * @memberof Resource
   */
  mapObject(params = requiredParam('params')) {
    return Object.entries(params).reduce((c, [key, value]) => {
      const result = this.parseValue(value);
      return {
        ...c,
        [key]: result,
      };
    }, {});
  }

  /**
   * Parses each value in an array
   *
   * @param {params} params - params
   * @returns {params} params - params
   * @memberof Resource
   */
  mapArray(params = requiredParam('params')) {
    return params.map((value) => this.parseValue(value));
  }

  /**
   * Create the versioned name which is derived from the 7 parametes: project, environment, version, platform, namespace, type and name
   *
   * @returns {versionedName} versionedName - The versioned name
   * @memberof Resource
   */
  getVersionedName() {
    /* must depend on these 7 parameters */
    const {
      project, environment, version, platform,
    } = this.deploymentParams;
    const id = `${project}/${environment}/${version}/${platform}/${
      this.namespace
    }/${this.type}/${this.name}`;

    const normalizeProjectName = project
      .slice(0, 21)
      .replace(/\W/g, '')
      .toLowerCase();

    const versionedName = `swt${normalizeProjectName}${md5(id).slice(0, 6)}`;
    return versionedName;
  }

  /**
   * List of remote states to add the the HCL file when deriving it for isolated deployment
   *
   * @memberof Resource
   */
  remoteStates = [];

  /**
   * Maybe (if it doesn't already exist) adds a resource to a list which will be converted to a remove data state in the HCL during HCL file generation
   *
   * @param {string} resource - resource
   * @memberof Resource
   */
  registerRemoteState(resource = requiredParam('resource')) {
    if (!(resource instanceof Resource)) {
      throwError(
        'resource must be a instance of Resource',
        this.registerRemoteState,
      );
    }
    if (!resourceExistsInList(this.remoteStates, resource)) {
      this.remoteStates.push(resource);
    }
  }

  /**
   * Generates the HCL content of the resource (with remote states)
   *
   * @returns {hcl} hcl - hcl
   * @memberof Resource
   */
  getHcl() {
    const converter = new JsToHcl();
    const resourceHcl = `resource "${this.type}" "${
      this.name
    }" {${converter.stringify(this.body)}}`;

    const remoteDataSourcesHcl = this.remoteStates
      .map((resource) => {
        const versionedName = resource.getVersionedName();
        const params = {
          backend: 's3',
          config: {
            bucket: 'screed-terraform-state-2',
            key: `${versionedName}.terraform.tfstate`,
            region: 'eu-central-1',
          },
        };
        const hcl = `data "terraform_remote_state" "${versionedName}" {${converter.stringify(
          params,
        )}}`;
        return hcl;
      })
      .join('\n');
    return `${resourceHcl}\n${remoteDataSourcesHcl}`;
  }
}

export default Resource;
