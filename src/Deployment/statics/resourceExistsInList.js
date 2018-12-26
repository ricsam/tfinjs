import requiredParam from '../../statics/requiredParam';

const resourceExistsInList = (
  list = requiredParam('list'),
  resource = requiredParam('resource'),
) =>
  !!list.find(
    (instance) =>
      resource.type === instance.type
      && resource.name === instance.name
      && resource.namespace === instance.namespace
      && resource.deploymentParams.project === instance.deploymentParams.project
      && resource.deploymentParams.environment
        === instance.deploymentParams.environment
      && resource.deploymentParams.version === instance.deploymentParams.version
      && resource.deploymentParams.platform === instance.deploymentParams.platform,
  );
export default resourceExistsInList;
