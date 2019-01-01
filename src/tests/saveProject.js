import { join } from 'path';
import hclPrettify from '../statics/hclPrettify';
import snapshot from '../testUtils/snapshot';

const saveProject = async (project, outputFolder) => {
  await Promise.all(
    project.getResources().map(async (resource, index) => {
      const hcl = resource.getHcl();
      const prettyHcl = await hclPrettify(hcl);
      snapshot(join(outputFolder, `${index}.tf`), prettyHcl, false);
    }),
  );
};
export default saveProject;
