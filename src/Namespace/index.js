import assert from 'assert';
import Project from '../Project';

class Namespace {
  constructor(project, namespace) {
    assert(project instanceof Project);
    assert(typeof namespace === 'string', 'namespace must be a string');

    this.namespace = namespace;
    this.project = project;
  }

  getValue() {
    return this.namespace;
  }
}

export default Namespace;
