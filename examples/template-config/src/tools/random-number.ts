// Tool implementation
export default async function randomNumber() {
  const result = Math.random();
  return {
    content: [{ type: "text", text: result.toString() }],
  };
}
