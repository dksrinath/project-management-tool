import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv('GROQ_API_KEY'))

def generate_user_stories(description):
    if not description or not description.strip():
        return {'error': 'Project description is required'}, 400
    
    api_key = os.getenv('GROQ_API_KEY')
    if not api_key:
        return {'error': 'GROQ API key not configured'}, 500

    prompt = f"""Generate user stories from this project description:
    {description}

    Format each story as: As a [role], I want to [action], so that [benefit].
    Return only the user stories, one per line."""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=500
        )
        stories = response.choices[0].message.content.strip().split('\n')
        return [s.strip() for s in stories if s.strip()], 200
    except Exception as e:
        print(f"GROQ API Error: {str(e)}")
        return {'error': f'AI service error: {str(e)}'}, 500
