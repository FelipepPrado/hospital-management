from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # origens do frontend
    allow_credentials=True,                  # coockies / Authorization
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
def healthy(req: Request, res: Response):    
    res.status_code = status.HTTP_200_OK
    return {"message": "ok"}
