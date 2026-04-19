import os

from dotenv import load_dotenv
from fastapi import FastAPI
from postgrest.exceptions import APIError
from supabase import Client, create_client
from intelligence.betcha.router import router as betcha_router

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="Project X API")
app.include_router(betcha_router)


@app.get("/items")
def read_items():
    try:
        response = supabase.table("shop_items").select("*", count="exact").execute()
        print(response.count)
        print("response", response)
        return response.data
    except APIError as e:
        return {"error": e.message, "details": e.details}
    except Exception as e:
        return {"error": "An unexpected error occurred", "details": str(e)}
