import requests
from typing import Dict, Any, List, Optional

class OpenIGClient:
    """
    Official Python Client for OpenIG Instagram Gateway.
    """
    def __init__(self, base_url: str = "http://localhost:2895/api/v1", api_key: str = "openig_master_sec_2026_dev_key"):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            "X-API-Key": self.api_key,
            "Content-Type": "application/json",
            "User-Agent": "OpenIG-Python-SDK/1.0"
        })

    def get_health(self) -> Dict[str, Any]:
        """Check server health"""
        res = self.session.get(f"{self.base_url}/health")
        res.raise_for_status()
        return res.json()

    def get_metrics(self) -> Dict[str, Any]:
        """Get gateway metrics"""
        res = self.session.get(f"{self.base_url}/metrics")
        res.raise_for_status()
        return res.json()

    # --- SESSIONS ---
    def list_sessions(self) -> List[Dict[str, Any]]:
        """List all connected Instagram accounts"""
        res = self.session.get(f"{self.base_url}/sessions")
        res.raise_for_status()
        return res.json()

    def create_session(self, username: str, password: Optional[str] = None, cookies: Optional[Dict[str, str]] = None, proxy: Optional[str] = None) -> Dict[str, Any]:
        """Create or authenticate an Instagram account"""
        payload = {"username": username, "password": password, "cookies": cookies, "proxy": proxy}
        res = self.session.post(f"{self.base_url}/sessions", json=payload)
        res.raise_for_status()
        return res.json()

    def submit_2fa(self, session_id: str, code: str) -> Dict[str, Any]:
        """Submit 2FA / Checkpoint verification code"""
        res = self.session.post(f"{self.base_url}/sessions/{session_id}/2fa", json={"code": code})
        res.raise_for_status()
        return res.json()

    # --- DIRECT MESSAGES (DMs) ---
    def get_threads(self, session_id: str) -> List[Dict[str, Any]]:
        """Get list of DM threads"""
        res = self.session.get(f"{self.base_url}/sessions/{session_id}/chats")
        res.raise_for_status()
        return res.json()

    def get_messages(self, session_id: str, thread_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get messages inside a thread"""
        res = self.session.get(f"{self.base_url}/sessions/{session_id}/chats/{thread_id}/messages?limit={limit}")
        res.raise_for_status()
        return res.json()

    def send_text_dm(self, session_id: str, recipient_username: str, text: str) -> Dict[str, Any]:
        """Send a text Direct Message"""
        payload = {"recipientUsername": recipient_username, "text": text}
        res = self.session.post(f"{self.base_url}/sessions/{session_id}/messages/text", json=payload)
        res.raise_for_status()
        return res.json()

    def send_media_dm(self, session_id: str, recipient_username: str, media_url: str, media_type: str = "image") -> Dict[str, Any]:
        """Send an image/video/voice Direct Message"""
        payload = {"recipientUsername": recipient_username, "mediaUrl": media_url, "mediaType": media_type}
        res = self.session.post(f"{self.base_url}/sessions/{session_id}/messages/media", json=payload)
        res.raise_for_status()
        return res.json()

    def react_to_message(self, session_id: str, message_id: str, emoji: str = "❤️") -> Dict[str, Any]:
        """Send an emoji reaction to a message"""
        res = self.session.post(f"{self.base_url}/sessions/{session_id}/messages/{message_id}/reaction", json={"emoji": emoji})
        res.raise_for_status()
        return res.json()

    # --- POSTS, REELS & STORIES ---
    def publish_post(self, session_id: str, media_urls: List[str], caption: str = "", hashtags: Optional[List[str]] = None, location: Optional[str] = None) -> Dict[str, Any]:
        """Publish a feed post or carousel"""
        post_type = "carousel" if len(media_urls) > 1 else "feed"
        payload = {
            "type": post_type,
            "mediaUrls": media_urls,
            "caption": caption,
            "hashtags": hashtags or [],
            "location": location
        }
        res = self.session.post(f"{self.base_url}/sessions/{session_id}/posts", json=payload)
        res.raise_for_status()
        return res.json()

    def publish_story(self, session_id: str, media_url: str, story_link: Optional[str] = None, story_link_text: Optional[str] = None) -> Dict[str, Any]:
        """Publish a 24-hour Story with link sticker"""
        payload = {
            "type": "story",
            "mediaUrls": [media_url],
            "storyLink": story_link,
            "storyLinkText": story_link_text
        }
        res = self.session.post(f"{self.base_url}/sessions/{session_id}/posts", json=payload)
        res.raise_for_status()
        return res.json()

    # --- AUTOMATIONS ---
    def create_comment_to_dm_rule(self, name: str, keywords: List[str], dm_template: str, public_reply: Optional[str] = None) -> Dict[str, Any]:
        """Create Comment-to-DM growth rule"""
        payload = {
            "name": name,
            "type": "comment_to_dm",
            "triggerKeywords": keywords,
            "actionLikeComment": True,
            "actionPublicReplyTemplate": public_reply,
            "actionDmMessageTemplate": dm_template
        }
        res = self.session.post(f"{self.base_url}/automations", json=payload)
        res.raise_for_status()
        return res.json()
