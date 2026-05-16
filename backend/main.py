from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import time
import pandas as pd
import joblib

from utils import fetch_stock_data, predict_next_5_days
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("BAZAAR_API_KEY")
scaler = joblib.load("ohlc_scaler.gz")

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://stock-chatbot-fpt.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====== OPENAI COMPATIBLE CLIENT (BAZAARLINK) ======
client = OpenAI(
    base_url="https://bazaarlink.ai/api/v1",
    api_key=API_KEY,
)

class ChatRequest(BaseModel):
    messages: list
    model: str = "openai/gpt-4o-mini"


# ====== DATA ======
def load_data():
    df = fetch_stock_data("FPT")
    weekday_map = {
        "Monday": "Thứ Hai",
        "Tuesday": "Thứ Ba",
        "Wednesday": "Thứ Tư",
        "Thursday": "Thứ Năm",
        "Friday": "Thứ Sáu",
        "Saturday": "Thứ Bảy",
        "Sunday": "Chủ Nhật"
    }

    data = []
    for _, row in df.iterrows():
        day = pd.to_datetime(row["date"])
        data.append({
            "date": f"{weekday_map[day.strftime('%A')]} {day.strftime('%Y-%m-%d')}",
            "open": round(row["open"], 2),
            "high": round(row["high"], 2),
            "low": round(row["low"], 2),
            "close": round(row["close"], 2)
        })
    return data


# ====== CHAT ======
def chat_with_api(messages, model="openai/gpt-4o-mini"):
    data = load_data()
    prediction = predict_next_5_days("FPT")

    today = int(time.time())

    system_prompt = {
        "role": "system",
        "content": (
            f"Bạn là trợ lý phân tích cổ phiếu FPT (Việt Nam).\n"
            f"Hôm nay là {time.strftime('%Y-%m-%d', time.localtime(today))} (UTC+7).\n\n"
            "=== HISTORICAL DATA ===\n"
            + "\n".join([
                f"- {d['date']} | O={d['open']} H={d['high']} L={d['low']} C={d['close']}"
                for d in data
            ])
            + "\n\n=== PREDICTIONS ===\n"
            + "\n".join([
                f"- {p['date']} | O={p['open']} H={p['high']} L={p['low']} C={p['close']}"
                for p in prediction
            ])
            + "Yêu cầu:\n"
            "- Trả lời ngắn gọn, rõ ràng, phân tích thông minh\n"
            "- Các câu hỏi liên quan đến lịch sử cổ phiếu FPT phải dựa trên dữ liệu đã cho và trả lời chính xác đúng thời gian và giá trị\n"
            "- Nhớ quy tắc: Cổ phiếu KHÔNG MỞ CỬA vào thứ Bảy, Chủ nhật và ngày lễ, nếu có câu hỏi về ngày đó thì trả lời là không có dữ liệu\n"
            "- Chỉ dựa trên dữ liệu được cung cấp\n"
            "- Không suy đoán ngoài dữ liệu\n"
        )
    }

    completion = client.chat.completions.create(
        model=model,
        messages=[system_prompt] + messages,
        stream=False
    )

    return completion.choices[0].message.content


# ====== API ======
@app.post("/chat")
def chat(req: ChatRequest):
    reply = chat_with_api(req.messages, req.model)
    return {"reply": reply}