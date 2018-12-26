import assertApiConstructorParams from '../assertions/assertApiConstructorParams';
import resourceExistsInList from '../statics/resourceExistsInList';
import JsToHcl from '../../JsToHcl';
import requiredParam from '../../statics/requiredParam';
import md5 from '../../statics/md5';
import throwError from '../../statics/throwError';

class Resource {
  constructor({
    deploymentParams = requiredParam('deploymentParams'),
    namespace = requiredParam('namespace'),
    type = requiredParam('type'),
    name = requiredParam('name'),
    params = requiredParam('params'),
  }) {
    assertApiConstructorParams(
      { deploymentParams, namespace },
      this.constructor,
    );

    if (
      typeof type !== 'string'
      || typeof name !== 'string'
      || typeof params !== 'object'
    ) {
      const error = new Error(
        'Invalid signature of the resource params: type, name, params',
      );
      throw error;
    }

    this.type = type;
    this.name = name;

    this.deploymentParams = deploymentParams;
    this.namespace = namespace;


    this.params = this.parseValue(params);
  }

  getParams = () => this.params;

  getType = () => this.type;

  getName = () => this.name;

  parseValue = (params = requiredParam('params')) => {
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
  };

  mapObject = (params = requiredParam('params')) =>
    Object.entries(params).reduce((c, [key, value]) => {
      const result = this.parseValue(value);
      return {
        ...c,
        [key]: result,
      };
    }, {});

  mapArray = (params = requiredParam('params')) =>
    params.map((value) => this.parseValue(value));

  getVersionedName() {
    /* must depend on these 7 parameters */
    const {
      project, environment, version, platform,
    } = this.deploymentParams;
    const id = `${project}/${environment}/${version}/${platform}/${
      this.namespace
    }/${this.type}/${this.name}`;

    const normalizeProjectName = project.slice(0, 21).replace(/\W/g, '').toLowerCase();

    const versionedName = `swt${normalizeProjectName}${md5(id).slice(0, 6)}`;
    return versionedName;
  };

  remoteStates = [];

  registerRemoteState(resource = requiredParam('resource')) {
    if (!(resource instanceof Resource)) {
      throwError('resource must be a instance of Resource', this.registerRemoteState);
    }
    if (!resourceExistsInList(this.remoteStates, resource)) {
      this.remoteStates.push(resource);
    }
  }

  getHcl() {
    const converter = new JsToHcl();
    const resourceHcl = `resource "${this.type}" "${
      this.name
    }" ${converter.stringify(this.params)}`;

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
        const hcl = `data "terraform_remote_state" "${versionedName}" ${converter.stringify(
          params,
        )}`;
        return hcl;
      })
      .join('\n');
    return `${resourceHcl}\n${remoteDataSourcesHcl}`;
  }
}

export default Resource;
