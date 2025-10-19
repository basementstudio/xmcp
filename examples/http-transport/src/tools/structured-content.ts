// Tool implementation
export default async function structuredContent() {
  const content = {
    temperature: 22.5,
    conditions: "Partly cloudy",
    humidity: 65,
  };

  return {
    // return content for backwards compatibility / fallback
    content: [{ type: "text", text: JSON.stringify(content) }],
    structuredContent: content,
  };
}
