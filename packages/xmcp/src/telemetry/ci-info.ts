import ciEnvironment from "ci-info";

const { isCI: _isCI, name: _name } = ciEnvironment;

export const isCI = _isCI;
export const name = _name;
