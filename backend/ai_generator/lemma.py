import json

from .utils import create_chat_completion, load_prompt, parse_json_response


def generate_lemma(text, language):
    prompt_template = load_prompt("lemma_generation.txt")
    prompt = prompt_template.format(language=language, text=text)

    messages = create_chat_completion([
        {"role": "system", "content": "You must respond only with valid JSON."},
        {"role": "user", "content": prompt},
    ])

    try:
        raw = messages.choices[0].message.content
        response_content = parse_json_response(raw)
    except json.JSONDecodeError as e:
        print("LLM did not return valid JSON:")
        print(raw)
        return {
            "output": None,
            "error": str(e),
        }

    return {
        "output": response_content.get("lemma", ""),
        "error": None,
    }
