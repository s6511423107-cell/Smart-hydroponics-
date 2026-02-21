# Smart-hydroponics-
# 🌱 Smart Hydroponics IoT Control System (V5.6)
**ระบบควบคุมฟาร์มไฮโดรโปนิกส์อัจฉริยะด้วย IoT (เวอร์ชัน 5.6)**

![Version](https://img.shields.io/badge/Version-5.6-blue.svg)
![Status](https://img.shields.io/badge/Status-Production_Ready-success.svg)
![Platform](https://img.shields.io/badge/Platform-ESP32-lightgrey.svg)
![Protocol](https://img.shields.io/badge/Protocol-MQTT-orange.svg)

*( 🇬🇧 English | 🇹🇭 Thai )*

---

## 📌 Project Overview / รายละเอียดโปรเจค

**[EN]** An end-to-end IoT solution for automated hydroponics farming. This system utilizes an ESP32 microcontroller to continuously monitor water quality (pH, EC, TDS), control water pumps/valves via relays, and alert users of any anomalies. Designed with **Safety and Reliability** in mind, the system includes Hardware Watchdog Timers (WDT), Emergency Stops, and Last Will and Testament (LWT) protocols to ensure uninterrupted operation.

**[TH]** โซลูชัน IoT แบบครบวงจรสำหรับฟาร์มไฮโดรโปนิกส์อัตโนมัติ ระบบนี้ใช้ไมโครคอนโทรลเลอร์ ESP32 ในการตรวจสอบคุณภาพน้ำ (pH, EC, TDS) อย่างต่อเนื่อง ควบคุมปั๊มน้ำ/วาล์วผ่านรีเลย์ และแจ้งเตือนผู้ใช้เมื่อพบความผิดปกติ ระบบถูกออกแบบโดยคำนึงถึง **ความปลอดภัยและความเสถียรเป็นหลัก** โดยมีฟังก์ชัน Watchdog Timer ป้องกันบอร์ดค้าง, ปุ่มหยุดฉุกเฉิน (Emergency Stop) และโปรโตคอล LWT เพื่อให้มั่นใจว่าระบบจะทำงานได้อย่างต่อเนื่องไม่มีสะดุด

---

## ✨ Key Features / ฟีเจอร์เด่น

* **📡 Real-time IoT Connectivity / การเชื่อมต่อเรียลไทม์:** * **[EN]** Communicates via MQTT protocol for low-latency control and monitoring. Supports both TCP (Hardware) and WebSockets (Web Dashboard).
  * **[TH]** สื่อสารผ่านโปรโตคอล MQTT เพื่อการควบคุมและตรวจสอบที่รวดเร็ว รองรับทั้ง TCP สำหรับฮาร์ดแวร์ และ WebSockets สำหรับหน้าเว็บ

* **🧪 Precision Sensor Calibration / การปรับจูนเซนเซอร์แม่นยำสูง:** * **[EN]** Custom voltage-to-value mapping equations for accurate pH and EC/TDS readings.
  * **[TH]** ใช้สมการคำนวณและแปลงค่าแรงดันไฟฟ้า (Voltage) ที่ปรับจูนเอง เพื่อให้อ่านค่า pH และ EC/TDS ได้อย่างแม่นยำที่สุด

* **🛡️ Robust Safety Mechanisms / ระบบความปลอดภัยขั้นสูง:**
  * **[EN]** Features Hardware Watchdog Timer (WDT) to prevent system hangs, a physical Emergency Stop button, and MQTT LWT (Last Will & Testament) to alert if the device goes offline.
  * **[TH]** มี Watchdog Timer ป้องกันระบบค้าง, ปุ่มกดหยุดฉุกเฉินแบบฮาร์ดแวร์ และระบบ LWT แจ้งเตือนเมื่ออุปกรณ์ขาดการเชื่อมต่ออินเทอร์เน็ต

* **📱 Multi-Platform Interface / รองรับการควบคุมหลายแพลตฟอร์ม:**
  * **[EN]** Custom-built Web Dashboard (Glassmorphism UI, Secure Login, Interactive SVG Gauges) and Local Display (OLED I2C Auto-scaling UI).
  * **[TH]** มี Web Dashboard ที่ออกแบบ UI เองทั้งหมด (มีระบบล็อคอิน, หน้าปัดเกจเข็มแบบ SVG) และหน้าจอ OLED แสดงผลสถานะแบบสดๆ ที่ตัวเครื่อง

* **💬 Telegram Bot Integration / เชื่อมต่อแอปพลิเคชัน Telegram:**
  * **[EN]** Automated daily heartbeat reports, post-cycle measurement summaries, and instant out-of-bounds parameter alerts.
  * **[TH]** บอทส่งรายงานสถานะระบบ (Heartbeat) ทุกวันตอนเช้า, สรุปค่าหลังการวัดเสร็จสิ้น และแจ้งเตือนทันทีเมื่อค่าปุ๋ยหรือน้ำผิดปกติ

---

## 🛠️ Tech Stack & Hardware / เทคโนโลยีและอุปกรณ์ที่ใช้

**Software & Frameworks:**
* C++ / Arduino framework (ESP32 Core)
* PubSubClient (MQTT Protocol)
* WiFiClientSecure (For Telegram API integration)
* Frontend: HTML5, CSS3, JavaScript (Paho MQTT WebSocket)

**Hardware:**
* **MCU:** ESP32 NodeMCU
* **Sensors:** Analog pH Sensor, TDS/EC Sensor Meter
* **Actuators:** 2-Channel Relay Module (for Water Pumps and Drain Valves)
* **Display:** 1.3" OLED (SH1106 / I2C)

---

## ⚙️ System State Machine Flow / ลำดับการทำงานของระบบ

**[EN]** The system operates on a highly controlled state machine to ensure accurate measurements:
1. `IDLE`: Waiting for a trigger (Hardware Button, Web UI, App, or 1-Hour Auto Timer).
2. `VALVE1_ON` (10s): Pumps water/nutrient solution into the mixing tank.
3. `REST1` (10s): Allows the water to settle for accurate reading.
4. `SENSING` (15s): Samples analog data, calculates averages, checks thresholds, and publishes payloads via MQTT.
5. `VALVE2_ON` (15s): Drains the water / completes the cycle.

**[TH]** ระบบทำงานเป็นรอบวัฏจักร (State Machine) ที่ชัดเจนเพื่อความแม่นยำในการวัดผล:
1. `IDLE`: รอรับคำสั่งเริ่มงาน (จากปุ่มกด, หน้าเว็บ, แอป หรือทำงานอัตโนมัติทุก 1 ชั่วโมง)
2. `VALVE1_ON` (10 วินาที): เปิดวาล์วตัวแรกเพื่อนำน้ำเข้าสู่กระบวนการ
3. `REST1` (10 วินาที): พักน้ำให้นิ่งเพื่อลดความคลาดเคลื่อนก่อนวัดค่า
4. `SENSING` (15 วินาที): เซนเซอร์อ่านค่า เฉลี่ยผลลัพธ์ ตรวจสอบความผิดปกติ และส่งข้อมูลขึ้น MQTT
5. `VALVE2_ON` (15 วินาที): เปิดวาล์วตัวที่สองเพื่อระบายน้ำออก จบรอบการทำงาน

---

## 🚀 How to Run the Web Dashboard / วิธีใช้งานหน้าเว็บควบคุม
**[EN]** 1. Download the `index.html` file.
2. Open it in any modern web browser.
3. Enter the secure password (`123456789`) to access real-time telemetry and control.

**[TH]**
1. ดาวน์โหลดไฟล์ `index.html`
2. ดับเบิ้ลคลิกเพื่อเปิดผ่าน Web Browser (Chrome, Safari, Edge ฯลฯ)
3. ใส่รหัสผ่านความปลอดภัย (`123456789`) เพื่อเข้าสู่ระบบและควบคุมฟาร์มแบบเรียลไทม์

---
*Developed as a showcase of IoT architecture, embedded systems programming (C++), API integration, and front-end web development.*
*(พัฒนาขึ้นเพื่อเป็นผลงานแสดงทักษะด้านสถาปัตยกรรม IoT, การเขียนโปรแกรมไมโครคอนโทรลเลอร์, การเชื่อมต่อ API และการสร้างเว็บไซต์ควบคุมส่วนหน้า)*
