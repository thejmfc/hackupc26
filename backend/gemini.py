import os
from huggingface_hub import InferenceClient
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
      "description": "<activity description>",
      "time_to_complete": <duration in hours as number>,
      "time_to_travel": <travel time in hours as number>,
      "price": <estimated cost in GBP as number>,
      "latitude": <number>,
      "longitude": <number>
    }
  ]
}
Rules: suggest 3-6 practical activities, account for travel time, leave a 2-hour buffer before departure unless told otherwise, use real place names and accurate coordinates, all numeric fields must be numbers not strings."""


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
