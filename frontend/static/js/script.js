/**
 * Generated Gallery - Museum Wall Label Parser & Renderer
 * 
 * Separates generated label into:
 * 1. Primary elements with header titles (Artist, Title, Medium, Dimensions, Provenance)
 * 2. Credit line in smaller font below first group
 * 3. Curatorial statement in a second block of text below
 */

// Debug button: submits form with debug=true, loading last saved text+image without API calls
document.addEventListener("DOMContentLoaded", function () {
    const debugBtn = document.getElementById("debugBtn");
    const debugField = document.getElementById("debugField");
    const form = document.getElementById("mainForm");
    const generateBtn = document.getElementById("generateBtn");
    const promptInput = document.getElementById("promptInput");

    if (debugBtn && debugField && form) {
        debugBtn.addEventListener("click", function () {
            debugField.value = "true";
            // Remove required attribute so form can submit without a prompt
            if (promptInput) promptInput.removeAttribute("required");
            form.submit();
        });
    }

    // Restore required on generate button click to enforce prompt entry
    if (generateBtn && promptInput) {
        generateBtn.addEventListener("click", function () {
            debugField.value = "false";
            promptInput.setAttribute("required", "");
        });
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const placard = document.getElementById("museumPlacard");
    if (!placard) return;

    // If the server has already rendered the structured card, nothing to do
    if (placard.querySelector(".placard-card-inner")) {
        return;
    }

    // Use textContent first to guarantee newlines are not collapsed by browser layout
    const rawText = placard.textContent || placard.innerText || "";
    if (!rawText.trim()) return;

    // If an error message occurred, retain error alert appearance
    if (rawText.trim().startsWith("Error:")) {
        placard.classList.add("placard-error");
        return;
    }

    const parsed = parseMuseumLabel(rawText);
    if (parsed) {
        renderMuseumPlacard(placard, parsed);
    }
});

/**
 * Parses raw text from the OpenAI API into individual museum label sections.
 */
function parseMuseumLabel(text) {
    // Strip code fence blocks if any
    let normalized = text.trim()
        .replace(/^```[a-zA-Z]*\n?/, "")
        .replace(/\n?```$/, "")
        .replace(/\r\n/g, "\n");

    // Matches section headers like "Artist:", "**Artist:**", "- Artist:", "Title and Year:", "Curatorial statement:", etc.
    const headerRegex = /(?:^|\n)\s*(?:[*#_>\s-]*)?(Artist|Title(?:\s+and\s+Year)?|Medium|Dimensions?|Provenance|Credit(?:\s*line)?|Curatorial\s*statement|Extended\s*label)\s*(?:[*#_>\s]*)?[:\-–—]\s*/gi;

    const matches = [];
    let match;
    while ((match = headerRegex.exec(normalized)) !== null) {
        matches.push({
            name: match[1],
            index: match.index,
            headerEnd: match.index + match[0].length
        });
    }

    if (matches.length < 2) {
        // Fallback to displaying raw text if structured sections are not found
        return null;
    }

    const sections = {};
    for (let i = 0; i < matches.length; i++) {
        const current = matches[i];
        const next = matches[i + 1];
        const rawKey = current.name.toLowerCase().trim();
        const valueEnd = next ? next.index : normalized.length;
        let value = normalized.substring(current.headerEnd, valueEnd).trim();

        // Strip leading/trailing formatting artifacts
        value = value.replace(/^[*_~`]+|[*_~`]+$/g, "").trim();

        if (rawKey.startsWith("artist")) {
            sections.artist = value;
        } else if (rawKey.startsWith("title")) {
            sections.title = value;
        } else if (rawKey.startsWith("medium")) {
            sections.medium = value;
        } else if (rawKey.startsWith("dimension")) {
            sections.dimensions = value;
        } else if (rawKey.startsWith("provenance")) {
            sections.provenance = value;
        } else if (rawKey.startsWith("credit")) {
            sections.credit = value;
        } else if (rawKey.startsWith("curatorial") || rawKey.startsWith("extended")) {
            sections.curatorial = value;
        }
    }

    return sections;
}

/**
 * Renders the parsed museum label elements into the placard container.
 */
function renderMuseumPlacard(container, data) {
    // Preserve existing image wrap if present at the top of the placard
    const existingImg = container.querySelector(".placard-image-wrap");
    const imageHtml = existingImg ? existingImg.outerHTML : "";

    const topFields = [
        { key: "artist", title: "Artist Name" },
        { key: "title", title: "Title of the Artwork" },
        { key: "medium", title: "Medium" },
        { key: "dimensions", title: "Dimensions" }
    ];

    let html = imageHtml;
    html += `<div class="placard-card-inner">`;

    // 1. Top elements: Artist Name, Title of the Artwork, Medium, Dimensions
    html += `<div class="placard-primary-group">`;
    for (const field of topFields) {
        if (data[field.key]) {
            const isTitle = field.key === "title";
            html += `
                <div class="placard-element placard-element-${field.key}">
                    <h4 class="element-header">${escapeHtml(field.title)}</h4>
                    <div class="element-value ${isTitle ? 'element-value-title' : ''}">${escapeHtml(data[field.key])}</div>
                </div>
            `;
        }
    }
    html += `</div>`;

    // 2. Line or separation
    html += `<hr class="placard-divider">`;

    // 3. Curatorial statement
    if (data.curatorial) {
        html += `
            <div class="placard-curatorial-block">
                <h4 class="curatorial-header">Curatorial Statement</h4>
                <div class="curatorial-body">${formatCuratorialBody(data.curatorial)}</div>
            </div>
        `;
    }

    // 4. Provenance
    if (data.provenance) {
        html += `
            <div class="placard-element placard-element-provenance">
                <h4 class="element-header">Provenance</h4>
                <div class="element-value">${escapeHtml(data.provenance)}</div>
            </div>
        `;
    }

    // 5. Credit line in smaller font
    if (data.credit) {
        html += `
            <div class="placard-credit-line">
                <span class="credit-header">Credit line:</span>
                <span class="credit-value">${escapeHtml(data.credit)}</span>
            </div>
        `;
    }

    html += `</div>`;

    container.innerHTML = html;
}

/**
 * Formats curatorial body into paragraph elements while escaping HTML.
 */
function formatCuratorialBody(text) {
    if (!text) return "";
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    if (paragraphs.length <= 1) {
        return `<p>${escapeHtml(text)}</p>`;
    }
    return paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join("");
}

/**
 * Escapes HTML characters to prevent XSS.
 */
function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
