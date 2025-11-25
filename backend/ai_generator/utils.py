import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY").strip())
def create_messages(text, language):
    prompt = (
        f"Please go through the following {language} article and for each word "
        "create vocabulary flashcards with the word, its translation, and an example "
        "sentence using the word. Format the response as a JSON array of objects with "
        "the keys: 'word', 'translation', 'example_sentence', 'translated example sentence'. "
        "If the word is a verb, convert it to its dictionary form and also provide its "
        "masu form as well as the particles it takes. "
        f"Here is the article:\n{text}"
    )

    chat_completion = client.chat.completions.create(
        messages=[{
            "role": "user",
            "content": prompt  
        }],
        model="llama-3.3-70b-versatile"
    )
    return chat_completion

def parse_article(text, language):
    messages = create_messages(text, language)
    response_content = messages.choices[0].message.content
    print(response_content)
    return {
        "flashcards": response_content,
        "error": None
    }
    # # Dummy implementation for illustration
    # summary = text[:100]  # Just return the first 100 characters as a "summary"
    # return {
    #     "summary": summary,
    #     "length": len(text),
    #     "error": None
    # }

