import os
import json
import re
from groq import Groq
from django.conf import settings

api_key = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=api_key.strip() if api_key else None)

def create_messages(text, language):
    specific_instructions = ""
    if language == "Japanese":
        specific_instructions = load_prompt("japanese_flashcards.txt")

    prompt = (
        f"Please extract vocabulary from the following {language} article. "
        "Return ONLY valid JSON (a list of objects). "
        f"{specific_instructions}\n\n"
        f"Article:\n{text}"
    )

    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You must respond only with valid JSON."},
            {"role": "user", "content": prompt}
        ],
        model="llama-3.3-70b-versatile"
    )
    return chat_completion

def load_prompt(name):
    prompt_path = os.path.join(
        settings.BASE_DIR,
        "ai_generator",
        "prompts",
        name
    )
    with open(prompt_path, 'r', encoding='utf-8') as f:
        return f.read()
    
def extract_json(text):
    # Extract the FIRST {...} or [...] block
    match = re.search(r'(\[.*?\]|\{.*?\})', text, re.DOTALL)
    return match.group(1) if match else text   

# process the data returned by groq and return it in a easy to use flashcard format
def process(response_content, language):
    processed_content = {
        "flashcards": []
    }
    if language == "Japanese":
        for item in response_content:
            word = item.get("word", "")
            translation = item.get("translation", "")
            example_sentence = item.get("example_sentence", "")
            translated_example_sentence = item.get("translated_example_sentence", "")
            if item.get("type") == "verb":
                front = f"{translation}\n　ex:{translated_example_sentence}"
                back = (
                    f"({item.get('particles', '')})"
                    f"{item.get('dictionary_form_kanji', '')}\n"
                    f"{item.get('dictionary_form_hiragana', '')}・"
                    f"{item.get('masu_form_hiragana', '')}\n"
                    f"例：{example_sentence}"
                )
            else:
                front = f"{translation}\n　ex:{translated_example_sentence}"
                back = f"{word}\n例：{example_sentence}"
        
            processed_content["flashcards"].append({
                "front": front,
                "back": back
            })

    return processed_content

def parse_article(text, language):
    messages = create_messages(text, language)
    try:
        raw = messages.choices[0].message.content
        cleaned = extract_json(raw)
        response_content = json.loads(cleaned)
    except json.JSONDecodeError as e:
        print("LLM did not return valid JSON:")
        print(raw)
        return {
            "output": None,
            "error": str(e)
        }
    print(response_content)
    response_content = process(response_content, language)
    return {
        "output": response_content,
        "error": None
    }

