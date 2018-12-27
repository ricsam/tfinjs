import { join, parse } from 'path';

const outFile = (filename) => {
  const { dir, name } = parse(filename);
  return `${join(dir, name)}.out`;
};
export default outFile;
