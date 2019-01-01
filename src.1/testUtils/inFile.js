/* eslint-env jest */
import { join, parse } from 'path';

const inFile = (filename) => {
  const { dir, name } = parse(filename);
  return `${join(dir, name)}.in`;
};

export default inFile;
