import json
from pathlib import Path
from functools import lru_cache

@lru_cache()
def load_endpoints():
    with open(Path(__file__).parent.parent.parent / 'endpoints.json') as f:
        return json.load(f)

def get_route(section: str, route_name: str) -> str:
    """Get full route path including prefix"""
    endpoints = load_endpoints()
    return endpoints[section]["prefix"] + endpoints[section]["routes"][route_name]

def get_prefix(section: str) -> str:
    """Get prefix for a section"""
    endpoints = load_endpoints()
    return endpoints[section]["prefix"]