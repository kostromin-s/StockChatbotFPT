import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt

from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input
from tensorflow.keras.callbacks import EarlyStopping

# =========================================================
# 1. ĐỌC DỮ LIỆU
# =========================================================

df1 = pd.read_csv('data1.csv')
df2 = pd.read_csv('data2.csv')

# Gộp dữ liệu
df = pd.concat([df1, df2], ignore_index=True)

# Chuyển date
df['date'] = pd.to_datetime(df['date'], format='%d/%m/%Y')

# Sort theo thời gian
df = df.sort_values('date').reset_index(drop=True)

# =========================================================
# 2. CHỌN FEATURES
# =========================================================

FEATURES = ['open', 'high', 'low', 'close']

data = df[FEATURES].values

# =========================================================
# 3. CHIA TRAIN / TEST TRƯỚC KHI SCALE
#    (TRÁNH DATA LEAKAGE)
# =========================================================

train_size_raw = int(len(data) * 0.8)

train_data_raw = data[:train_size_raw]
test_data_raw = data[train_size_raw:]

# Scale riêng đúng chuẩn time-series
scaler = MinMaxScaler(feature_range=(0, 1))

train_scaled = scaler.fit_transform(train_data_raw)
test_scaled = scaler.transform(test_data_raw)

# =========================================================
# 4. TẠO SLIDING WINDOW
# =========================================================

TIME_STEPS = 60

X_train = []
y_train = []

for i in range(TIME_STEPS, len(train_scaled)):

    # 60 ngày trước
    X_train.append(train_scaled[i - TIME_STEPS:i])

    # Predict OHLC ngày tiếp theo
    y_train.append(train_scaled[i])

X_train = np.array(X_train)
y_train = np.array(y_train)

# =========================================================
# TEST SET
# =========================================================

# Nối tail train để tạo sequence liên tục
final_test_input = np.concatenate([
    train_scaled[-TIME_STEPS:],
    test_scaled
])

X_test = []
y_test = []

for i in range(TIME_STEPS, len(final_test_input)):

    X_test.append(final_test_input[i - TIME_STEPS:i])

    y_test.append(final_test_input[i])

X_test = np.array(X_test)
y_test = np.array(y_test)

print("X_train shape:", X_train.shape)
print("y_train shape:", y_train.shape)

print("X_test shape:", X_test.shape)
print("y_test shape:", y_test.shape)

# =========================================================
# 5. XÂY DỰNG MODEL
# =========================================================

model = Sequential([

    Input(shape=(TIME_STEPS, len(FEATURES))),

    LSTM(64, return_sequences=True),
    Dropout(0.2),

    LSTM(64, return_sequences=False),
    Dropout(0.2),

    Dense(32, activation='relu'),

    # Output 4 giá trị:
    # open high low close
    Dense(len(FEATURES))
])

model.compile(
    optimizer='adam',
    loss='mean_squared_error'
)

model.summary()

# =========================================================
# 6. EARLY STOPPING
# =========================================================

early_stop = EarlyStopping(
    monitor='val_loss',
    patience=5,
    restore_best_weights=True
)

# =========================================================
# 7. TRAIN
# =========================================================

print("Bắt đầu huấn luyện...")

history = model.fit(
    X_train,
    y_train,
    epochs=50,
    batch_size=32,
    validation_data=(X_test, y_test),
    callbacks=[early_stop]
)

# =========================================================
# 8. SAVE MODEL + SCALER
# =========================================================

model.save('lstm_ohlc_model.keras')

joblib.dump(scaler, 'ohlc_scaler.gz')

print("Đã lưu model và scaler")

# =========================================================
# 9. PREDICT
# =========================================================

predictions = model.predict(X_test)

# Inverse scale
predictions_real = scaler.inverse_transform(predictions)
y_test_real = scaler.inverse_transform(y_test)

# =========================================================
# 10. ĐÁNH GIÁ
# =========================================================

mae = mean_absolute_error(y_test_real, predictions_real)
rmse = np.sqrt(mean_squared_error(y_test_real, predictions_real))

print(f"\nMAE: {mae:.4f}")
print(f"RMSE: {rmse:.4f}")

# =========================================================
# 11. IN KẾT QUẢ
# =========================================================

print("\n5 dự đoán đầu tiên:\n")

for i in range(5):

    actual = y_test_real[i]
    pred = predictions_real[i]

    print(f"""
Ngày {i+1}

THỰC TẾ:
Open : {actual[0]:.2f}
High : {actual[1]:.2f}
Low  : {actual[2]:.2f}
Close: {actual[3]:.2f}

DỰ ĐOÁN:
Open : {pred[0]:.2f}
High : {pred[1]:.2f}
Low  : {pred[2]:.2f}
Close: {pred[3]:.2f}
""")

# =========================================================
# 12. VẼ BIỂU ĐỒ CLOSE PRICE
# =========================================================

plt.figure(figsize=(14, 6))

plt.plot(
    y_test_real[:, 3],
    label='Actual Close'
)

plt.plot(
    predictions_real[:, 3],
    label='Predicted Close'
)

plt.title('Actual vs Predicted Close Price')

plt.xlabel('Time')
plt.ylabel('Price')

plt.legend()

plt.show()

# =========================================================
# 13. EXPORT CHO CANDLESTICK CHART
# =========================================================

candlestick_data = []

test_dates = df['date'].iloc[-len(predictions_real):].reset_index(drop=True)

for i in range(len(predictions_real)):

    pred = predictions_real[i]

    open_price = float(pred[0])
    high_price = float(max(pred[1], pred[0], pred[3]))
    low_price = float(min(pred[2], pred[0], pred[3]))
    close_price = float(pred[3])

    candlestick_data.append({
        "time": int(test_dates[i].timestamp()),
        "open": round(open_price, 2),
        "high": round(high_price, 2),
        "low": round(low_price, 2),
        "close": round(close_price, 2)
    })

# Xuất JSON
candlestick_df = pd.DataFrame(candlestick_data)

candlestick_df.to_json(
    'predicted_candlestick.json',
    orient='records'
)

print("\nĐã xuất predicted_candlestick.json")