document.addEventListener("DOMContentLoaded", async () => {
    // console.log("Segment loader: DOM content loaded, starting segment processing");
    const segmentNodeList = document.querySelectorAll("segment");
    const segments = Array.from(segmentNodeList);

    // console.log(`Segment loader: Found ${segments.length} segments to process`);
    if (!segments || segments.length <= 0) {
        // console.log("Segment loader: No segments found, exiting");
        return;
    }

    // Group segments by name so we fetch each unique segment only once
    const nameToSegments = new Map();
    for (const segment of segments) {
        const nameAttr = segment.getAttribute("name");
        if (!nameAttr) {
            console.warn("Segment loader: Skipping segment without name attribute");
            continue;
        }
        if (!nameToSegments.has(nameAttr)) {
            nameToSegments.set(nameAttr, []);
        }
        nameToSegments.get(nameAttr).push(segment);
    }

    const groupPromises = [];
    for (const [nameAttr, elements] of nameToSegments.entries()) {
        const destination = `/segments/${nameAttr}.html`;
        // console.log(`Segment loader: Processing segment "${nameAttr}" from ${destination} for ${elements.length} instance(s)`);

        const p = (async () => {
            try {
                const response = await fetch(destination);
                if (!response.ok) {
                    console.error(`Segment loader: Failed to fetch ${destination}, status: ${response.status}`);
                    throw new Error("Fetch Error");
                }
                const content = await response.text();
                // console.log(`Segment loader: Successfully fetched content for segment "${nameAttr}"`);

                if (content !== undefined) {
                    for (const el of elements) {
                        el.outerHTML = content;
                    }
                    // console.log(`Segment loader: Successfully replaced ${elements.length} instance(s) of segment "${nameAttr}" with content`);
                    return true;
                }
                throw new Error("Empty content");
            } catch (error) {
                console.error(`Segment loader: Error getting segment "${nameAttr}":`, error);
                alert(`Error getting segment: ${error?.message}`);
                throw error;
            }
        })();

        groupPromises.push(p);
    }

    await Promise.all(groupPromises);

    // Append scripts
    // console.log(`Segment loader: Appending scripts`);
    {
        import("/app.js").then(() => {
            // console.log(`Segment loader: Successfully appended script`);
            const hCaptchaScript = document.createElement("script");
            hCaptchaScript.src = "https://js.hcaptcha.com/1/api.js?onload=onloadHCaptcha&render=explicit";
            hCaptchaScript.defer = true;
            
            document.head.appendChild(hCaptchaScript)
        })
    }
    // console.log("Segment loader: Completed processing all segments and scripts");
})