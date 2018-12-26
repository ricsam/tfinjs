import assertDeploymentParamsSignature from '../../assertions/assertDeploymentParamsSignature';
import throwError from '../../statics/throwError';
import requiredParam from '../../statics/requiredParam';

const assertApiConstructorParams = (
  {
    deploymentParams = requiredParam('deploymentParams'),
    namespace = requiredParam('namespace'),
  },
  stacktraceFunction = requiredParam('stacktraceFunction'),
) => {
  assertDeploymentParamsSignature(deploymentParams, stacktraceFunction);

  if (typeof namespace !== 'string') {
    throwError(
      'Invalid signature of the namespace, must be a string',
      stacktraceFunction,
    );
  }
};
export default assertApiConstructorParams;
