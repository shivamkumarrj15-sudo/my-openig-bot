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

print("--- 1. Testing Health & Metrics ---")
health = get("/health")
print("Health:", health["status"], "Version:", health["version"])
metrics = get("/metrics")
print("Active Sessions:", metrics["activeSessions"], "Automations:", metrics["totalAutomations"])

print("\n--- 2. Testing Sessions ---")
sessions = get("/sessions")
print(f"Total Sessions: {len(sessions)}")
print(f"Session 0: @{sessions[0]['username']} - Status: {sessions[0]['status']}")

print("\n--- 3. Testing Direct Messages (DM) ---")
dm = post("/sessions/ig_demo_creator/messages/text", {
    "recipientUsername": "alex_rivers",
    "text": "Hello from OpenIG Automated Verification! [Rocket]"
})
print("Sent DM ID:", dm["id"], "Status:", dm["status"], "Content:", dm["content"])

print("\n--- 4. Testing Automations (Comment-to-DM Trigger) ---")
automations = get("/automations")
print(f"Loaded {len(automations)} automation rules")
for r in automations:
    print(f" - Rule: {r['name']} ({r['type']})")

comment_sim = post("/sessions/ig_demo_creator/comments/simulate", {
    "authorUsername": "fashion_blogger_anna",
    "text": "Love this! Please send PRICE and LINK in DM!"
})
print("Simulated Comment ID:", comment_sim["comment"]["id"])
print("Automation Trigger Result:", comment_sim["automationResult"])

print("\n--- 5. Testing Feed Post Publishing ---")
post_res = post("/sessions/ig_demo_creator/posts", {
    "type": "feed",
    "mediaUrls": ["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800"],
    "caption": "Test Post from Automated Test Suite! #OpenIG #Developer",
    "hashtags": ["OpenIG", "Developer"]
})
print("Published Post ID:", post_res["id"], "Instagram Code:", post_res["instagramCode"])

print("\nSUCCESS: ALL API ENDPOINTS VERIFIED AND OPERATIONAL!")
