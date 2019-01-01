import assert from 'assert';
import JsToHcl from '../JsToHcl';
import requiredParam from '../statics/requiredParam';
import md5 from '../statics/md5';
import throwError from '../statics/throwError';
import DeploymentConfig from '../DeploymentConfig';
import createTerraformStringInterpolation from '../statics/createTerraformStringInterpolation';
import resourceExistsInList from '../statics/resourceExistsInList';

/**
 * Creates an instance of Resource.
 *
 * @param {deploymentConfig} deploymentConfig - DeploymentConfig instance
 * @param {type} type - Resource type, e.g. aws_iam_role
 * @param {name} name - Resource name, some name for the resource
 * @param {body} body - Resource body, the terraform key value pairs
 * @class Resource
 */
class Resource {
  constructor(
    deploymentConfig = requiredParam('deploymentConfig'),
    type = requiredParam('type'),
    name = requiredParam('name'),
    body = requiredParam('body'),
  ) {
    assert(deploymentConfig instanceof DeploymentConfig, 'deploymentConfig must be an instance of DeploymentConfig');
    assert(typeof type === 'string', 'type must be string');
    assert(typeof name === 'string', 'name must be string');
    assert(typeof body === 'object', 'name must be object');

    this.type = type;
    this.name = name;

    this.deploymentConfig = deploymentConfig;

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
  versionedName() {
    /* must depend on these 7 parameters */
    const uri = this.getUri();

    const normalizeProjectName = this.deploymentConfig.namespace.project.getValue()
      .slice(0, 19)
      .replace(/[^A-Za-z0-9]/g, '')
      .toLowerCase();

    const versionedName = `tij${normalizeProjectName}${md5(uri).slice(0, 8)}`;
    return versionedName;
  }

  /**
   * Returns the resource uri. This consists of the api uri and the resource type and name.
   *
   * @returns {string} uri
   * @memberof Resource
   */
  getUri() {
    const uri = `${this.deploymentConfig.getUri()}/${this.type}/${this.name}`;
    return uri;
  }

  /**
   * List of remote states to add the the HCL file when deriving it for isolated deployment
   *
   * @memberof Resource
   */
  remoteStates = [];

  /**
   * List of outputs to add the the HCL file when deriving it for isolated deployment
   *
   * @memberof Resource
   */
  outputs = [];

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

  addOutputKey(key = requiredParam('key')) {
    if (typeof key !== 'string') {
      throwError('key must be a string');
    }
    if (!this.outputs.includes(key)) {
      this.outputs.push(key);
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
        const versionedName = resource.versionedName();
        return resource.api.deployment.backend.getDataConfig(versionedName);
      })
      .join('\n');

    const outputs = this.outputs
      .map(
        (key) =>
          `output "${key}" {${converter.stringify({
            value: createTerraformStringInterpolation(
              `${this.type}.${this.name}.${key}`,
            ),
          })}}`,
      )
      .join('\n');

    const providerHcl = this.api.provider.getHcl();
    const backendHcl = this.api.deployment.backend.getBackendHcl(
      this.versionedName(),
    );
    return [
      providerHcl,
      backendHcl,
      resourceHcl,
      remoteDataSourcesHcl,
      outputs,
    ].join('\n');
  }
}

export default Resource;
