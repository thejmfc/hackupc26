import os
from huggingface_hub import InferenceClient
from google import genai
from google.genai import types
import dotenv

dotenv.load_dotenv()

MODEL = "google/gemma-4-31B-it"

SYSTEM_PROMPT = """You are a travel assistant helping someone fill time during a layover with fun sidequests.
Respond with valid JSON only, matching this exact schema:
{
  "layover_airport": "<IATA code e.g. NRT>",
  "layover_flight_arrival": "<ISO 8601 datetime e.g. 2025-06-01T14:30:00Z>",
  "layover_flight_departure": "<ISO 8601 datetime e.g. 2025-06-01T22:00:00Z>",
  "time_to_complete_quests": <total hours as number>,
  "sidequests": [
    {
      "type": "<category: food, culture, nature, or shopping>",
      "description": "<one or two sentences about what the activity involves>",
      "time_to_complete": <duration in hours as number>,
      "time_to_travel": <travel time in hours as number>,
      "price": <estimated cost in GBP as number>,
      "latitude": <number>,
      "longitude": <number>
    }
  ]
}
Rules: suggest 3-6 practical activities, account for travel time, leave a 2-hour buffer before departure unless told otherwise, use real place names and accurate coordinates, all numeric fields must be numbers not strings, never prefix a value with its field name."""


def generate(prompt: str) -> str:
    client = InferenceClient(
        model=MODEL,
        token=os.getenv("HF_TOKEN"),
    )

    response = client.chat_completion(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
        max_tokens=2048,
    )

    return response.choices[0].message.content


def generate_with_prompt(user_prompt: str) -> str:
    prompt = (
        f"The user has given you the following information about their layover: {user_prompt}\n"
        "Consider the time to travel between locations and suggest a logical flow of activities. "
        "Account for transportation costs within the budget. "
        "Leave a 2-hour buffer before the next flight unless the user specifies otherwise."
    )
    print("Now generating...")
    return generate(prompt)


# --- Google AI Studio version ---

GEMINI_MODEL = "gemma-4-31b-it"


def generate_google(prompt: str) -> str:
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    response_schema = genai.types.Schema(
        type=genai.types.Type.OBJECT,
        required=["layover_airport", "layover_flight_arrival", "layover_flight_departure", "time_to_complete_quests", "sidequests"],
        properties={
            "layover_airport": genai.types.Schema(type=genai.types.Type.STRING, description="IATA airport code e.g. NRT"),
            "layover_flight_arrival": genai.types.Schema(type=genai.types.Type.STRING, description="ISO 8601 datetime"),
            "layover_flight_departure": genai.types.Schema(type=genai.types.Type.STRING, description="ISO 8601 datetime"),
            "time_to_complete_quests": genai.types.Schema(type=genai.types.Type.NUMBER, description="Total hours needed"),
            "sidequests": genai.types.Schema(
                type=genai.types.Type.ARRAY,
                items=genai.types.Schema(
                    type=genai.types.Type.OBJECT,
                    required=["type", "description", "time_to_complete", "price", "latitude", "longitude"],
                    properties={
                        "type": genai.types.Schema(type=genai.types.Type.STRING),
                        "description": genai.types.Schema(type=genai.types.Type.STRING),
                        "time_to_complete": genai.types.Schema(type=genai.types.Type.NUMBER, description="Duration in hours"),
                        "time_to_travel": genai.types.Schema(type=genai.types.Type.NUMBER, description="Travel time in hours"),
                        "price": genai.types.Schema(type=genai.types.Type.NUMBER, description="Estimated cost in GBP"),
                        "latitude": genai.types.Schema(type=genai.types.Type.NUMBER),
                        "longitude": genai.types.Schema(type=genai.types.Type.NUMBER),
                    },
                ),
            ),
        },
    )

    config = types.GenerateContentConfig(
        temperature=0.7,
        response_mime_type="application/json",
        response_schema=response_schema,
    )

    result = ""
    for chunk in client.models.generate_content_stream(
        model=GEMINI_MODEL,
        contents=[types.Content(role="user", parts=[types.Part.from_text(text=prompt)])],
        config=config,
    ):
        if chunk.text:
            result += chunk.text
    return result


def generate_with_prompt_google(user_prompt: str) -> str:
    prompt = (
        f"You are a travel assistant helping someone fill layover time with fun sidequests. "
        f"The user has given you the following information about their layover: {user_prompt}\n"
        "Consider the time to travel between locations and suggest a logical flow of activities. "
        "Account for transportation costs within the budget. "
        "Leave a 2-hour buffer before the next flight unless the user specifies otherwise."
        "If the layover is long and overnight, suggest activities in line with the times they are availale."
        "If the layover is long and overnight, take into account that the user should always at some point, and suggest a good time for that."
    )
    print("Now generating (Google AI Studio)...")
    return generate_google(prompt)
