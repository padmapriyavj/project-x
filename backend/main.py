from fastapi import FastAPI

app = FastAPI(title="Project X API")


@app.get("/health")
def health():
    return {"status": "ok"}
