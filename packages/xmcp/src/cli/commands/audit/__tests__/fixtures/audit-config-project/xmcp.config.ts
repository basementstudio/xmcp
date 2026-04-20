const config = {
  audit: {
    ignore: [
      "src/tools/ignored/**",
      { rule: "XMCP-SCHEMA-001", paths: ["src/tools/scoped/**"] },
    ],
    severity: {
      "XMCP-SCHEMA-001": "high",
      "XMCP-SCHEMA-004": "off",
    },
    failOn: "critical",
  },
};

export default config;
