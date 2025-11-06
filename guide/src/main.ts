import { parse } from "marked";

fetch("/markdown/Guide.md")
  .then((r: Response) => r.text())
  .then((md: string) => {
    const markdownBody = document.querySelector(".markdown-body") as HTMLElement | null;
    if (!markdownBody) return;

    // Assume marked is loaded globally by CDN, so type is any
    // @ts-ignore
    markdownBody.innerHTML = parse(md);

    // After parsing, search again, in case markdownBody changed
    const container = document.querySelector(".markdown-body") as HTMLElement | null;
    if (!container) return;
    // Define all admonition types
    const admonitionTypes = [
      { type: "NOTE", class: "note", label: "Note" },
      { type: "TIP", class: "tip", label: "Tip" },
      { type: "WARNING", class: "warning", label: "Warning" },
      { type: "IMPORTANT", class: "important", label: "Important" },
      { type: "CAUTION", class: "caution", label: "Caution" }
    ];

    let html = container.innerHTML;

    // ---
    // This pattern is needed for the "standalone" regex (Regex 2)
    // ---
    const allTypesPattern = admonitionTypes.map(a => a.type).join('|');
    // Matches a <p> block, BUT ONLY IF it's NOT an admonition trigger
    const pBlockPattern = `<p[^>]*>(?!\\s*\\[!(?:${allTypesPattern})\\])[\\s\\S]*?<\\/\\s*p\\s*>`;
    // Matches all other allowed block types
    const otherBlocksPattern = `(?:<(?:ul|ol|pre|blockquote|table)[^>]*>[\\s\\S]*?<\\/\\s*(?:ul|ol|pre|blockquote|table)\\s*>)`;
    // Combined pattern for a single valid content block
    const contentBlock = `(?:\\s*(?:${pBlockPattern}|${otherBlocksPattern}))`;
    // ---


    for (const { type, class: cls, label } of admonitionTypes) {
      
      // -----------------------------------------------------------------
      // REGEX 1: Handle the "blockquote-wrapped" format
      // This matches: <blockquote><p>[!TYPE] ...content...</p>...</blockquote>
      // We run this first as it's more specific.
      // -----------------------------------------------------------------
      const bqRegex = new RegExp(
        // $1: The opening <blockquote> (e.g., <blockquote class="foo">)
        `(<blockquote[^>]*>)` + 
        `\\s*` + 
        // $2: The opening <p> (e.g., <p>)
        `(<p[^>]*>)` + 
        // The trigger (e.g., [!WARNING])
        `\\s*\\[!${type}\\]\\s*` + 
        // $3: The rest of the first <p> tag (e.g., "<strong>...</strong></p>")
        `([\\s\\S]*?<\\/p>)` + 
        // $4: The rest of the content in the blockquote (e.g., "<ul>...</ul>")
        `([\\s\\S]*?)` +
        // $5: The closing </blockquote>
        `(<\/blockquote>)`,
        "gi"
      );

      html = html.replace(bqRegex, (_match, bqOpen, pOpen, pRest, bqRest, bqClose) => {
        // Get the content from the first <p> (stripping its closing </p> tag)
        let firstPContent = pRest.replace(/<\/p>\s*$/i, '');
        
        let firstBlock = '';
        // If the first <p> had text *after* the trigger, re-wrap it in its <p> tag
        if (!firstPContent.match(/^\s*$/)) {
           firstBlock = `${pOpen}${firstPContent}</p>`;
        }

        // The final content is the reconstructed first <p> + the rest of the blockquote
        const content = firstBlock + bqRest;
        
        // Replace the entire <blockquote> with the new admonition <div>
        return `<div class="admonition ${cls}"><div class="ad-title"><span class="ad-icon"></span>${label}</div>${content}</div>`;
      });


      // -----------------------------------------------------------------
      // REGEX 2: Handle the "standalone trigger" format (with bug fix)
      // This matches: <p>[!TYPE]</p> <p>content</p> ...
      // -----------------------------------------------------------------
      const admonitionRegex = new RegExp(
        `<p>\\[!${type}\\]\\s*</p>` + // The standalone trigger
        `(${contentBlock}+)`,         // Capture one or more valid content blocks
        "gi"
      );

      html = html.replace(admonitionRegex, (_match, content) => {
        content = content.replace(/^\s+|\s+$/g, "");
        return `<div class="admonition ${cls}"><div class="ad-title"><span class="ad-icon"></span>${label}</div>${content}</div>`;
      });
    }

    // Find all <a> elements and append target="_blank"
    html = html.replace(/<a\b([^>]*)>/gi, (match, attrs) => {
      // If already has target attribute, don't add a duplicate
      if (/target\s*=/i.test(attrs)) return match;
      return `<a${attrs} target="_blank">`;
    });
    // Finally, update the container's HTML
    container.innerHTML = html;
  });
