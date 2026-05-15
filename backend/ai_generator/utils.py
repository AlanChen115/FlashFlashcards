import json
import os
import re

from django.conf import settings
from groq import Groq


api_key = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=api_key.strip() if api_key else None)


def load_prompt(name):
    prompt_path = os.path.join(
        settings.BASE_DIR,
        "ai_generator",
        "prompts",
        name,
    )
    with open(prompt_path, "r", encoding="utf-8") as f:
        return f.read()


def extract_json(text):
    match = re.search(r"(\[.*?\]|\{.*?\})", text, re.DOTALL)
    return match.group(1) if match else text


def parse_json_response(raw):
    cleaned = extract_json(raw)
    return json.loads(cleaned)


def create_chat_completion(messages, model="llama-3.3-70b-versatile"):
    return client.chat.completions.create(
        messages=messages,
        model=model,
    )
