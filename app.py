from flask import Flask, render_template, request
import openai
import os
import re
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env

app = Flask(__name__, template_folder="frontend/templates", static_folder="frontend/static")
openai.api_key = os.getenv("OPENAI_API_KEY")  # Securely load API key

def parse_museum_label(text):
    if not text or not isinstance(text, str):
        return None

    clean_text = text.strip()
    if clean_text.startswith("Error:"):
        return None

    # Strip code block wrappers if any
    clean_text = re.sub(r"^```[a-zA-Z]*\n?", "", clean_text)
    clean_text = re.sub(r"\n?```$", "", clean_text).strip()

    header_regex = re.compile(
        r"(?:^|\n)\s*(?:[*#_>\s-]*)?(Artist|Title(?:\s+and\s+Year)?|Medium|Dimensions?|Provenance|Credit(?:\s*line)?|Curatorial\s*statement|Extended\s*label)\s*(?:[*#_>\s]*)?[:\-–—]\s*",
        re.IGNORECASE
    )

    matches = list(header_regex.finditer(clean_text))
    if len(matches) < 2:
        return None

    data = {}
    for i, match in enumerate(matches):
        key_raw = match.group(1).lower().strip()
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(clean_text)
        val = clean_text[start:end].strip()
        val = re.sub(r"^[*_~`]+|[*_~`]+$", "", val).strip()

        if key_raw.startswith("artist"):
            data["artist"] = val
        elif key_raw.startswith("title"):
            data["title"] = val
        elif key_raw.startswith("medium"):
            data["medium"] = val
        elif key_raw.startswith("dimension"):
            data["dimensions"] = val
        elif key_raw.startswith("provenance"):
            data["provenance"] = val
        elif key_raw.startswith("credit"):
            data["credit"] = val
        elif key_raw.startswith("curatorial") or key_raw.startswith("extended"):
            data["curatorial"] = val

    return data if data else None

@app.route("/", methods=["GET", "POST"])
def index():
    result = None
    label = None
    if request.method == "POST":
        prompt = request.form["prompt"]
        try:
            response = openai.responses.create(
                model="gpt-4.1",  
                input=[
                    {
                        "role": "developer", 
                        "content": (
                            "You are the senior chief curator at an ultra-prestigious, internationally renowned contemporary art museum. "
                            "Your job is to transform the user's everyday object into an elevated, canonical work of contemporary art and compose its official museum wall label (cartel).\n\n"
                            "Style & Vocabulary Guidelines:\n"
                            "- Heavily use International Art English (IAE) vocabulary and conceptual theory terms (e.g., discursive, interrogate, praxis, liminality, reification, assemblage, spatiality, ontological, performative, apparatus, tension, juxtaposition, destabilize, hermeneutics, subversion, relationality).\n"
                            "- Radically exaggerate and elevate the gallery importance and institutional reverence of the object, treating even the most mundane detail as a profound metaphysical event.\n\n"
                            "Format Requirement:\n"
                            "The museum label must ALWAYS include the following sections:\n"
                            "Artist: [An invented artist name], [An invented bio line, e.g., 'b. 1997, lives and works between Verdun and the cloud']\n"
                            "Title: [An invented high-concept artwork title], [Year]\n"
                            "Medium: [A medium line mixing real physical materials and evocative abstractions, e.g., 'Polyester, elastic, fatigue']\n"
                            "Dimensions: [Invented dimensions, e.g., 'Variable dimensions' or '34.5 × 12.0 × 8.2 cm']\n"
                            "Provenance: [The object's ownership history, e.g., 'Found under a radiator, 2026; private collection of a dépanneur; acquired by the museum after a tense negotiation']\n"
                            "Credit line: [Invented institutional credit line, e.g., 'Gift of the artist’s backpack']\n\n"
                            "Curatorial statement:\n"
                            "[Curatorial statement of strictly 80–120 words analyzing the work. It MUST cite one invented theorist and their invented book title (e.g., as theorist Sylvère Vandermeer posits in 'The Ruptured Everyday' (2019)...). Use dense International Art English to frame the object as an urgent intervention into institutional space.]"
                        )
                    }, 
                    {"role": "user", "content": prompt}
                ],
                temperature=1.2,
                max_output_tokens=700
            )
            result = response.output_text
            label = parse_museum_label(result)
        except Exception as e:
            result = f"Error: {str(e)}"
    return render_template("index.html", result=result, label=label)

if __name__ == "__main__":
    app.run(debug=True)  # Run locally for testing