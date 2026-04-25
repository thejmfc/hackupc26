import os
from google import genai
from google.genai import types
import dotenv

dotenv.load_dotenv()


def generate(prompt: str):
    client = genai.Client(
        api_key=os.getenv("GEMINI_API_KEY"),
    )

    model = "gemini-3.1-flash-lite-preview"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=prompt),
            ],
        ),
    ]
    generate_content_config = types.GenerateContentConfig(
        temperature=1.15,
        thinking_config=types.ThinkingConfig(
            thinking_level="HIGH",
        ),
        response_mime_type="application/json",
        response_schema=genai.types.Schema(
            type = genai.types.Type.OBJECT,
            required = ["layover_airport", "layover_flight_arrival", "layover_flight_departure", "time_to_complete_quests", "sidequests"],
            properties = {
                "layover_airport": genai.types.Schema(
                    type = genai.types.Type.STRING,
                    description = "IATA airport code e.g. NRT",
                ),
                "layover_flight_arrival": genai.types.Schema(
                    type = genai.types.Type.STRING,
                    description = "ISO 8601 datetime e.g. 2025-06-01T14:30:00Z",
                ),
                "layover_flight_departure": genai.types.Schema(
                    type = genai.types.Type.STRING,
                    description = "ISO 8601 datetime e.g. 2025-06-01T22:00:00Z",
                ),
                "time_to_complete_quests": genai.types.Schema(
                    type = genai.types.Type.NUMBER,
                    description = "Total hours needed to complete all activities",
                ),
                "sidequests": genai.types.Schema(
                    type = genai.types.Type.ARRAY,
                    items = genai.types.Schema(
                        type = genai.types.Type.OBJECT,
                        required = ["type", "description", "time_to_complete", "price", "latitude", "longitude"],
                        properties = {
                            "type": genai.types.Schema(
                                type = genai.types.Type.STRING,
                                description = "Category e.g. food, culture, nature, shopping",
                            ),
                            "description": genai.types.Schema(
                                type = genai.types.Type.STRING,
                            ),
                            "time_to_complete": genai.types.Schema(
                                type = genai.types.Type.NUMBER,
                                description = "Duration in hours",
                            ),
                            "time_to_travel": genai.types.Schema(
                                type = genai.types.Type.NUMBER,
                                description = "Duration in hours",
                            ),
                            "price": genai.types.Schema(
                                type = genai.types.Type.NUMBER,
                                description = "Estimated cost in GBP",
                            ),
                            "latitude": genai.types.Schema(
                                type = genai.types.Type.NUMBER,
                            ),
                            "longitude": genai.types.Schema(
                                type = genai.types.Type.NUMBER,
                            ),
                        },
                    ),
                ),
            },
        ),
    )

    result = ""
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        if text := chunk.text:
            result += text
    return result

# if __name__ == "__main__":
#     user_prompt = input("Enter your prompt: ")
#     prompt = f"You are a travel assistant looking to help someone fill the time between a layover with some fun sidequests in the area. The user has given you the following information about their layover: {user_prompt} \n You should consider the time to travel between the previous location and the current location and suggest a logical flow of activities. When considering time to travel to these places you should also consider the pricing for transportation in the area and consider that as part of budget, choose the most suitable options based on timing and also the pricing. You should allow for some buffer time to ensure the user does not miss their next flight should there be delays, unless the user specifies otherwise, try to leave 2 hours before their next flight where they should be at the aiport."
#     generate(prompt)

def generate_with_prompt(user_prompt: str):
    prompt = f"""You are a travel assistant looking to help someone fill the time between a layover with some fun sidequests in the area. The user has given you the following information about their layover: {user_prompt} \n 
                You should consider the time to travel between the previous location and the current location and suggest a logical flow of activities. When considering time to travel to these places you should also consider the 
                pricing for transportation in the area and consider that as part of budget, choose the most suitable options based on timing and also the pricing. You should allow for some buffer time to ensure the user does not 
                miss their next flight should there be delays, unless the user specifies otherwise, try to leave 2 hours before their next flight where they should be at the aiport. \n
                If the layover is overnight and over a long period, you should recommend to the user to stay at a hotel and get some rest as well as some activities that they can do. You should also consider the time of day of the 
                layover and suggest activities that are open at that time. If the user specifies how much rest they want use that otherwise, you should aim to give at least 6 hours of rest if the layover is over 10 hours and or overnight."""
    print("Now generating...")
    return generate(prompt)