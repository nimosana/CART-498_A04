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