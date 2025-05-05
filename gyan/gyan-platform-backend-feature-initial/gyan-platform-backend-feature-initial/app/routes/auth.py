from fastapi import APIRouter, Response, Depends, HTTPException, Cookie
from sqlalchemy.orm import Session
from ..core.utils import get_route, get_prefix, load_endpoints
from ..core.config import settings
from ..core.security import verify_password, create_access_token, verify_token, create_access_token_longterm
from ..database.connection import get_db
from ..database.crud import DBOperations
from ..schemas.user import UserCreate, UserResponse, UserBase
from datetime import datetime
import json
from pathlib import Path

# Get endpoints configuration
ENDPOINTS = load_endpoints()

router = APIRouter(
    prefix=get_prefix("auth"),
    tags=["authentication"]
)




@router.post(ENDPOINTS["auth"]["routes"]["login"])
async def login(response: Response, user: UserResponse, db: Session = Depends(get_db)):
    db_user = DBOperations.get_user_by_email(db, user.email)
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )
    
    access_token = create_access_token(data={
        "sub": user.email,
        "id": db_user.id,
        "email": user.email 
    })
    
    response.set_cookie(
        key="token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="Strict",  # Changed to lax for better browser compatibility
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    return {
        "user": {
            "email": db_user.email,
            "id": db_user.id
        }
    }

# @router.post(ENDPOINTS["auth"]["routes"]["signup"])
# async def signup(user: UserCreate, db: Session = Depends(get_db)):
#     try:
       
        
#         # Check if user exists
#         db_user = DBOperations.get_user_by_email(db, user.email)
#         if db_user:
#             raise HTTPException(
#                 status_code=400, 
#                 detail="Email already registered"
#             )
        
#         # Create new user
#         new_user = DBOperations.create_user(db, user)
#         return {
#             "message": "User created successfully",
#             "user": {
#                 "email": new_user.email,
#                 "password": new_user.hashed_password,
#                 "id": new_user.id
#             }
#         }
#     except HTTPException as e:
#         raise e
#     except Exception as e:
#         print(f"Signup error: {str(e)}")  # For debugging
#         raise HTTPException(
#             status_code=500,
#             detail=f"Error creating user: {str(e)}"
#         )


# @router.post(ENDPOINTS["auth"]["routes"]["signup"])
# async def signup(user: UserCreate, db: Session = Depends(get_db)):
#     try:
#         # Check if user exists
#         db_user = DBOperations.get_user_by_email(db, user.email)
#         if db_user:
#             raise HTTPException(
#                 status_code=400, 
#                 detail="Email already registered"
#             )
        
#         # Call external API to create user before saving to local DB
#         import requests
        
#         # Prepare the external API request payload from the user data
#         external_payload = {
#             "username": user.username if user.username else user.email.split('@')[0],
#             "password": user.password,
#             "email": user.email,
#             "visibility": "public",
#             "must_change_password": False 
#         }
        
#         # Make the external API call
#         external_api_response = requests.post(
#             "http://10.155.1.170:8080/api/v1/admin/users",
#             headers={
#                 "Content-Type": "application/json",
#                 "Authorization": "token f733445561d1c6d61df37944e82cd06a2a8ef32e"
#             },
#             json=external_payload
#         )
#         print("response form gyanhub", external_api_response)

        
#         # Check if the external API call was successful
#         if external_api_response.status_code not in range(200, 300):
#             raise HTTPException(
#                 status_code=external_api_response.status_code,
#                 detail=f"External API error: {external_api_response.text}"
#             )
        
#         # If external API call succeeded, create user in local DB
#         new_user = DBOperations.create_user(db, user)
        
#         # Get the external API response data
#         external_data = external_api_response.json()
        
#         # Store the token from the external system if available
#         # if 'token' in external_data:
#         #     # Update user with gyanhub_token
#         #     DBOperations.update_user_token(db, new_user.id, external_data['token'])
        
#         return {
#             "message": "User created successfully",
#             "user": {
#                 "email": new_user.email,
#                 "username": new_user.username,
#                 "first_name": new_user.first_name,
#                 "last_name": new_user.last_name,
#                 "id": new_user.id
#             }
#         }
#     except HTTPException as e:
#         raise e
#     except Exception as e:
#         print(f"Signup error: {str(e)}")  # For debugging
#         raise HTTPException(
#             status_code=500,
#             detail=f"Error creating user: {str(e)}"
#         )


@router.post(ENDPOINTS["auth"]["routes"]["signup"])
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    try:
        # Check if user exists
        db_user = DBOperations.get_user_by_email(db, user.email)
        if db_user:
            raise HTTPException(
                status_code=400, 
                detail="Email already registered"
            )
        
        # Call external API to create user before saving to local DB
        import requests
        
        # Step 1: Prepare the external API request payload for user creation
        external_payload = {
            "username": user.username if user.username else user.email.split('@')[0],
            "password": user.password,
            "email": user.email,
            "visibility": "public",
            "must_change_password": False 
        }
        
        # Step 1: Make the external API call to create user
        external_api_response = requests.post(
            "http://10.155.1.170:8080/api/v1/admin/users",
            headers={
                "Content-Type": "application/json",
                "Authorization": "token f733445561d1c6d61df37944e82cd06a2a8ef32e"
            },
            json=external_payload
        )
        print("Response from gyanhub user creation:", external_api_response)
        
        # Check if the external API call was successful
        if external_api_response.status_code not in range(200, 300):
            raise HTTPException(
                status_code=external_api_response.status_code,
                detail=f"External API error: {external_api_response.text}"
            )
        
        # Get user data from first API call
        external_user_data = external_api_response.json()
        
        # Step 2: Generate token for the newly created user
        token_payload = {
            "name": "gyanhub_token",
            "scopes": ["all"]
        }
        
        # Get username from the created user or use 'GYAN' as in your example
        # created_username = external_user_data.get('username') or "GYAN"
        
        # Step 2: Make the API call to generate token
        token_response = requests.post(
            f"http://10.155.1.170:8080/api/v1/users/{user.username}/tokens",
            auth=(user.username, user.password),  # Using the basic auth from your curl example
            headers={"Content-Type": "application/json"},
            json=token_payload
        )
        print("Response from token creation:", token_response)
        
        # Check if token creation was successful
        if token_response.status_code not in range(200, 300):
    # Log error but continue (don't fail the whole signup)
            print(f"Token creation failed: {token_response.text}")
            return

       
        token_data = token_response.json()
       
        
        # Step 3: If both calls succeeded, create user in local DB
        new_user = DBOperations.create_user(db, user)
        
        # Step 4: Store the token from the external system if available
        if token_response.status_code in range(200, 300) and token_data.get('sha1'):
            # Update user with gyanhub_token
            DBOperations.update_user_token(db, new_user.id, token_data['sha1'])
        
        return {
            "message": "User created successfully",
            "user": {
                "email": new_user.email,
                "username": new_user.username,
                "first_name": new_user.first_name,
                "last_name": new_user.last_name,
                "id": new_user.id
            }
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Signup error: {str(e)}")  # For debugging
        raise HTTPException(
            status_code=500,
            detail=f"Error creating user: {str(e)}"
        )

@router.post(ENDPOINTS["auth"]["routes"]["logout"])
async def logout(response: Response):
    response.delete_cookie(
        key="token",
        httponly=True,
        secure=False,
        samesite="Strict"
    )
    return {"message": "Logged out successfully"}

@router.post(ENDPOINTS["auth"]["routes"]["refresh_token"])
async def refresh_token(response: Response, token: str = Cookie(None)):
    if not token:
        raise HTTPException(
            status_code=401,
            detail="No token provided"
        )
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )
    
    # Create new token with same user data
    new_token = create_access_token(data={
        "sub": payload["sub"],
        "id": payload.get("id")
    })
    
    response.set_cookie(
        key="token",
        value=new_token,
        httponly=True,
        secure=False,
        samesite="Strict",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    return {
        "user": {
            "email": payload["sub"],
            "id": payload.get("id")
        }
    }

@router.get(ENDPOINTS["auth"]["routes"]["verify"])
async def verify_token_route(token: str = Cookie(None)):
    try:
        if not token:
            raise HTTPException(
                status_code=401,
                detail="No authentication token found"
            )
        
        payload = verify_token(token)
        if not payload:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired token"
            )
        
        return {
            "valid": True,
            "user": {
                "email": payload["sub"],
                "id": payload.get("id")
            }
        }
    except Exception as e:
        print(f"Verify error: {str(e)}")  # For debugging
        raise HTTPException(
            status_code=401,
            detail="Authentication failed"
        )
    



@router.post(ENDPOINTS["auth"]["routes"]["create_access_token"])
async def create_token(user: UserBase, db: Session = Depends(get_db)):
    db_user = DBOperations.get_user_by_email(db, user.email)
    # if not db_user or not verify_password(user.password, db_user.hashed_password):
    #     raise HTTPException(
    #         status_code=401,
    #         detail="Invalid credentials"
    #     )
    
    access_token = create_access_token_longterm(data={
        "sub": user.email,
        "id": db_user.id,
        "email": user.email 
    })
    
    
    return {
        "access_token": access_token 
    }