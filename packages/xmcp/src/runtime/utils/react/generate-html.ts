export function generateOpenAIHTML(componentCode: string): string {
  const renderScript = `
  <script type="module">
    const componentSource = ${JSON.stringify(componentCode)};
    const blobUrl = URL.createObjectURL(
      new Blob([componentSource], { type: "text/javascript" })
    );

    await import(blobUrl);

    requestAnimationFrame(() => {
      URL.revokeObjectURL(blobUrl);
    });
  </script>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <div id="root"></div>
  ${renderScript}
</body>
</html>`;
}

export function generateUIHTML(componentCode: string): string {
  const renderScript = `
  <script type="module">
    const componentSource = ${JSON.stringify(componentCode)};
    const blobUrl = URL.createObjectURL(
      new Blob([componentSource], { type: "text/javascript" })
    );

    await import(blobUrl);

    requestAnimationFrame(() => {
      URL.revokeObjectURL(blobUrl);
    });
  </script>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <div id="root"></div>
  ${renderScript}
</body>
</html>`;
}
