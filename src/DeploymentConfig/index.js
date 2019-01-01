import assert from 'assert';
import Namespace from '../Namespace';
import Provider from '../Provider';

class DeploymentConfig {
  constructor(namespace, { environment, version, provider }) {
    assert(namespace instanceof Namespace);
    assert(typeof environment === 'string', 'environment must be string');
    assert(typeof version === 'string', 'version must be string');
    assert(
      provider instanceof Provider,
      'provider must be an instance of Provider',
    );

    this.namespace = namespace;
    this.environment = environment;
    this.version = version;
    this.provider = provider;
  }

  /**
 * Gets the uri of the API.
 * Is unique based on
 * project, environment, version,
 * providerUri and the namespace.
 *
 * @returns {apiUri} apiUri - The Api uri
 * @memberof Api
 */
  getUri() {
    const { environment, version, namespace } = this;
    const project = this.namespace.project.getValue();

    assert(namespace instanceof Namespace, 'namespace must be an instance of Namespace');
    assert(typeof environment === 'string', 'environment must be a string');
    assert(typeof version === 'string', 'version must be a string');
    assert(typeof project === 'string', 'project value must be a string');
    const uri = `${project}/${environment}/${version}/${this.provider.getUri()}/${namespace.getValue()}`;
    return uri;
  }
}

export default DeploymentConfig;
