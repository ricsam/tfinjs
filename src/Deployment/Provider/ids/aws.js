/**
 * Function to generate a provider id
 *
 * @param {string} accountId
 * @param {string} region
 * @returns {providerId} provider id for AWS
 */
function aws(accountId, region) {
  return `aws/${accountId}/${region}`;
}
export default aws;
