import type { Plugin } from "vite";

function removeHtmlComments(html: string): string {
  // Remove all comments of the form <!-- ... -->
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

export default function removeHtmlCommentsPlugin(): Plugin {
  return {
    name: 'vite-plugin-remove-html-comments',
    enforce: 'post',
    transformIndexHtml(html: string): string {
      return removeHtmlComments(html);
    }
  };
}
