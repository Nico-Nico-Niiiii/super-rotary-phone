@echo off
echo Setting up Python environment...

echo Installing dependencies if needed...
pip install langchain langchain-core langchain-community langchain-openai langgraph chromadb sentence-transformers faiss-cpu numpy docx2txt

echo Running RAG system with Azure OpenAI...
python run_with_azure_fixed.py --zip-path "C:\Users\ADITYANJ\Downloads\testing001.zip" --rag-type raptor --verbose

echo Completed RAG processing.
pause