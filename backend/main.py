from fastapi import FastAPI
import psycopg2
import os
from dotenv import load_dotenv
from supabase import create_client, Client

app = FastAPI(title="Project X API")

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
app = FastAPI()
from postgrest.exceptions import APIError

@app.get("/items")
def read_items():
    try:
        # Fetching data from 'shop_items'
        response = supabase.table("shop_items").select("*", count="exact").execute()
        print(response.count)
        print('response', response)
        return response.data
    except APIError as e:
        # Returns the Supabase error message (e.g., table not found)
        return {"error": e.message, "details": e.details}
    except Exception as e:
        return {"error": "An unexpected error occurred", "details": str(e)}
