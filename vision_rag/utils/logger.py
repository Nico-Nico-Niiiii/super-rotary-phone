import sys
import os
from pathlib import Path
from loguru import logger

# Import settings
sys.path.append(str(Path(__file__).resolve().parent.parent))
from config.settings import LOG_LEVEL, BASE_DIR

# Configure logger
log_file = os.path.join(BASE_DIR, "logs", "vision_rag.log")
os.makedirs(os.path.dirname(log_file), exist_ok=True)

# Remove default handler
logger.remove()

# Add console handler
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level=LOG_LEVEL,
    colorize=True,
)

# Add file handler
logger.add(
    log_file,
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} - {message}",
    level=LOG_LEVEL,
    rotation="10 MB",
    compression="zip",
)