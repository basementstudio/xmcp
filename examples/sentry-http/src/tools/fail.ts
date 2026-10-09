export default function fail() {
  return {
    isError: true,
    content: [{ type: "text", text: "Demonstration tool error" }],
  };
}
