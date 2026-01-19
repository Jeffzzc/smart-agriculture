# 智慧农业精准灌溉 LPWAN（LoRaWAN）网络模拟系统

本项目实现一个可在单机或局域网部署的“监测-决策-控制”闭环模拟系统：

- **数据模拟层（Python）**：50 个土壤温湿度传感器按 **30 分钟**节拍上报；10 个智能电磁阀响应下发指令并回传状态；模拟低功耗（太阳能供电）电池模型。
- **后端服务层（Node.js）**：内置 MQTT Broker（无需额外安装 Mosquitto），解析处理数据；本地文件夹存储设备元数据与灌溉策略；基于阈值的自动灌溉逻辑；WebSocket 实时推送；REST API 控制与查询。
- **前端展示层（Vue + ECharts）**：实时仪表盘、温湿度曲线、设备分布“农田平面图”、灌溉控制面板、历史数据查询。

## 目录结构

- `backend/` 后端服务（HTTP + WebSocket + 内置 MQTT Broker）
- `simulator/` Python LoRaWAN 终端/阀门模拟器
- `frontend/` 可视化界面（Vue3 + ECharts）

## 环境准备（Windows）

### 1) 安装并确认 Node.js（建议 LTS）

```bash
node -v
npm -v
```

### 2) 安装并确认 Python（建议 3.10+）

```bash
python --version
pip --version
```

## 一键启动（Windows）

在项目根目录运行：

```bash
.\start_system.bat
```

该脚本会分别启动：

- 后端（HTTP:3000, MQTT:1883）
- 模拟器（MQTT 上报/接收指令）
- 前端（Vite:5173）

## 手动启动（单机）

### 1) 启动后端（HTTP:3000, MQTT:1883）

```bash
cd backend
npm i
npm run dev
```

### 2) 启动模拟器（默认严格 30 分钟节拍）

```bash
cd simulator
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python run_simulators.py --mqtt-host 127.0.0.1 --mqtt-port 1883
```

开发联调可加速节拍（不改变业务逻辑，仅缩短等待）：

```bash
.\.venv\Scripts\python run_simulators.py --mqtt-host 127.0.0.1 --mqtt-port 1883 --time-scale 60
```

### 3) 启动前端（Vite:5173）

```bash
cd frontend
npm i
npm run dev
```

浏览器打开 `http://localhost:5173/`。

## 局域网部署要点

- 后端默认监听 `0.0.0.0`（HTTP/WS/MQTT），同一局域网内设备可通过主机 IP 访问。
- 前端通过环境变量 `VITE_API_BASE` 指向后端，例如：`http://192.168.1.10:3000`。

## 话题（MQTT Topics）

- 传感器上报：`farm/sensors/{sensorId}/uplink`
- 阀门下发：`farm/valves/{valveId}/downlink`
- 阀门回传：`farm/valves/{valveId}/status`
