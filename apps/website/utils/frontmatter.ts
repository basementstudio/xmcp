import matter from "gray-matter";

const yaml = require("js-yaml") as {
  load: (input: string) => unknown;
};

function parseYaml(input: string): object {
  return (yaml.load(input) ?? {}) as object;
}

export function parseFrontmatter(input: string) {
  return matter(input, {
    engines: {
      yaml: parseYaml,
    },
  });
}
