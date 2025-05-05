from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from fastapi.responses import StreamingResponse
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
import logging
import os
import io
import base64
import httpx
from pydantic import BaseModel

from app.core.utils import load_endpoints, get_prefix

ENDPOINTS = load_endpoints()
router_gyanhub = APIRouter(prefix=ENDPOINTS["GyanHub"]["prefix"], tags=["gyan_hub"])

GITEA_BASE_URL = "http://10.155.1.170:8080/api/v1"
GITEA_ACCESS_TOKEN = "f733445561d1c6d61df37944e82cd06a2a8ef32e"


class RepoRequest(BaseModel):
    username: str
    access_token: str


class FileContent(BaseModel):
    filepath: str
    content: str
    commit_message: str
    branch: str


@router_gyanhub.post(ENDPOINTS["GyanHub"]["routes"]["fetch_data_repo"])
async def fetch_data_repo(request: RepoRequest):
    """Fetch dataset repositories for a given user from Gitea."""
    logging.info(f"Fetching dataset repositories for user: {request.username}")

    headers = {"Authorization": f"token {request.access_token}"}
    url = f"{GITEA_BASE_URL}/users/{request.username}/repos?limit=100&page=1"

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)

    if response.status_code != 200:
        logging.error(f"Failed with status {response.status_code}")
        raise HTTPException(status_code=response.status_code, detail="Failed to fetch repositories from Gitea")

    all_repos = response.json()
    dataset_repos = [repo for repo in all_repos if repo.get("repo_type") == "data"]

    return {"dataset_repos": dataset_repos}


@router_gyanhub.post(ENDPOINTS["GyanHub"]["routes"]["fetch_model_repo"])
async def fetch_model_repo(request: RepoRequest):
    """Fetch model repositories for a given user from Gitea."""
    logging.info(f"Fetching model repositories for user: {request.username}")

    headers = {"Authorization": f"token {request.access_token}"}
    url = f"{GITEA_BASE_URL}/users/{request.username}/repos?limit=100&page=1"

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)

    if response.status_code != 200:
        logging.error(f"Failed with status {response.status_code}")
        raise HTTPException(status_code=response.status_code, detail="Failed to fetch repositories from Gitea")

    all_repos = response.json()
    model_repos = [repo for repo in all_repos if repo.get("repo_type") == "model"]

    return {"model_repos": model_repos}


@router_gyanhub.get(ENDPOINTS["GyanHub"]["routes"]["download_file"])
async def download_file(owner: str, repo: str, branch: str, filepath: str):
    """Download a file from a Gitea repository."""
    url = f"{GITEA_BASE_URL}/api/v1/repos/{owner}/{repo}/media/{filepath}?ref={branch}"
    headers = {"Authorization": f"token {GITEA_ACCESS_TOKEN}"}

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, follow_redirects=True)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Failed to fetch file from Gitea")

    file_like = io.BytesIO(response.content)

    return StreamingResponse(file_like, media_type="application/octet-stream", headers={
        "Content-Disposition": f'attachment; filename="{os.path.basename(filepath)}"'
    })


@router_gyanhub.post(ENDPOINTS["GyanHub"]["routes"]["push_file"])
async def push_file(owner: str, repo: str, file: FileContent):
    """Push a file to a Gitea repository."""
    logging.info(f"Pushing file '{file.filepath}' to repo '{repo}' on branch '{file.branch}'")

    encoded_content = base64.b64encode(file.content.encode()).decode()

    headers = {"Authorization": f"token {GITEA_ACCESS_TOKEN}"}
    url = f"{GITEA_BASE_URL}/repos/{owner}/{repo}/contents/{file.filepath}"

    payload = {
        "content": encoded_content,
        "message": file.commit_message,
        "branch": file.branch
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers)

    if response.status_code not in [200, 201]:
        logging.error(f"Failed to push file. Status: {response.status_code}, Response: {response.text}")
        raise HTTPException(status_code=response.status_code, detail=response.json())

    return response.json()
