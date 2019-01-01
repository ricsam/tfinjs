import assert from 'assert';
import Resource from '../Resource';
import createTerraformStringInterpolation from '../statics/createTerraformStringInterpolation';

export const versionedName = () => (resource) => {
  assert(
    resource instanceof Resource,
    'resource must be an instance of Resource',
  );
  return resource.versionedName();
};

export const reference = (resource, key) => {
  assert(
    resource instanceof Resource,
    'resource must be an instance of Resource',
  );
  assert(typeof key === 'string', 'key must be string');

  return (sourceResource) => {
    assert(
      sourceResource instanceof Resource,
      'sourceResource must be an instance of Resource',
    );
    sourceResource.registerRemoteState(resource);
    resource.addOutputKey(key);

    return createTerraformStringInterpolation(
      `data.terraform_remote_state.${resource.versionedName()}.${key}`,
    );
  };
};
