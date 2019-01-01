import requiredParam from './requiredParam';

const resourceExistsInList = (
  list = requiredParam('list'),
  resource = requiredParam('resource'),
) => !!list.find((instance) => resource.getUri() === instance.getUri());
export default resourceExistsInList;
