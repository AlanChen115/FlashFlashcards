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
    if language == "Chinese":
        specific_instructions = load_prompt("chinese_flashcards.txt")
    if language == "Spanish":
        specific_instructions = load_prompt("spanish_flashcards.txt")
    if language == "Korean":
        specific_instructions = load_prompt("korean_flashcards.txt")
    
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

def addFlashcards(processed_content, item, back):
    front = item.get('translation', '') + "\n　ex: " + item.get('translated_example_sentence', '')
    processed_content["flashcards"].append({
        "front": front,
        "back": back 
    })

def processJapanese(processed_content, response_content):
    for item in response_content:
        if item.get("type") == "verb":
            back = (
                f"({item.get('particles', '')})"
                f"{item.get('dictionary_form_kanji', '')}\n"
                f"{item.get('dictionary_form_hiragana', '')}・"
                f"{item.get('masu_form_hiragana', '')}\n"
                f"例：{item.get('example_sentence', '')}"
            )
        else:
            back = f"{item.get('word', '')}\n例：{item.get('example_sentence', '')}"
        addFlashcards(processed_content, item, back)
    return processed_content

def processChinese(processed_content, response_content):
    for item in response_content:
        pinyin = item.get('pinyin', '')
        if item.get("type") == "noun":
            back = (
                f"{item.get('word', '')}"
                f"({pinyin})\n"
                f"例：{item.get('example_sentence', '')}"
            )
        else:
            back = (
                f"{item.get('word', '')}\n"
                f"例：{item.get('example_sentence', '')}"
                f"({pinyin})\n"
            )
        addFlashcards(processed_content, item, back)
    return processed_content

def processSpanish(processed_content, response_content):
    for item in response_content:
        match item.get("type"):
            case "noun":
                back = (
                    f"({item.get('article', '')})"
                    f"{item.get('word', '')}\n"
                    f"ejemplo: {item.get('example_sentence', '')}"
                )
            case "adjective":
                back = (
                    f"{item.get('feminine_form', '')}/"
                    f"{item.get('masculine_form', '')}\n"
                    f"ejemplo: {item.get('example_sentence', '')}"
                )
            case "verbs":
                back = (
                    f"{item.get('infinitive', '')}/"
                    f"{item.get('present_conjugation', '')}\n"
                    f"ejemplo: {item.get('example_sentence', '')}"
                )
            case _:
                back = (
                    f"{item.get('word', '')}\n"
                    f"ejemplo: {item.get('example_sentence', '')}"
                )
        addFlashcards(processed_content, item, back)
    return processed_content

def processKorean(processed_content, response_content):
    for item in response_content:
        romanization = item.get('romanization', '')
        match item.get("type"):
            case "verb":
                back = (
                    f"{item.get('dictionary_form', '')} "
                    f"({romanization})\n"
                    f"→ {item.get('polite_present', '')}\n"
                    f"예: {item.get('example_sentence', '')}"
                )
            case "adjective":
                back = (
                    f"{item.get('dictionary_form', '')} "
                    f"({romanization})\n"
                    f"→ {item.get('polite_present', '')}\n"
                    f"예: {item.get('example_sentence', '')}"
                )
            case "noun":
                back = (
                    f"{item.get('word', '')} ({romanization})\n"
                    f"{item.get('particle_usage', '')}\n"
                    f"예: {item.get('example_sentence', '')}"
                )
            case _:
                back = (
                    f"{item.get('word', '')} ({romanization})\n"
                    f"예: {item.get('example_sentence', '')}"
                )
        addFlashcards(processed_content, item, back)
    return processed_content

# process the data returned by groq and return it in a easy to use flashcard format
def process(response_content, language):
    processed_content = {
        "flashcards": []
    }
    match language:
        case "Japanese":
            return processJapanese(processed_content, response_content)
        case "Chinese":
            return processChinese(processed_content, response_content)
        case "Spanish":
            return processSpanish(processed_content, response_content)
        case "Korean":
            return processKorean(processed_content, response_content)
        case _:
            ## want to add a general processor for other stuff. For now just return the raw content and print a warning
            print(f"Warning: No processor for language '{language}'")
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

