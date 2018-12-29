import assert from 'assert';
import throwError from '../../statics/throwError';
import JsToHcl from '../../JsToHcl';
import requiredParam from '../../statics/requiredParam';
import Provider from '../Provider';

/**
 * Creates an instance of Backend.
 *
 * @param {string} backend - the backend name
 * @param {object} config
 * @param {function=} config.backendConfig - Config for the terraform { backend { ... } }
 * @param {function=} config.dataConfig - Config for the terraform_remote_state
 * @param {provider=} config.provider - The provider which will be used to deploy the backend source
 * @param {function=} config.create - A function taking resource creating function as the first argument and expects the resource to be returned. The resource should be the backend source.
 * @class Backend
 */
class Backend {
  constructor(
    backend = requiredParam('backend'),
    {
      backendConfig,
      dataConfig,
      provider,
      create,
    } = {},
  ) {
    assert(typeof backend === 'string' || backend === null, 'backend must be string or null');
    assert(
      typeof backendConfig === 'undefined'
        || typeof backendConfig === 'function',
      'backendConfig must be function if defined',
    );
    assert(
      typeof dataConfig === 'undefined' || typeof dataConfig === 'function',
      'dataConfig must be function if defined',
    );
    assert(
      typeof create === 'function' || typeof create === 'undefined',
      'create must be function if defined',
    );
    assert(
      typeof provider === 'undefined' || provider instanceof Provider,
      'provider must be instance of Provider if defined',
    );

    if ((provider && !create) || (!provider && create)) {
      throwError(
        'You must provide both the provider and the create function',
        this.constructor,
      );
    }

    this.backend = backend;
    this.backendConfig = backendConfig;
    this.dataConfig = dataConfig;

    this.provider = provider;
    this.create = create;
  }

  /**
   * If the backend should be created, (only if provider and create has been provided)
   *
   * @returns {boolean} shouldCreateBackend - If the backend should be created
   * @memberof Backend
   */
  shouldCreateBackend() {
    return this.provider && this.create;
  }

  /**
   * Gets the provided provider
   *
   * @returns {provider} provider - Instance of provider optionally provided to the constructor
   * @memberof Backend
   */
  getProvider() {
    return this.provider;
  }

  /**
   * Gets the create function which will create the resource that constitutes the backend
   *
   * @returns {function} create - The create function optionally provided to the contructor
   * @memberof Backend
   */
  getCreate() {
    return this.create;
  }

  /**
   * Creates the terraform backend configuration in HCL
   *
   * @param {versionedName} versionedName
   * @returns {hcl} hcl
   * @memberof Backend
   */
  getBackendHcl(versionedName = requiredParam('versionedName')) {
    assert(typeof versionedName === 'string', 'versionedName must be string');

    if (this.backend === null) {
      return '';
    }

    assert(
      this.backendConfig,
      'You must define the backendConfig on the backend in order to make other resources be able to reference the resource (unless the specified backend is null)',
    );

    const jsToHcl = new JsToHcl();
    const hcl = `terraform { backend "${this.backend}" { ${jsToHcl.stringify(
      this.backendConfig(versionedName),
    )} } }`;

    return hcl;
  }

  /**
   * Creates the terraform_remote_state configuration in HCL
   *
   * @param {versionedName} versionedName
   * @returns {hcl} hcl
   * @memberof Backend
   */
  getDataConfig(versionedName = requiredParam('versionedName')) {
    assert(typeof versionedName === 'string', 'versionedName must be string');
    assert(
      this.dataConfig,
      'You must define the dataConfig on the backend in order to be able to reference other resources',
    );

    const jsToHcl = new JsToHcl();
    const params = {
      backend: 's3',
      config: this.dataConfig(versionedName),
    };
    const hcl = `data "terraform_remote_state" "${versionedName}" {${jsToHcl.stringify(
      params,
    )}}`;

    return hcl;
  }
}
export default Backend;
