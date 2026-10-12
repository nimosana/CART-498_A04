/**
 * Generated Gallery - Museum Wall Label Parser & Renderer
 * 
 * Separates generated label into:
 * 1. Primary elements with header titles (Artist, Title, Medium, Dimensions, Provenance)
 * 2. Credit line in smaller font below first group
 * 3. Curatorial statement in a second block of text below
 */

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
    const mainFields = [
        { key: "artist", title: "Artist" },
        { key: "title", title: "Title" },
        { key: "medium", title: "Medium" },
        { key: "dimensions", title: "Dimensions" },
        { key: "provenance", title: "Provenance" }
    ];

    let html = `<div class="placard-card-inner">`;

    // 1. First group of elements: Artist, Title, Medium, Dimensions, Provenance (each with title as header)
    html += `<div class="placard-primary-group">`;
    for (const field of mainFields) {
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

    // 2. Credit line in smaller font below the first group of elements
    if (data.credit) {
        html += `
            <div class="placard-credit-line">
                <span class="credit-header">Credit line:</span>
                <span class="credit-value">${escapeHtml(data.credit)}</span>
            </div>
        `;
    }

    // 3. Curatorial statement displayed in a second block of text below the first group
    if (data.curatorial) {
        html += `
            <div class="placard-curatorial-block">
                <h4 class="curatorial-header">Curatorial Statement</h4>
                <div class="curatorial-body">${formatCuratorialBody(data.curatorial)}</div>
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
