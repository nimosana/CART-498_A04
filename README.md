# CART-498_A04

### Getting Started

1. Open the web app at: https://cart-498-a04.onrender.com/
2. In the text area, describe any object you would like to see displayed in a gallery.
3. Click generate to begin the generation of the object's museum label and gallery image.
4. Appreciate your generation!

### Image Generation derived from an imaginary museum label
After you enter a prompt, the museum label is generated using OpenAI's GPT-4.1 model. From the generated text, the curatorial statement is extracted and appended into a block of text including predefined instructions. These instruct the model to generate an image of the object's curatorial statement in a gallery setting. This is the code snippet that creates the image prompt (the curatorial statement is appended in the `f"{curatorial_statement}"` placeholder):

`image_prompt = (
            "Create a single, dramatic museum exhibition photograph of a contemporary conceptual artwork. "
            "The work is displayed in a pristine white-cube gallery: polished concrete floors, track-lit from above with a sharp spotlight, "
            "clean gallery walls, and a sense of institutional gravitas. "
            "The artwork itself should visually embody the following curatorial description:\\n\\n"
            f"{curatorial_statement}\\n\\n"
            "Render the scene as a high-quality editorial gallery photograph — no text overlays, no people, no frames on the walls."
        )`

### Which IAE features I chose and how they were translated into prompt rules:

The language model is instructed to take the role of a high-level curator at an important museum, and its task of turning the prompted object into a gallery work. This establishes the main goal and the tone of the output. The main IAE features chosen were to use elaborate and complex vocabulary as well as conceptual theory terms, as well as to exaggerate the object's importance and elevate it into a work of art. This consequently makes the contents of the museum labels more ambiguous and difficult to interpret, and ultimately lets the LLM get away with writing whatever, no matter if it makes sens or not, while sounding confident and smart. 

The following lines from the Developer prompt are responsible for IAE features:

`"You are the senior chief curator at an ultra-prestigious, internationally renowned contemporary art museum. "
"Your job is to transform the user's everyday object into an elevated, canonical work of contemporary art and compose its official museum wall label (cartel).\n\n"
"Style & Vocabulary Guidelines:\n"
"- Heavily use International Art English (IAE) vocabulary and conceptual theory terms (e.g., discursive, interrogate, praxis, liminality, reification, assemblage, spatiality, ontological, performative, apparatus, tension, juxtaposition, destabilize, hermeneutics, subversion, relationality).\n"
"- Radically exaggerate and elevate the gallery importance and institutional reverence of the object, treating even the most mundane detail as a profound metaphysical event.\n\n"`

The rest of the rules mainly instruct the model how to divide the output into the different sections of the museum label, along with some rules about the format and presentation of the output. 
### Why is a language model so fluent in this dialect?:
Multiple Large language models (LLMs) such as OpenAI's GPT-4.1, are notorious for being trained on the biggest datasets their developers can build or scrape from the internet. International Art English is widely used by artists, curators, critics, galleries, museums, and other institutions in the art world, many of whom publish exhibition texts, press releases, catalogues, and critical essays online. These texts become part of the data used to train language models and share similarities in terms of vocabulary and structure. This exposes LLMs to vast examples of IAE. Because they have such large datasets, the data collected from these sources provides sufficient data for the models to learn from and see the patterns and similarities that make up IAE. As a result, language models have become adept at reproducing these types of texts.