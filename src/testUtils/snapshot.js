/* eslint-env jest */
import { writeFileSync, readFileSync, existsSync } from 'fs';

const snapshot = (outFile, content, newSnapshot) => {
  if (newSnapshot || !existsSync(outFile)) {
    writeFileSync(outFile, content);
  }

  expect(readFileSync(outFile).toString()).toBe(content);
};
export default snapshot;
