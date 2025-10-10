import { basehub, fragmentOn } from "basehub";

const AssetsFragment = fragmentOn("Assets", {
  glLogoMatcap: {
    url: true,
  },
});

export const fetchAssets = async () => {
  const res = await basehub().query({
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
  const res = await basehub().query({
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
  const res = await basehub().query({
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
