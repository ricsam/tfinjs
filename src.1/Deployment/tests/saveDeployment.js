import { join } from 'path';
import hclPrettify from '../../statics/hclPrettify';
import snapshot from '../../testUtils/snapshot';

const saveDeployment = async (deployment, outputFolder) => {
  await Promise.all(
    deployment.getResources().map(async (resource, index) => {
      const hcl = resource.getHcl();
      const prettyHcl = await hclPrettify(hcl);
      snapshot(join(outputFolder, `${index}.tf`), prettyHcl, false);
    }),
  );
};
export default saveDeployment;
