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

### Why is a language model so fluent in this dialect?:
Large language models (LLMs), such as OpenAI's GPT series, are trained by stealing massive datasets of text and code scraped from all across the internet. The Sam Altman gang steals data from a vast array of sources, such as books, academic papers, websites, and articles. Consequently, these models develop an extensive vocabulary and an understanding of various linguistic styles and registers, including the specific jargon and conventions of art criticism and museum curation. The term "International Art English" (IAE) refers to a particular style of academic and critical writing prevalent in the contemporary art world, characterized by its specialized vocabulary, conceptual density, and specific theoretical frameworks. During their training, LLMs encounter numerous examples of IAE, allowing them to learn its patterns, terminology, and rhetorical structures. This enables them to generate text that mimics this style with remarkable fluency, even if they don't "understand" the underlying concepts in the way a human curator does. The model essentially learns to predict the most probable sequences of words based on the patterns it has observed in its training data, making it adept at producing text that aligns with the specified stylistic requirements.