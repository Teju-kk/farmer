from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Krishi Sahayak AI Service", version="0.1.0")

class AssistantRequest(BaseModel):
    question: str
    user_id: str

@app.get("/health")
def health():
    return {"success": True, "data": {"service": "krishi-sahayak-ai", "status": "ok"}}

@app.post("/assistant")
def assistant(request: AssistantRequest):
    return {"success": True, "data": {"answer": "AI integration is not configured yet. This endpoint is a safe Phase 1 placeholder.", "disclaimer": "AI guidance is general information, not a guaranteed diagnosis or official advice."}}

