import os
import sys
import traceback
from rag_pipeline import RAGPipeline

def main():
    try:
        
        # Initialize the RAG pipeline
        pipeline = RAGPipeline()
        
        # Debug document processing and print results
        try:
            debug_result = pipeline.debug_document_processing()
            print(f"\nDebug result: {debug_result}\n")
        except AttributeError as e:
            print(f"Debug method not available: {str(e)}")
            print("Continuing without debug information...")
        except Exception as e:
            print(f"Error during debugging: {str(e)}")
            print("Continuing without debug information...")
        
        
        # Start query loop
        while True:
            query = input("Enter your query (or 'quit' to exit): ")
            if query.lower() in ['quit', 'exit', 'q']:
                break
            
            if not query.strip():
                print("Please enter a valid query.")
                continue
                
            # Generate response using the RAG pipeline
            try:
                response = pipeline.generate_response(query)
                print(f"\nResponse: {response}\n")
            except Exception as e:
                print(f"Error generating response: {str(e)}")
                traceback.print_exc()
            
    except Exception as e:
        print(f"Error in main: {str(e)}")
        traceback.print_exc()
    finally:
        # Cleanup if necessary
        if 'pipeline' in locals():
            try:
                pipeline.cleanup()
            except AttributeError:
                print("Cleanup method not available, skipping cleanup.")
            except Exception as e:
                print(f"Error during cleanup: {str(e)}")
        print("\nThank you for using the RAG Pipeline.")

if __name__ == "__main__":
    main()