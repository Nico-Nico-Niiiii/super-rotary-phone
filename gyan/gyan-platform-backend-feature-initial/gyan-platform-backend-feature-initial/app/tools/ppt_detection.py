import re
from typing import Tuple

def detect_ppt_request(text: str) -> bool:
    """Detect if the user is requesting a PowerPoint presentation."""
    # Common patterns for presentation requests
    ppt_patterns = [
        r"(?i)create a (powerpoint|ppt|presentation|slide deck) (about|on)",
        r"(?i)make a (powerpoint|ppt|presentation|slides) (about|on)",
        r"(?i)generate a (powerpoint|ppt|presentation) (about|on)",
        r"(?i)prepare (a|some) (powerpoint|ppt|slides|presentation) (about|on)",
        r"(?i)can you (create|make|build) a (powerpoint|ppt|presentation)",
        r"(?i)i need a (powerpoint|ppt|presentation) (about|on|for)"
    ]
    
    # Check if any pattern matches
    for pattern in ppt_patterns:
        if re.search(pattern, text):
            return True
    
    return False

def extract_ppt_topic(text: str) -> str:
    """Extract the presentation topic from the request."""
    # Patterns to extract topics from different phrasings
    topic_patterns = [
        r"(?i)create a (?:powerpoint|ppt|presentation|slide deck) (?:about|on) (.+)$",
        r"(?i)make a (?:powerpoint|ppt|presentation|slides) (?:about|on) (.+)$",
        r"(?i)generate a (?:powerpoint|ppt|presentation) (?:about|on) (.+)$",
        r"(?i)prepare (?:a|some) (?:powerpoint|ppt|slides|presentation) (?:about|on) (.+)$",
        r"(?i)can you (?:create|make|build) a (?:powerpoint|ppt|presentation) (?:about|on) (.+)$",
        r"(?i)i need a (?:powerpoint|ppt|presentation) (?:about|on|for) (.+)$"
    ]
    
    # Try each pattern
    for pattern in topic_patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1).strip()
    
    # Default if no specific topic found
    return "the requested topic"