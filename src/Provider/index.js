import JsToHcl from '../JsToHcl';

/**
 * Creates a new provider instance for an Api
 *
 * @param {string} provider name
 * @param {object} body of the provider config
 * @param {providerUri} providerUri
 * @class Provider
 */
class Provider {
  constructor(provider, body, uri) {
    this.provider = provider;
    this.body = body;
    this.uri = uri;
  }

  /**
   * Get the providerUri
   *
   * @returns {providerUri} providerUri
   * @memberof Provider
   */
  getUri() {
    return this.uri;
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
