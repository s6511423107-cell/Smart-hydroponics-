let currentData = { ph: 0, ec_mS: 0, tds_ppm: 0 };
    let client;
    let isLoggedIn = false; // ติดตามว่าล็อคอินด้วยรหัสหรือแค่ visitor
    
    // ตัวแปรเก็บข้อความสถานะจาก ESP32 และจำนวนวินาทีสำหรับแทน
    let statusMessageTemplate = ""; // ข้อความเดิมจาก ESP32
    let countdownInterval = null;
    let countdownSeconds = 0;
    
    // ตัวแปรเก็บค่าเซนเซอร์เริ่มต้นสำหรับการคำนวณในลูปนับถอยหลัง
    let sensorDataStart = { ph: 0, ec_mS: 0, tds_ppm: 0 };
    let countdownDuration = 0;

    // ==========================================
    // ส่วนที่ 1: ระบบ Login & Logout
    // ==========================================
    function checkLogin() {
        const pass = document.getElementById('password-input').value;
        const err = document.getElementById('login-error');
        
        // 🔑 เปลี่ยนรหัสผ่านตรงนี้ครับ (แก้ตัวเลข 123 เป็นอย่างอื่น)
        if (pass === '123') { 
            // ล็อคอินสำเร็จ -> ซ่อนหน้าล็อคอิน และโชว์หน้าแดชบอร์ด
            isLoggedIn = true;
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('main-dashboard').style.display = 'flex';
            
            // ปลดล็อคปุ่ม START
            const btn = document.querySelector('.btn-start');
            if(btn) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.title = '';
            }
            
            err.innerText = ""; 
            initMQTT(); // เริ่มต่อเน็ตดึงข้อมูล
        } else {
            err.innerText = "Incorrect Password"; // ถ้ารหัสผิดให้แจ้งเตือน
        }
    }

    // กด Enter ในช่องรหัสผ่านเพื่อล็อคอิน
    document.getElementById("password-input").addEventListener("keypress", function(event) {
        if (event.key === "Enter") { event.preventDefault(); checkLogin(); }
    });

    // ปุ่มกดออกจากระบบ
    function logout() {
        // ซ่อนแดชบอร์ด กลับไปโชว์หน้าล็อคอิน
        isLoggedIn = false;
        document.getElementById('main-dashboard').style.display = 'none';
        document.getElementById('login-screen').style.display = 'flex';
        
        document.getElementById('password-input').value = ""; // ล้างช่องใส่รหัส
        
        // หยุดลูปนับถอยหลังถ้ามีอยู่
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        
        if(client && client.isConnected()) client.disconnect(); // ตัดการเชื่อมต่อเน็ต
    }

    // ฟังก์ชันสำหรับเข้าแบบ Visitor (ล็อคปุ่ม START)
    function visitAsGuest() {
        isLoggedIn = false;
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-dashboard').style.display = 'flex';
        
        const btn = document.querySelector('.btn-start');
        if(btn) {
            btn.disabled = true; // ล็อคปุ่ม START
            btn.style.opacity = '0.5'; // ทำให้ปุ่มสีจาง
            btn.style.cursor = 'not-allowed'; // เปลี่ยนเมาส์เป็นสัญลักษณ์ห้าม
            btn.title = 'เฉพาะ Admin เท่านั้น'; // แสดงข้อความเมื่อ hover
        }
        
        initMQTT(); // เริ่มต่อเน็ตดึงข้อมูล
    }

    // ==========================================
    // ส่วนที่ 2: ระบบเชื่อมต่อ MQTT (ส่ง-รับ ข้อมูล)
    // ==========================================
    function initMQTT() {
        document.getElementById("mqtt-status").innerText = "CONNECTING...";
        document.getElementById("mqtt-status").style.color = "#ffea00";

        // 🚨 ตั้งค่าเซิร์ฟเวอร์ EMQX และพอร์ต WSS 8084 สำหรับ GitHub Pages
        const mqttHost = "broker.emqx.io";
        const mqttPort = 8084; 
        const mqttPath = "/mqtt";
        const clientID = "hydro_web_" + parseInt(Math.random() * 100000);

        client = new Paho.MQTT.Client(mqttHost, mqttPort, mqttPath, clientID);
        
        client.onConnectionLost = onConnectionLost;
        client.onMessageArrived = onMessageArrived;
        
        // 🚨 บังคับใช้ useSSL: true เพื่อความปลอดภัยบนหน้าเว็บ
        client.connect({
            onSuccess: onConnect, 
            useSSL: true,
            reconnect: true,
            cleanSession: true
        });
    }

    function onConnect() {
        document.getElementById("mqtt-status").innerText = "ONLINE";
        document.getElementById("mqtt-status").style.color = "#00e676";
        // กดติดตาม Topic ที่ ESP32 ส่งมา
        client.subscribe("hydro/water/state");
        client.subscribe("hydro/water/status");
    }

    function onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
            document.getElementById("mqtt-status").innerText = "CONNECTION LOST";
            document.getElementById("mqtt-status").style.color = "#ff3d00";
        }
    }

    // เมื่อมีข้อมูลส่งมาจาก ESP32
    function onMessageArrived(message) {
        // อัปเดตข้อความ "SYSTEM STATUS" (Valve1 ON, SENSING ฯลฯ)
        if (message.destinationName === "hydro/water/status") {
            const statusMsg = message.payloadString;
            statusMessageTemplate = statusMsg;
            
            // จดจำตัวเลขวินาทีจากตำแหน่งไหนก็ได้ในข้อความ (เช่น "15s" จาก "SENSING 15s (ตัว MQTT...)")
            const match = statusMsg.match(/(\d+)s/);
            if (match) {
                const secondsFromESP = parseInt(match[1]);
                countdownSeconds = secondsFromESP;
                countdownDuration = secondsFromESP;
                
                // เก็บค่าเซนเซอร์เริ่มต้นไว้ (ค่าปัจจุบัน)
                sensorDataStart = { ...currentData };
                
                // หยุดลูปเดิมถ้ามี
                if (countdownInterval) {
                    clearInterval(countdownInterval);
                }
                
                // เริ่มลูปนับถอยหลังเว็บ
                startWebCountdown(secondsFromESP);
            } else {
                // ถ้าข้อความไม่มีตัวเลข ให้แสดงเฉยๆ
                document.getElementById("system-status").innerText = statusMsg;
            }
        }

        // อัปเดตตัวเลขเซนเซอร์
        if (message.destinationName === "hydro/water/state") {
            try {
                const data = JSON.parse(message.payloadString);
                currentData = data;

                // เปลี่ยนตัวเลขบนหน้าจอ
                document.getElementById("val-ph").innerText = data.ph;
                document.getElementById("val-ec").innerText = data.ec_mS;
                document.getElementById("val-tds").innerText = data.tds_ppm;

                // ขยับเข็มเกจ (ชื่อเข็ม, ค่าที่ได้, ค่าต่ำสุดของหน้าปัด, ค่าสูงสุดของหน้าปัด)
                updateNeedle("needle-ph", data.ph, 4, 8);
                updateNeedle("needle-ec", data.ec_mS, 0, 3);
                updateNeedle("needle-tds", data.tds_ppm, 0, 2000);
            } catch (e) {}
        }
    }
    
    // ฟังก์ชันสำหรับนับถอยหลังในเว็บ (ลด 1 ทีละวินาที)
    function startWebCountdown(startSeconds) {
        countdownSeconds = startSeconds;
        countdownDuration = startSeconds;
        updateStatusAndSensors();
        
        countdownInterval = setInterval(() => {
            countdownSeconds -= 1;
            updateStatusAndSensors();
            
            if (countdownSeconds <= 0) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
        }, 1000);
    }
    
    // อัปเดตข้อความสถานะและค่าเซนเซอร์ (ลดลงตามเวลาที่เหลือ)
    function updateStatusAndSensors() {
        // อัปเดตข้อความสถานะ - แทนตัวเลขแรกด้วย countdownSeconds
        if (statusMessageTemplate) {
            const updatedMsg = statusMessageTemplate.replace(/\d+s/, countdownSeconds + "s");
            document.getElementById("system-status").innerText = updatedMsg;
        }
        
        // คำนวณค่าเซนเซอร์ลดลงตามสัดส่วนของเวลาที่เหลือ
        // (ค่า = ค่าเริ่มต้น * (เวลาเหลือ / เวลาทั้งหมด))
        if (countdownDuration > 0) {
            const ratio = countdownSeconds / countdownDuration;
            const newPH = (sensorDataStart.ph * ratio).toFixed(2);
            const newEC = (sensorDataStart.ec_mS * ratio).toFixed(3);
            const newTDS = Math.round(sensorDataStart.tds_ppm * ratio);
            
            // อัปเดตค่าบนจอ
            document.getElementById("val-ph").innerText = newPH;
            document.getElementById("val-ec").innerText = newEC;
            document.getElementById("val-tds").innerText = newTDS;
            
            // ขยับเข็มเกจ
            updateNeedle("needle-ph", parseFloat(newPH), 4, 8);
            updateNeedle("needle-ec", parseFloat(newEC), 0, 3);
            updateNeedle("needle-tds", parseFloat(newTDS), 0, 2000);
        }
    }

    // ฟังก์ชันสั่งงานระบบ (ส่งคำสั่ง 'on')
    function startSystem() {
        if(!isLoggedIn) {
            alert("Only authorized users can start the system. Please login with password.");
            return;
        }
        if(!client || !client.isConnected()) return alert("System Offline.");
        const message = new Paho.MQTT.Message("on");
        message.destinationName = "esp32/relay2";
        client.send(message);
        
        // ทำให้ปุ่มกระพริบเปลี่ยนเป็นคำว่า SENT!
        const btn = document.querySelector('.btn-start');
        btn.innerText = "SENT!";
        setTimeout(() => { btn.innerText = "START"; }, 1500);
    }

    // ==========================================
    // ส่วนที่ 3: ระบบแสดงผลเกจวัด และ Pop-up
    // ==========================================
    function updateNeedle(id, value, min, max) {
        let clampVal = Math.max(min, Math.min(max, value));
        let angle = ((clampVal - min) / (max - min)) * 180 - 90;
        document.getElementById(id).style.transform = `rotate(${angle}deg)`;
    }

    function openModal(sensorType) {
        const modal = document.getElementById('modal-overlay');
        const mTitle = document.getElementById('modal-title');
        const mVal = document.getElementById('modal-val');
        const mUnit = document.getElementById('modal-unit');
        const mStatus = document.getElementById('modal-status');
        const mDesc = document.getElementById('modal-desc');

        let val = 0; let min = 0; let max = 0;
        
        // 📊 เปลี่ยนเกณฑ์ตัดสิน (Min / Max) สำหรับ Pop-up แจ้งเตือนตรงนี้ครับ
        if(sensorType === 'pH') {
            mTitle.innerText = 'pH SENSOR DETAIL';
            val = parseFloat(currentData.ph); mVal.innerText = val.toFixed(2); mUnit.innerText = 'pH';
            min = 5.5; max = 6.5; 
        } 
        else if(sensorType === 'EC') {
            mTitle.innerText = 'EC SENSOR DETAIL';
            val = parseFloat(currentData.ec_mS); mVal.innerText = val.toFixed(3); mUnit.innerText = 'mS/cm';
            min = 1.2; max = 2.0;
        }
        else if(sensorType === 'TDS') {
            mTitle.innerText = 'TDS SENSOR DETAIL';
            val = parseFloat(currentData.tds_ppm); mVal.innerText = val.toFixed(0); mUnit.innerText = 'ppm';
            min = 800; max = 1200;
        }

        mDesc.innerText = `Standard Range: ${min} - ${max}`;

        if (val < min) {
            mStatus.innerText = "⚠️ TOO LOW";
            mStatus.style.background = "rgba(0, 176, 255, 0.2)"; mStatus.style.color = "#00b0ff";
        } else if (val > max) {
            mStatus.innerText = "🔥 TOO HIGH";
            mStatus.style.background = "rgba(255, 61, 0, 0.2)"; mStatus.style.color = "#ff3d00";
        } else {
            mStatus.innerText = "✅ NORMAL";
            mStatus.style.background = "rgba(0, 230, 118, 0.2)"; mStatus.style.color = "#00e676";
        }
        modal.classList.add('active'); // โชว์ Pop-up
    }

    function closeModal() { document.getElementById('modal-overlay').classList.remove('active'); }
