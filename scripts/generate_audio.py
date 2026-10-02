import asyncio
import os
import re
import edge_tts

LESSONS = [
  {"id": 1, "sentence": "Please remember to _______ off the projector before leaving the seminar hall."},
  {"id": 2, "sentence": "He had to cancel his ticket because an urgent emergency _______ up."},
  {"id": 3, "sentence": "She carried an umbrella because the sky looked _______ this morning."},
  {"id": 4, "sentence": "Could you please _______ me a glass of water?"},
  {"id": 5, "sentence": "The manager asked everyone to _______ down their mobile phones during the client call."},
  {"id": 6, "sentence": "He could not enter the lab because he _______ his identity badge at home."},
  {"id": 7, "sentence": "The bus was so crowded that several passengers had to _______ all the way."},
  {"id": 8, "sentence": "She set an alarm for five o'clock so she would not _______ her morning train."},
  {"id": 9, "sentence": "The supervisor asked him to send an email to _______ the meeting date."},
  {"id": 10, "sentence": "He bought a new pair of running shoes because his old ones were _______ out."},
  {"id": 11, "sentence": "Students must _______ their final project reports before five o'clock on Friday."},
  {"id": 12, "sentence": "The laptop stopped working because the battery was completely _______."},
  {"id": 13, "sentence": "Did you _______ down the professor's contact number on your notebook?"},
  {"id": 14, "sentence": "The printer ran _______ of paper while printing the examination notices."},
  {"id": 15, "sentence": "All team members were present, but nobody had _______ the project slides."},
  {"id": 16, "sentence": "Please check your network settings if you are unable to _______ to the Wi-Fi."},
  {"id": 17, "sentence": "The classroom was so noisy that the teacher had to _______ his voice."},
  {"id": 18, "sentence": "He spent the entire weekend studying in order to _______ his backlog exams."},
  {"id": 19, "sentence": "The external evaluator asked the candidate to _______ the logic behind the code."},
  {"id": 20, "sentence": "She could not borrow the handbook because her library card was _______."},
  {"id": 21, "sentence": "The passengers were told to fasten their seatbelts before the plane could _______ off."},
  {"id": 22, "sentence": "He had to pay a fine because he parked his vehicle in a _______ zone."},
  {"id": 23, "sentence": "The train was delayed by thirty minutes due to heavy _______ along the coastal tracks."},
  {"id": 24, "sentence": "Please hold _______ to the handrail while the escalator is moving."},
  {"id": 25, "sentence": "She stood in line at the counter to _______ in her luggage."},
  {"id": 26, "sentence": "He missed the announcement because he was _______ earphones."},
  {"id": 27, "sentence": "The security guard asked the visitors to show their _______ before entering."},
  {"id": 28, "sentence": "The flight attendant handed each passenger a bottle of _______."},
  {"id": 29, "sentence": "We should leave early tomorrow morning to _______ the heavy traffic."},
  {"id": 30, "sentence": "The taxi driver asked the passenger which _______ of the city he wanted to visit."},
  {"id": 31, "sentence": "The soup was so hot that he had to wait for it to _______ down."},
  {"id": 32, "sentence": "Could you please pass the _______ so I can season my salad?"},
  {"id": 33, "sentence": "They decided to split the restaurant _______ equally among all four friends."},
  {"id": 34, "sentence": "She drank a tall glass of cold water to quench her _______."},
  {"id": 35, "sentence": "He ordered a fruit salad because he wanted a _______ dessert."},
  {"id": 36, "sentence": "The bread was left uncovered on the counter and became _______."},
  {"id": 37, "sentence": "Please taste the curry to check if it has enough _______."},
  {"id": 38, "sentence": "They reserved a table in advance because the cafe is always _______ on weekends."},
  {"id": 39, "sentence": "The tea was too bitter, so she added a spoonful of _______."},
  {"id": 40, "sentence": "He gave a generous _______ to the waiter for providing quick service."},
  {"id": 41, "sentence": "The doctor advised him to take these pills twice a _______ after meals."},
  {"id": 42, "sentence": "She applied ice to her ankle to reduce the _______ after slipping on the stairs."},
  {"id": 43, "sentence": "The plumber was called to fix a leaking _______ in the washroom."},
  {"id": 44, "sentence": "Don't touch the iron while it is plugged in because it is very _______."},
  {"id": 45, "sentence": "He went to bed early last night because he had a terrible _______."},
  {"id": 46, "sentence": "Remember to lock the front _______ before you go to sleep."},
  {"id": 47, "sentence": "The room was pitch black until she switched on the _______."},
  {"id": 48, "sentence": "The technician told us that the air conditioner needs more _______ to cool properly."},
  {"id": 49, "sentence": "She wore sunglasses during her afternoon drive to protect her eyes from the bright _______."},
  {"id": 50, "sentence": "He had to call an electrician because all the power in his house suddenly went _______."}
]

# Fix question 44 key
for l in LESSONS:
    if "sentence" not in l:
        l["sentence"] = "Don't touch the iron while it is plugged in because it is very _______."

VOICES = [
    # American
    {"key": "us_female", "voice": "en-US-JennyNeural"},
    {"key": "us_male", "voice": "en-US-GuyNeural"},
    # British
    {"key": "uk_female", "voice": "en-GB-SoniaNeural"},
    {"key": "uk_male", "voice": "en-GB-RyanNeural"},
    # Indian
    {"key": "in_female", "voice": "en-IN-NeerjaNeural"},
    {"key": "in_male", "voice": "en-IN-PrabhatNeural"}
]

OUT_DIR = os.path.join(os.path.dirname(__file__), "public", "audio")
os.makedirs(OUT_DIR, exist_ok=True)

async def generate_file(voice_key, voice_name, q_id, text, sem):
    filepath = os.path.join(OUT_DIR, f"{voice_key}_{q_id}.mp3")
    if os.path.exists(filepath) and os.path.getsize(filepath) > 1000:
        return
    
    # Replace _______ with explicit spoken cue "blank"
    spoken_text = re.sub(r'_+', ' blank ', text)
    async with sem:
        try:
            communicate = edge_tts.Communicate(spoken_text, voice_name, rate="-5%")
            await communicate.save(filepath)
            print(f"Generated: {voice_key}_{q_id}.mp3")
        except Exception as e:
            print(f"Error {voice_key}_{q_id}: {e}")

async def main():
    sem = asyncio.Semaphore(5)
    tasks = []
    for v in VOICES:
        for item in LESSONS:
            tasks.append(generate_file(v["key"], v["voice"], item["id"], item["sentence"], sem))
    
    print(f"Generating {len(tasks)} audio files across 6 voices into {OUT_DIR}...")
    await asyncio.gather(*tasks)
    print("All audio files successfully generated!")

if __name__ == "__main__":
    asyncio.run(main())
