type PizzazWidget = {
    id: string;
    title: string;
    templateUri: string;
    invoking: string;
    invoked: string;
    html: string;
    responseText: string;
};
  
export function widgetMeta(widget: PizzazWidget) {
    return {
        "openai/outputTemplate": widget.templateUri,
        "openai/toolInvocation/invoking": widget.invoking,
        "openai/toolInvocation/invoked": widget.invoked,
        "openai/widgetAccessible": true,
        "openai/resultCanProduceWidget": true
    } as const;
}

export const widgets: PizzazWidget[] = [
    {
      id: "pizza-map",
      title: "Show Pizza Map",
      templateUri: "ui://widget/pizza-map.html",
      invoking: "Hand-tossing a map",
      invoked: "Served a fresh map",
      html: `
  <div id="pizzaz-root"></div>
  <link rel="stylesheet" href="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-0038.css">
  <script type="module" src="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-0038.js"></script>
      `.trim(),
      responseText: "Rendered a pizza map!"
    },
    {
      id: "pizza-carousel",
      title: "Show Pizza Carousel",
      templateUri: "ui://widget/pizza-carousel.html",
      invoking: "Carousel some spots",
      invoked: "Served a fresh carousel",
      html: `
  <div id="pizzaz-carousel-root"></div>
  <link rel="stylesheet" href="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-carousel-0038.css">
  <script type="module" src="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-carousel-0038.js"></script>
      `.trim(),
      responseText: "Rendered a pizza carousel!"
    },
    {
      id: "pizza-albums",
      title: "Show Pizza Album",
      templateUri: "ui://widget/pizza-albums.html",
      invoking: "Hand-tossing an album",
      invoked: "Served a fresh album",
      html: `
  <div id="pizzaz-albums-root"></div>
  <link rel="stylesheet" href="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-albums-0038.css">
  <script type="module" src="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-albums-0038.js"></script>
      `.trim(),
      responseText: "Rendered a pizza album!"
    },
    {
      id: "pizza-list",
      title: "Show Pizza List",
      templateUri: "ui://widget/pizza-list.html",
      invoking: "Hand-tossing a list",
      invoked: "Served a fresh list",
      html: `
  <div id="pizzaz-list-root"></div>
  <link rel="stylesheet" href="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-list-0038.css">
  <script type="module" src="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-list-0038.js"></script>
      `.trim(),
      responseText: "Rendered a pizza list!"
    },
    {
      id: "pizza-video",
      title: "Show Pizza Video",
      templateUri: "ui://widget/pizza-video.html",
      invoking: "Hand-tossing a video",
      invoked: "Served a fresh video",
      html: `
  <div id="pizzaz-video-root"></div>
  <link rel="stylesheet" href="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-video-0038.css">
  <script type="module" src="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-video-0038.js"></script>
      `.trim(),
      responseText: "Rendered a pizza video!"
    }
];
  
export const widgetsById = new Map<string, PizzazWidget>();
export const widgetsByUri = new Map<string, PizzazWidget>();
  
widgets.forEach((widget) => {
    widgetsById.set(widget.id, widget);
    widgetsByUri.set(widget.templateUri, widget);
});