import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
import matplotlib.pyplot as plt

# ---------------------------------------------------------
# 1. ĐỌC VÀ TIỀN XỬ LÝ DỮ LIỆU
# ---------------------------------------------------------
# Đọc 2 file dữ liệu
df1 = pd.read_csv('data1.csv')
df2 = pd.read_csv('data2.csv')

# Gộp dữ liệu
df = pd.concat([df1, df2], ignore_index=True)

# Chuyển cột date sang định dạng datetime (Lưu ý: định dạng ngày/tháng/năm)
df['date'] = pd.to_datetime(df['date'], format='%d/%m/%Y')

# Sắp xếp dữ liệu tăng dần theo thời gian (rất quan trọng cho Time-Series)
df = df.sort_values('date').reset_index(drop=True)

# Ở đây ta sẽ chọn các cột open high low close để huấn luyện
data = df.filter(['open', 'high', 'low', 'close']).values

# Chuẩn hóa dữ liệu về khoảng [0, 1] để LSTM học tốt hơn
scaler = MinMaxScaler(feature_range=(0, 1))
scaled_data = scaler.fit_transform(data)

# ---------------------------------------------------------
# 2. CHUẨN BỊ TẬP DỮ LIỆU ĐẦU VÀO / ĐẦU RA (Sliding Window)
# ---------------------------------------------------------
time_steps = 60 # Dùng 60 ngày để dự đoán ngày tiếp theo

X = []
y = []

# Tạo chuỗi dữ liệu
for i in range(time_steps, len(scaled_data)):
    X.append(scaled_data[i-time_steps:i, 0]) # Lấy 60 ngày trước
    y.append(scaled_data[i, 0])              # Lấy ngày hiện tại làm nhãn (target)

X, y = np.array(X), np.array(y)

# ĐỊNH HÌNH LẠI ĐẦU VÀO cho LSTM thành [samples, time_steps, features]
# Hiện tại X đang là [samples, time_steps], cần thêm features = 1
X = np.reshape(X, (X.shape[0], X.shape[1], 1))

print(f"Kích thước X (Đầu vào): {X.shape}") 
print(f"Kích thước y (Đầu ra target): {y.shape}")

# Chia tập Train (80%) và Test (20%)
train_size = int(len(X) * 0.8)
X_train, X_test = X[:train_size], X[train_size:]
y_train, y_test = y[:train_size], y[train_size:]

# ---------------------------------------------------------
# 3. XÂY DỰNG MÔ HÌNH LSTM
# ---------------------------------------------------------
model = Sequential()

# Lớp LSTM thứ 1
model.add(LSTM(units=50, return_sequences=True, input_shape=(X_train.shape[1], 1)))
model.add(Dropout(0.2)) # Chống Overfitting

# Lớp LSTM thứ 2
model.add(LSTM(units=50, return_sequences=False))
model.add(Dropout(0.2))

# Lớp Dense (Đầu ra dự đoán 1 giá trị)
model.add(Dense(units=25))
model.add(Dense(units=1))

# Biên dịch mô hình
model.compile(optimizer='adam', loss='mean_squared_error')

# ---------------------------------------------------------
# 4. HUẤN LUYỆN (TRAINING)
# ---------------------------------------------------------
print("Bắt đầu quá trình huấn luyện...")
history = model.fit(X_train, y_train, batch_size=32, epochs=20, validation_data=(X_test, y_test))

model.save('lstm_stock_model.keras') # Hoặc có thể lưu đuôi .h5 (lstm_stock_model.h5)
print("Đã lưu mô hình LSTM thành file 'lstm_stock_model.keras'")

# Lưu bộ chuẩn hóa Scaler
joblib.dump(scaler, 'stock_scaler.gz')
print("Đã lưu Scaler thành file 'stock_scaler.gz'")
# ---------------------------------------------------------
# 5. DỰ ĐOÁN VÀ KHÔI PHỤC GIÁ TRỊ THỰC
# ---------------------------------------------------------
# Dự đoán trên tập test
predictions = model.predict(X_test)

# Đảo ngược chuẩn hóa (Inverse transform) để đưa về giá trị tiền VNĐ thực tế
predictions_real = scaler.inverse_transform(predictions)
y_test_real = scaler.inverse_transform(y_test.reshape(-1, 1))

# In thử 5 dự đoán đầu tiên so với thực tế
print("Dự đoán 5 ngày đầu tiên trong tập Test:")
for i in range(5):
    print(f"Thực tế: {y_test_real[i][0]:.2f} | Dự đoán: {predictions_real[i][0]:.2f}")
    