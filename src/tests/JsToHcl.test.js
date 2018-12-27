import { parse, join } from 'path';
import { writeFileSync, readFileSync } from 'fs';
import JsToHcl from '../JsToHcl';
import hclPrettify from '../statics/hclPrettify';

/* eslint-env jest */

const outFile = (filename) => {
  const { dir, name } = parse(filename);
  return `${join(dir, name)}.out`;
};
const inFile = (filename) => {
  const { dir, name } = parse(filename);
  return `${join(dir, name)}.in`;
};

test('JsToHcl', async () => {
  const js = JSON.parse(readFileSync(inFile(__filename)).toString());
  const jsToHcl = new JsToHcl();
  const result = jsToHcl.stringify(js);

  const prettyResult = await hclPrettify(result);

  const thisOutFile = outFile(__filename);

  writeFileSync(thisOutFile, prettyResult);

  expect(readFileSync(thisOutFile).toString()).toBe(prettyResult);
});
