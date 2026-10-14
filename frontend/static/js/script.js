
/**
 * Generated Gallery - Museum Wall Label Parser & Renderer
 *
 * Parses generated museum labels and renders their sections.
 * Generation submission and polling are handled by index.html.
 */

/**
 * Parses raw text from the OpenAI API into individual museum label sections.
 */
function parseMuseumLabel(text) {
    let normalized = text.trim()
        .replace(/^```[a - zA - Z] *\n ?/, "")
        .replace(/\n?```$/, "")
        .replace(/\r\n/g, "\n");

    const headerRegex =
        /(?:^|\n)\s*(?:[*#_>\s-]*)?(Artist|Title(?:\s+and\s+Year)?|Medium|Dimensions?|Provenance|Credit(?:\s*line)?|Curatorial\s*statement|Extended\s*label)\s*(?:[*#_>\s]*)?[:\-–—]\s*/gi;

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
        return null;
    }

    const sections = {};

    for (let i = 0; i < matches.length; i++) {
        const current = matches[i];
        const next = matches[i + 1];
        const rawKey = current.name.toLowerCase().trim();

        const valueEnd = next ? next.index : normalized.length;

        let value = normalized
            .substring(current.headerEnd, valueEnd)
            .trim();

        value = value
            .replace(/^[*_~`]+|[*_~`]+$/g, "")
            .trim();

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
        } else if (
            rawKey.startsWith("curatorial") ||
            rawKey.startsWith("extended")
        ) {
            sections.curatorial = value;
        }
    }

    return sections;
}

/**
 * Renders the parsed museum label into the placard container.
 */
function renderMuseumPlacard(container, data) {
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
    html += `<div class="placard-primary-group">`;

    for (const field of topFields) {
        if (data[field.key]) {
            const isTitle = field.key === "title";

            html += `
                <div class="placard-element placard-element-${field.key}">
                    <h4 class="element-header">${escapeHtml(field.title)}</h4>
                    <div class="element-value ${isTitle ? "element-value-title" : ""}">${escapeHtml(data[field.key])}</div>
                </div>
            `;
        }
    }

    html += `</div>`;
    html += `<hr class="placard-divider">`;

    if (data.curatorial) {
        html += `
            <div class="placard-curatorial-block">
                <h4 class="curatorial-header">Curatorial Statement</h4>
                <div class="curatorial-body">${formatCuratorialBody(data.curatorial)}</div>
            </div>
        `;
    }

    if (data.provenance) {
        html += `
            <div class="placard-element placard-element-provenance">
                <h4 class="element-header">Provenance</h4>
                <div class="element-value">${escapeHtml(data.provenance)}</div>
            </div>
        `;
    }

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
 * Formats the curatorial statement into paragraph elements.
 */
function formatCuratorialBody(text) {
    if (!text) return "";

    const paragraphs = text
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(Boolean);

    if (paragraphs.length <= 1) {
        return `<p>${escapeHtml(text)}</p>`;
    }

    return paragraphs
        .map(p => `<p>${escapeHtml(p)}</p>`)
        .join("");
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

/**
 * Retains support for rendering a raw label on an initial page load.
 * The asynchronous workflow renders completed results directly.
 */
document.addEventListener("DOMContentLoaded", function () {
    const placard = document.getElementById("museumPlacard");

    if (!placard) return;

    // Already rendered by the Flask template.
    if (placard.querySelector(".placard-card-inner")) {
        return;
    }

    const rawElement = placard.querySelector(".raw-placard-result");
    if (!rawElement) return;

    const rawText = rawElement.textContent || "";

    if (!rawText.trim()) return;

    if (rawText.trim().startsWith("Error:")) {
        placard.classList.add("placard-error");
        return;
    }

    const parsed = parseMuseumLabel(rawText);

    if (parsed) {
        renderMuseumPlacard(placard, parsed);
    }
});