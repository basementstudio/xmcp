import { basehub, fragmentOn } from "basehub";

let basehubInstance: ReturnType<typeof basehub> | null = null;

export function client(): ReturnType<typeof basehub> {
  if (!basehubInstance) {
    basehubInstance = basehub();
  }
  return basehubInstance;
}

const AssetsFragment = fragmentOn("Assets", {
  glLogoMatcap: {
    url: true,
  },
});

export const fetchAssets = async () => {
  const res = await client().query({
    assets: {
      ...AssetsFragment,
    },
  });

  return res.assets;
};

const ShowcaseFragment = fragmentOn("Showcase", {
  submissions: {
    ingestKey: true,
    schema: true,
  },
});

export const fetchShowcaseForm = async () => {
  const res = await client().query({
    showcase: {
      ...ShowcaseFragment,
    },
  });

  return res.showcase;
};

const MCPTemplateFragment = fragmentOn("McpTemplateComponent", {
  name: true,
  tagline: true,
  logo: {
    url: true,
  },
  connection: true,
  repositoryUrl: true,
  tag: true,
});

export const fetchMCPs = async () => {
  const res = await client().query({
    showcase: {
      mcps: {
        items: {
          ...MCPTemplateFragment,
        },
      },
    },
  });

  return res.showcase.mcps.items;
};
