# 1. MAE là gì?

## MAE = Mean Absolute Error

Công thức:

```txt id="qcb87t"
|prediction - actual|
```

rồi lấy trung bình.

---

Ví dụ:

| Thực tế | Predict | Sai số |
| ------- | ------- | ------ |
| 100     | 102     | 2      |
| 95      | 93      | 2      |
| 80      | 85      | 5      |

MAE:

```txt id="4v4h9x"
(2 + 2 + 5) / 3 = 3
```

---

# MAE

```txt id="b7s1e4"
MAE = 2.7857
```

nghĩa là:

> trung bình model lệch khoảng 2.8 đơn vị giá.

Nếu cổ phiếu quanh:

```txt id="z5zhsv"
80 → 150
```

thì sai số này không tệ.

---

# 2. RMSE là gì?

## RMSE = Root Mean Squared Error

Công thức:

```txt id="7vkxv4"
sqrt((prediction - actual)^2)
```

---

RMSE:

* phạt mạnh lỗi lớn
* nhạy với spike

---

# RMSE

```txt id="zzn0lh"
3.7378
```

nghĩa là:

* có một số điểm model miss khá mạnh
* thường là vùng spike/volatility.

Điều này khớp với chart bạn gửi.

---

# So sánh MAE vs RMSE

Bạn có:

| Metric | Value |
| ------ | ----- |
| MAE    | 2.79  |
| RMSE   | 3.74  |

RMSE cao hơn đáng kể ⇒

> model đôi lúc sai mạnh ở các vùng biến động lớn.

Đúng với biểu đồ:

* spike không bắt tốt
* turning point hơi lag.

---

# Có ổn không?

## Với stock forecasting:

| MAE% | Đánh giá |
| ---- | -------- |
| <1%  | rất mạnh |
| 1–3% | tốt      |
| 3–5% | khá      |
| >5%  | yếu      |

---

# Ước lượng model

Giá trung bình chart khoảng:

```txt id="sjncdo"
~100
```

MAE:

```txt id="r9q17j"
2.8 / 100 = ~2.8%
```

=> khoảng:

# khá tốt cho baseline LSTM.

---

# Thực tế hơn chút

Trong stock prediction:

* đạt MAE ~2–3%
* đã không dễ rồi.

Đặc biệt:

* chỉ dùng historical OHLC
* không có tin tức
* không có market sentiment
* không có macroeconomics.

---

# Hướng dẫn chạy dự án:
* **Bước 1:** mở `cmd` chạy ollama `qwen2.5:3b`
```bash
ollama run qwen2.5:3b
```
* **Bước 2:** chạy backend
```bash
uvicorn main:app --reload
```
* **Bước 3:** chạy frontend
```bash
npm run dev
```