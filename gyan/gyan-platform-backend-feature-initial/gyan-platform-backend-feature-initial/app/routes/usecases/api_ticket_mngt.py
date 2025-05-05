from fastapi import APIRouter, HTTPException, UploadFile, Request, File, Form
from fastapi.responses import JSONResponse

from app.usecases.ticket_management.infer import Ticket_Management 
from app.core.utils import load_endpoints, get_prefix

ENDPOINTS = load_endpoints()

router_ticket_mgnt = APIRouter(prefix=ENDPOINTS["usecases"]["ticket_management"]["prefix"], tags=["ticket_mgnt"])

ticket_manager = Ticket_Management()

@router_ticket_mgnt.post(ENDPOINTS["usecases"]["ticket_management"]["routes"]["generate"])
async def process_ticket_file(file: UploadFile = File(...), choice: str = Form(...)):
    file_contents = await file.read()
    
    if choice == "label" :
        issue_list = ticket_manager.infer_label(file_contents)
        return JSONResponse(content = {"response" : issue_list})
    
    elif choice == "duplicate":
        duplicates = ticket_manager.infer_duplicates(file_contents)
        return JSONResponse(content = {"response" : duplicates})

    elif choice == "blank":
        failure_list, total_issues, category_counts_dict, total_records, df_filled = ticket_manager.infer_blanks(file_contents)
        output_json = {
            "failure_list" : failure_list, 
            "total_issues" : total_issues, 
            "category_counts" : category_counts_dict, 
            "total_records" : total_records, 
            "df_filled" : df_filled
        }

        return JSONResponse(content = {"response" : output_json})
    
    elif choice == "response_file" :
        suggestion_list = ticket_manager.infer_response_file(file_contents)

        return JSONResponse(content = {"response" : suggestion_list})


@router_ticket_mgnt.post(ENDPOINTS["usecases"]["ticket_management"]["routes"]["chat"])
async def process_ticket_chat(query: str = Form(...)):
        print("Query - ", query)
        chat_out = ticket_manager.infer_response_chat(query)
        return JSONResponse(content = {"response": chat_out})