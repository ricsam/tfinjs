import JsToHcl from '../../JsToHcl';

/**
 * Creates a new provider instance for an Api
 *
 * @param {string} provider name
 * @param {object} body of the provider config
 * @param {providerId} providerId
 * @class Provider
 */
class Provider {
  constructor(provider, body, id) {
    this.provider = provider;
    this.body = body;
    this.id = id;
  }

  /**
   * Get the providerId
   *
   * @returns {providerId} providerId
   * @memberof Provider
   */
  getId() {
    return this.id;
  }

  /**
   * Gets the HCL for the provider
   *
   * @returns {hcl} The provider code
   * @memberof Provider
   */
  getHcl() {
    const converter = new JsToHcl();
    const providerBody = converter.stringify(this.body);
    return `provider "${this.provider}" { ${providerBody} }`;
  }
}

export default Provider;
