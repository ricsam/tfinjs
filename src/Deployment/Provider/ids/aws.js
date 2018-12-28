import assert from 'assert';
import requiredParam from '../../../statics/requiredParam';

/**
 * Function to generate a provider id
 *
 * @param {string} accountId
 * @param {string} region
 * @returns {providerId} provider id for AWS
 */
function aws(accountId = requiredParam('accountId'), region = requiredParam('region')) {
  assert(typeof accountId === 'string' || typeof accountId === 'number', 'accountId must be string or number');
  assert(typeof region === 'string', 'region must be string');
  return `aws/${accountId}/${region}`;
}
export default aws;
