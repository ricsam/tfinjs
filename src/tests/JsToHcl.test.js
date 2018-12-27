import { parse, join } from 'path';
import { writeFileSync, readFileSync } from 'fs';
import JsToHcl from '../JsToHcl';
import hclPrettify from '../statics/hclPrettify';
import inFile from '../testUtils/inFile';
import snapshot from '../testUtils/snapshot';
import outFile from '../testUtils/outFile';

/* eslint-env jest */

test('JsToHcl', async () => {
  const js = JSON.parse(readFileSync(inFile(__filename)).toString());
  const jsToHcl = new JsToHcl();
  const result = jsToHcl.stringify(js);

  const prettyResult = await hclPrettify(result);

  const output = outFile(__filename);
  snapshot(output, prettyResult, false);
});
