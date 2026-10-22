# CART-498_A04

## Run locally

The application entry point is `app.py`. It starts a Flask development server and serves the page from `frontend/templates/index.html`, with static files from `frontend/static/`.

### Requirements

- Python 3
- An OpenAI API key with access to the models and image-generation tool configured in `app.py`

### Windows PowerShell

Run these commands from the repository root:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install flask openai python-dotenv
```

If PowerShell blocks activation scripts, allow activation for this terminal session:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
```

Create a `.env` file in the repository root with your API key:

```text
OPENAI_API_KEY=your_api_key_here
```

Replace the example value with your key; do not commit the `.env` file. Start the app from the repository root:

```powershell
python app.py
```

Open <http://127.0.0.1:5000/> in your browser. The terminal running Flask must stay open while you use the app. To stop it, press `Ctrl+C`.

### macOS or Linux

From the repository root, create and activate a virtual environment, install the same dependencies, then set `OPENAI_API_KEY` in a root `.env` file as shown above:

```bash
python3 -m venv venv
source venv/bin/activate
python -m pip install flask openai python-dotenv
python app.py
```

Then open <http://127.0.0.1:5000/>.

### Using the app

Enter an everyday object in the text area and select **Generate Exhibition**. The app submits the request to Flask, generates a museum label, and uses its curatorial statement to request a gallery image. Generation requires an internet connection and a working API key. The last generated text and image are saved under `temp/`; visit <http://127.0.0.1:5000/debug> to preview the last saved result.

The deployed version is also available at <https://cart-498-a04.onrender.com/>.

## Project notes

### Image generation from an imaginary museum label

After you enter a prompt, the museum label is generated using OpenAI's GPT-4.1 model. The curatorial statement is extracted from the generated text and appended to predefined instructions for the image model. This is the code snippet that creates the image prompt (the curatorial statement is appended in the `f"{curatorial_statement}"` placeholder):

`image_prompt = (
            "Create a single, dramatic museum exhibition photograph of a contemporary conceptual artwork. "
            "The work is displayed in a pristine white-cube gallery: polished concrete floors, track-lit from above with a sharp spotlight, "
            "clean gallery walls, and a sense of institutional gravitas. "
            "The artwork itself should visually embody the following curatorial description:\\n\\n"
            f"{curatorial_statement}\\n\\n"
            "Render the scene as a high-quality editorial gallery photograph — no text overlays, no people, no frames on the walls."
        )`

### IAE features and prompt rules

The language model is instructed to take the role of a high-level museum curator and turn the prompted object into a gallery work. The main IAE features are elaborate vocabulary, conceptual theory terms, and an exaggerated sense of the object's importance. This makes the museum labels more ambiguous while presenting the object as a significant work of art.

The following lines from the developer prompt establish these features:

`"You are the senior chief curator at an ultra-prestigious, internationally renowned contemporary art museum. "
"Your job is to transform the user's everyday object into an elevated, canonical work of contemporary art and compose its official museum wall label (cartel).\n\n"
"Style & Vocabulary Guidelines:\n"
"- Heavily use International Art English (IAE) vocabulary and conceptual theory terms (e.g., discursive, interrogate, praxis, liminality, reification, assemblage, spatiality, ontological, performative, apparatus, tension, juxtaposition, destabilize, hermeneutics, subversion, relationality).\n"
"- Radically exaggerate and elevate the gallery importance and institutional reverence of the object, treating even the most mundane detail as a profound metaphysical event.\n\n"`

The remaining rules tell the model how to divide the output into sections and how to format the label.

### Why is a language model fluent in this dialect?

International Art English is used by artists, curators, critics, galleries, museums, and other art institutions in exhibition texts, press releases, catalogues, and critical essays. Such published writing may appear in the data used to train large language models. Exposure to recurring vocabulary and structures helps models reproduce the style.