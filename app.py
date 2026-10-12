from flask import Flask, render_template, request
from openai import OpenAI
import os
import re
import base64
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env

app = Flask(__name__, template_folder="frontend/templates", static_folder="frontend/static")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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

def generate_text_label(prompt):
    try:
        response = client.responses.create(
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
        return result, label
    except Exception as e:
        return f"Error: {str(e)}", None

def generate_artwork_image(prompt):
    try:
        image_prompt = (
            f"Generate an image of {prompt} exhibited as a contemporary conceptual artwork in a prestigious museum gallery setting. "
            f"The object is dramatically spotlit on a clean exhibition pedestal or mounted in a white-cube gallery space with polished floors."
        )
        response = client.responses.create(
            model="gpt-6-astra",
            input=image_prompt,
            tools=[{"type": "image_generation"}],
        )
        image_data = [
            output.result
            for output in response.output
            if getattr(output, "type", None) == "image_generation_call"
        ]
        if image_data:
            image_base64 = image_data[0]
            # Save the image to a file as shown in the example
            try:
                with open("latest_artwork.png", "wb") as f:
                    f.write(base64.b64decode(image_base64))
            except Exception:
                pass
            return image_base64
        return None
    except Exception as e:
        print(f"Image generation error: {e}")
        return None

def load_last_saved():
    text = None
    image_b64 = None

    if os.path.exists("latest_text.txt"):
        try:
            with open("latest_text.txt", "r", encoding="utf-8") as f:
                text = f.read().strip()
        except Exception as e:
            print(f"Error reading latest_text.txt: {e}")

    if os.path.exists("latest_artwork.png"):
        try:
            with open("latest_artwork.png", "rb") as f:
                image_b64 = base64.b64encode(f.read()).decode("utf-8")
        except Exception as e:
            print(f"Error reading latest_artwork.png: {e}")

    return text, image_b64

@app.route("/", methods=["GET", "POST"])
def index():
    result = None
    label = None
    image_base64 = None

    if request.method == "POST":
        # Debug action: load last saved text and artwork without spending tokens
        if request.form.get("debug") == "true":
            result, image_base64 = load_last_saved()
            if result:
                label = parse_museum_label(result)
            return render_template("index.html", result=result, label=label, image_base64=image_base64)

        prompt = request.form.get("prompt", "").strip()
        if prompt:
            # Generate both the museum label and gallery exhibition image simultaneously
            with ThreadPoolExecutor(max_workers=2) as executor:
                future_text = executor.submit(generate_text_label, prompt)
                future_image = executor.submit(generate_artwork_image, prompt)
                result, label = future_text.result()
                image_base64 = future_image.result()

            # Save the latest generated text to file
            if result and not result.startswith("Error:"):
                try:
                    with open("latest_text.txt", "w", encoding="utf-8") as f:
                        f.write(result)
                except Exception as e:
                    print(f"Error saving latest_text.txt: {e}")

    return render_template("index.html", result=result, label=label, image_base64=image_base64)

@app.route("/debug", methods=["GET"])
def debug_view():
    result, image_base64 = load_last_saved()
    label = parse_museum_label(result) if result else None
    return render_template("index.html", result=result, label=label, image_base64=image_base64)

if __name__ == "__main__":
    app.run(debug=True)  # Run locally for testing