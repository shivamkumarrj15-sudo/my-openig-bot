import sys
import urllib.request
import json

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

base_url = "http://localhost:2895/api/v1"
api_key = "openig_master_sec_2026_dev_key"

def get(path):
    req = urllib.request.Request(f"{base_url}{path}")
    req.add_header("X-API-Key", api_key)
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

def post(path, data):
    payload = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(f"{base_url}{path}", data=payload, headers={
        "Content-Type": "application/json",
        "X-API-Key": api_key
    })
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

print("--- 1. Testing AI Config ---")
ai_cfg = get("/ai/config")
print(f"AI Auto-Pilot Enabled: {ai_cfg['isEnabled']}, Niche: {ai_cfg['niche']}, Tone: {ai_cfg['brandTone']}")
print(f"Schedule Hours: {ai_cfg['postingScheduleHours']}")

print("\n--- 2. Testing Autonomous AI Post Generator ---")
generated_post = post("/ai/generate-post", {"topic": "Top 5 AI Automation Secrets in 2026"})
print(f"Topic: {generated_post['topic']}")
print(f"Hashtags: {generated_post['hashtags']}")
print(f"Caption Snippet: {generated_post['caption'][:120]}...")

print("\n--- 3. Testing 24/7 AI DM Conversational Agent ---")
dm_reply = post("/ai/generate-reply", {
    "senderUsername": "alex_growth",
    "incomingMessage": "Hey! How much does this cost and where can I buy?",
    "messageHistory": []
})
print(f"Detected Intent: {dm_reply['detectedIntent']}")
print(f"AI Response: {dm_reply['replyText']}")

print("\n--- 4. Testing Triggering Autonomous Post Publication ---")
autopost_res = post("/ai/trigger-autopost", {"sessionId": "ig_demo_creator"})
print(f"Auto-Post Result: {autopost_res}")

print("\n--- 5. Testing AI Activity Logs ---")
logs = get("/ai/logs")
print(f"Total AI Activity Logs: {len(logs)}")
if len(logs) > 0:
    print(f"Latest Log: [{logs[0]['type']}] {logs[0]['summary']}")

print("\nSUCCESS: 24/7 AI AUTO-PILOT VERIFIED & OPERATIONAL!")
