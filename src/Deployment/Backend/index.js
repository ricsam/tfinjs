import assert from 'assert';
import throwError from '../../statics/throwError';
import JsToHcl from '../../JsToHcl';
import requiredParam from '../../statics/requiredParam';

/**
 * Creates an instance of Backend.
 *
 * @param {string} backend - the backend name
 * @param {object} config
 * @param {object} config.backendConfig - Config for the terraform { backend { ... } }
 * @param {object} config.dataConfig - Config for the terraform_remote_state
 * @class Backend
 */
class Backend {
  constructor(
    backend = requiredParam('backend'),
    {
      backendConfig = requiredParam('backendConfig'),
      dataConfig = requiredParam('dataConfig'),
    },
  ) {
    assert(typeof backend === 'string', 'backend must be string');
    assert(
      typeof backendConfig === 'function',
      'backendConfig must be function',
    );
    assert(typeof dataConfig === 'function', 'dataConfig must be function');

    this.backend = backend;
    this.backendConfig = backendConfig;
    this.dataConfig = dataConfig;
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
