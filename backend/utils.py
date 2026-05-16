import numpy as np
import pandas as pd
import requests
import joblib
import time
from datetime import timedelta

from tensorflow.keras.models import load_model

# =========================================================
# CONFIG
# =========================================================

MODEL_PATH = "lstm_ohlc_model.keras"
SCALER_PATH = "ohlc_scaler.gz"

SYMBOL = "FPT"

TIME_STEPS = 60

FEATURES = [
    'open',
    'high',
    'low',
    'close'
]

# =========================================================
# LOAD MODEL + SCALER
# =========================================================

model = load_model(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)

# =========================================================
# FETCH DATA TỪ VNDIRECT API
# =========================================================

def fetch_stock_data(symbol):
    #Lấy thời gian hiện tại
    current_time = int(time.time())
    _70days_ago = current_time - 120 * 24 * 60 * 60
    url = (
        f"https://dchart-api.vndirect.com.vn/dchart/history"
        f"?resolution=D&symbol={symbol}"
        f"&from={_70days_ago}&to={current_time}"
    )

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/136.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json,text/plain,*/*",
        "Referer": "https://dchart.vndirect.com.vn/",
        "Origin": "https://dchart.vndirect.com.vn"
    }

    response = requests.get(url, headers=headers)

    print("Status:", response.status_code)
    print("Response:", response.text[:200])

    if response.status_code != 200:
        raise Exception(f"HTTP Error: {response.status_code}")

    raw = response.json()

    if raw.get("s") != "ok":
        raise Exception("API response invalid")

    # =====================================================
    # CHUYỂN THÀNH DATAFRAME
    # =====================================================

    df = pd.DataFrame({
        "date": pd.to_datetime(raw["t"], unit="s"),
        "open": raw["o"],
        "high": raw["h"],
        "low": raw["l"],
        "close": raw["c"],
        "volume": raw["v"]
    })

    return df

# =========================================================
# PREDICT
# =========================================================

def predict_next_day(symbol="FPT"):

    # Load dữ liệu từ API
    df = fetch_stock_data(symbol)

    # Lấy 60 ngày gần nhất
    recent_data = df[FEATURES].tail(TIME_STEPS)

    if len(recent_data) < TIME_STEPS:
        raise Exception("Không đủ dữ liệu")

    # =====================================================
    # SCALE
    # =====================================================

    scaled_data = scaler.transform(recent_data)

    # Shape:
    # (1, 60, 4)

    X = np.expand_dims(scaled_data, axis=0)

    # =====================================================
    # PREDICT
    # =====================================================
    
    prediction_scaled = model.predict(X, verbose=0)

    # =====================================================
    # INVERSE SCALE
    # =====================================================

    prediction = scaler.inverse_transform(prediction_scaled)[0]

    open_price = float(prediction[0])
    high_price = float(prediction[1])
    low_price  = float(prediction[2])
    close_price = float(prediction[3])

    return {
        "symbol": symbol,

        "open": round(open_price, 2),
        "high": round(high_price, 2),
        "low": round(low_price, 2),
        "close": round(close_price, 2)
    }

# =========================================================
# PREDICT 5 NGÀY LIÊN TIẾP
# =========================================================

def get_next_trading_days(last_date, n_days=5):
    """
    Sinh danh sách ngày giao dịch tiếp theo (bỏ T7, CN)
    """
    dates = []
    current = pd.to_datetime(last_date)

    while len(dates) < n_days:
        current += timedelta(days=1)

        # 0 = Monday ... 6 = Sunday
        if current.weekday() < 5:
            dates.append(current.date())

    return dates

def predict_next_5_days(symbol="FPT"):
    df = fetch_stock_data(symbol)
    df["date"] = pd.to_datetime(df["date"], unit="s")
    df = df.set_index("date")

    history = df[FEATURES].copy()

    current_window = history.tail(TIME_STEPS).values.tolist()

    if len(current_window) < TIME_STEPS:
        raise Exception("Không đủ 60 ngày dữ liệu")

    predictions = []

    last_date = df.index[-1]
    future_dates = get_next_trading_days(last_date, 5)

    for step in range(5):

        scaled = scaler.transform(current_window)
        X = np.expand_dims(scaled, axis=0)

        pred_scaled = model.predict(X, verbose=0)
        # Giữ lại 4 cột dự đoán (OHLC)
        open_future = pred_scaled[0][0]
        high_future = pred_scaled[0][1]
        low_future = pred_scaled[0][2]
        close_future = pred_scaled[0][3]

        pred = scaler.inverse_transform(pred_scaled)[0]

        open_price = float(pred[0])
        high_price = float(pred[1])
        low_price  = float(pred[2])
        close_price = float(pred[3])

        predicted_candle = {
            "date": str(future_dates[step]),   # 👈 QUAN TRỌNG
            "symbol": symbol,

            "open": round(open_price, 2),
            "high": round(high_price, 2),
            "low": round(low_price, 2),
            "close": round(close_price, 2)
        }

        predictions.append(predicted_candle)

        current_window.pop(0)
        current_window.append([open_future, high_future, low_future, close_future])

    return predictions

# =========================================================
# MAIN
# =========================================================

if __name__ == "__main__":

    result = predict_next_day("FPT")

    print("\nDỰ ĐOÁN PHIÊN TIẾP THEO:\n")

    print(f"Mã CK : {result['symbol']}")
    print(f"Open  : {result['open']}")
    print(f"High  : {result['high']}")
    print(f"Low   : {result['low']}")
    print(f"Close : {result['close']}")

    result = predict_next_5_days("FPT")

    print("\nDỰ ĐOÁN 5 NGÀY:\n")

    # for day in result:

    #     print(f"""
    #     Ngày +{day['day']}

    #     Open  : {day['open']}
    #     High  : {day['high']}
    #     Low   : {day['low']}
    #     Close : {day['close']}
    #     """)