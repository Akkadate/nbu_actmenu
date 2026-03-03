const manualHtml = String.raw`<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>LIFF Activity Flow</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
:root{--green:#06C755;--bg:#0a0f1e;--border:#2a3a55;--text:#e2e8f0;--muted:#64748b;--accent:#38bdf8;--gold:#f59e0b;--danger:#f43f5e;--success:#10b981;--purple:#a78bfa;}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:var(--bg);color:var(--text);font-family:'Noto Sans Thai',sans-serif;padding:36px 20px 60px;background-image:radial-gradient(circle at 15% 20%,rgba(6,199,85,.06) 0%,transparent 50%),radial-gradient(circle at 85% 80%,rgba(56,189,248,.06) 0%,transparent 50%);}
.hd{text-align:center;margin-bottom:40px;}
.badge{display:inline-block;background:rgba(6,199,85,.15);border:1px solid rgba(6,199,85,.3);color:var(--green);font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:2px;padding:4px 12px;border-radius:20px;margin-bottom:12px;}
h1{font-size:22px;font-weight:700;color:#fff;margin-bottom:4px;}
.sub{font-size:12px;color:var(--muted);font-family:'JetBrains Mono',monospace;}
.flow{max-width:960px;margin:0 auto;display:flex;flex-direction:column;align-items:center;}
.node{border-radius:10px;padding:10px 18px;font-size:13px;font-weight:500;text-align:center;border:1.5px solid;line-height:1.5;}
.ni{font-size:16px;display:block;margin-bottom:2px;}
.n-s{background:linear-gradient(135deg,#064e3b,#065f46);border-color:var(--green);color:#6ee7b7;font-family:'JetBrains Mono',monospace;box-shadow:0 0 20px rgba(6,199,85,.2);}
.n-d{background:linear-gradient(135deg,#1e1b4b,#312e81);border-color:var(--purple);color:#c4b5fd;}
.n-c{background:linear-gradient(135deg,#0c4a6e,#075985);border-color:var(--accent);color:#7dd3fc;}
.n-v{background:linear-gradient(135deg,#451a03,#78350f);border-color:var(--gold);color:#fcd34d;}
.n-ch{background:linear-gradient(135deg,#052e16,#14532d);border-color:var(--success);color:#6ee7b7;box-shadow:0 0 14px rgba(16,185,129,.15);}
.n-sm{background:linear-gradient(135deg,#1e1b4b,#2e1065);border-color:var(--purple);color:#c4b5fd;}
.n-f{background:linear-gradient(135deg,#4c0519,#881337);border-color:var(--danger);color:#fda4af;}
.arr{display:flex;flex-direction:column;align-items:center;}
.al{width:2px;height:20px;background:linear-gradient(to bottom,var(--border),var(--muted));}
.ah{width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid var(--muted);}
.row{display:flex;gap:12px;width:100%;align-items:flex-start;justify-content:center;}
.col{display:flex;flex-direction:column;align-items:center;flex:1;}
.sbox{border:1px solid var(--border);border-radius:12px;padding:14px 10px;background:rgba(255,255,255,.02);display:flex;flex-direction:column;align-items:center;width:100%;}
.stitle{font-size:10px;font-family:'JetBrains Mono',monospace;color:var(--muted);margin-bottom:8px;letter-spacing:1px;}
.lbl{font-size:10px;font-family:'JetBrains Mono',monospace;padding:3px 9px;border-radius:20px;margin-bottom:3px;white-space:nowrap;}
.ly{background:rgba(6,199,85,.1);border:1px solid rgba(6,199,85,.3);color:var(--green);}
.ln{background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.3);color:var(--danger);}
.li{background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.3);color:var(--accent);}
.lo{background:rgba(167,139,250,.1);border:1px solid rgba(167,139,250,.3);color:var(--purple);}
.lp{background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3);color:var(--success);}
.sp{width:70%;display:flex;height:24px;}
.spl{flex:1;border-right:1px solid var(--border);border-top:1px solid var(--border);}
.spr{flex:1;border-left:1px solid var(--border);border-top:1px solid var(--border);}
.sp2{width:80%;display:flex;height:20px;}
.legend{max-width:960px;margin:36px auto 0;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;}
.lgi{display:flex;align-items:center;gap:5px;font-size:10px;color:var(--muted);}
.lgd{width:10px;height:10px;border-radius:2px;border:1.5px solid;}
</style>
</head>
<body>
<div class="hd">
  <div class="badge">SYSTEM FLOW DIAGRAM</div>
  <h1>LIFF Activity Check-in Flow</h1>
  <div class="sub">/liff?activity=... · LINE LIFF + OA Integration</div>
</div>

<div class="flow">
  <div class="node n-s"><span class="ni">🔗</span>เข้า /liff?activity=...</div>
  <div class="arr"><div class="al"></div><div class="ah"></div></div>
  <div class="node n-d"><span class="ni">👥</span>เป็นเพื่อน OA แล้วหรือไม่?</div>

  <div class="sp"><div class="spl"></div><div class="spr"></div></div>

  <div class="row">
    <div class="col">
      <div class="sbox">
        <div class="stitle">CASE A</div>
        <div class="lbl ly">✅ เป็นเพื่อน OA แล้ว</div>
        <div class="arr"><div class="al"></div><div class="ah"></div></div>
        <div class="node n-d" style="font-size:12px;"><span class="ni">📱</span>อยู่ใน LINE App?</div>
        <div class="sp2"><div class="spl"></div><div class="spr"></div></div>
        <div class="row">
          <div class="col">
            <div class="lbl li">📱 ใน LINE App</div>
            <div class="arr"><div class="al"></div><div class="ah"></div></div>
            <div class="node n-c" style="font-size:12px;"><span class="ni">✅</span>ทำ Check-in</div>
            <div class="arr"><div class="al"></div><div class="ah"></div></div>
            <div class="node n-ch" style="font-size:11px;"><span class="ni">💬</span>เปิด Chat OA<br><small style="font-size:10px;opacity:.8">Rich Menu + Flex</small></div>
          </div>
          <div class="col">
            <div class="lbl lo">🌐 Browser ภายนอก</div>
            <div class="arr"><div class="al"></div><div class="ah"></div></div>
            <div class="node n-c" style="font-size:12px;"><span class="ni">✅</span>ทำ Check-in</div>
            <div class="arr"><div class="al"></div><div class="ah"></div></div>
            <div class="node n-sm" style="font-size:11px;"><span class="ni">📄</span>แสดงหน้า Summary</div>
            <div class="arr"><div class="al"></div><div class="ah"></div></div>
            <div class="node n-ch" style="font-size:11px;"><span class="ni">💬</span>กดปุ่มเข้า Chat OA</div>
          </div>
        </div>
      </div>
    </div>

    <div class="col">
      <div class="sbox">
        <div class="stitle">CASE B</div>
        <div class="lbl ln">❌ ยังไม่เป็นเพื่อน OA</div>
        <div class="arr"><div class="al"></div><div class="ah"></div></div>
        <div class="node n-v"><span class="ni">🔐</span>ยืนยันตัวตน (Verify)<br><small style="font-size:11px;opacity:.85;line-height:1.9;">รหัสนักศึกษา · วันเกิด<br>บัตรประชาชน / พาสปอร์ต</small></div>
        <div class="sp2"><div class="spl"></div><div class="spr"></div></div>
        <div class="row">
          <div class="col">
            <div class="lbl ln" style="font-size:10px;">✗ ไม่ผ่าน</div>
            <div class="arr"><div class="al"></div><div class="ah"></div></div>
            <div class="node n-f" style="font-size:11px;"><span class="ni">🚫</span>แสดงข้อผิดพลาด<br><small style="opacity:.7;font-size:10px;">ให้ลองใหม่</small></div>
          </div>
          <div class="col">
            <div class="lbl lp" style="font-size:10px;">✓ ผ่าน</div>
            <div class="arr"><div class="al"></div><div class="ah"></div></div>
            <div class="node n-d" style="font-size:11px;"><span class="ni">📱</span>อยู่ใน LINE App?</div>
            <div class="sp2"><div class="spl"></div><div class="spr"></div></div>
            <div class="row">
              <div class="col">
                <div class="lbl li" style="font-size:9px;">📱 ใน App</div>
                <div class="arr"><div class="al"></div><div class="ah"></div></div>
                <div class="node n-c" style="font-size:10px;"><span class="ni">✅</span>Check-in</div>
                <div class="arr"><div class="al"></div><div class="ah"></div></div>
                <div class="node n-ch" style="font-size:10px;"><span class="ni">💬</span>เข้า Chat OA</div>
              </div>
              <div class="col">
                <div class="lbl lo" style="font-size:9px;">🌐 Browser</div>
                <div class="arr"><div class="al"></div><div class="ah"></div></div>
                <div class="node n-c" style="font-size:10px;"><span class="ni">✅</span>Check-in</div>
                <div class="arr"><div class="al"></div><div class="ah"></div></div>
                <div class="node n-sm" style="font-size:10px;"><span class="ni">📄</span>Summary</div>
                <div class="arr"><div class="al"></div><div class="ah"></div></div>
                <div class="node n-ch" style="font-size:10px;"><span class="ni">💬</span>กดเข้า Chat OA</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="legend">
  <div class="lgi"><div class="lgd" style="background:rgba(6,199,85,.2);border-color:#06C755;"></div>Start</div>
  <div class="lgi"><div class="lgd" style="background:rgba(167,139,250,.2);border-color:#a78bfa;"></div>Decision</div>
  <div class="lgi"><div class="lgd" style="background:rgba(56,189,248,.2);border-color:#38bdf8;"></div>Check-in</div>
  <div class="lgi"><div class="lgd" style="background:rgba(245,158,11,.2);border-color:#f59e0b;"></div>Verify</div>
  <div class="lgi"><div class="lgd" style="background:rgba(16,185,129,.2);border-color:#10b981;"></div>Chat OA (จบ)</div>
  <div class="lgi"><div class="lgd" style="background:rgba(167,139,250,.2);border-color:#a78bfa;"></div>Summary Page</div>
  <div class="lgi"><div class="lgd" style="background:rgba(244,63,94,.2);border-color:#f43f5e;"></div>Error</div>
</div>
<div style="text-align:center;margin-top:20px;font-size:10px;color:var(--muted);font-family:'JetBrains Mono',monospace;">LIFF Activity Flow · NBU Information Technology Office</div>
</body>
</html>`;

export default function AdminManualPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h1 className="text-2xl font-semibold">คู่มือการใช้งานระบบ NBU ActMenu</h1>
          <p className="mt-2 text-sm text-slate-600">
            เอกสารนี้อธิบายวิธีใช้งานระบบสำหรับผู้ดูแลระบบและผู้ใช้งานปลายทาง โดย flow diagram
            ด้านล่างใช้เป็นภาพอ้างอิงลำดับการทำงาน
          </p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">1) งานของผู้ดูแลระบบ (Admin)</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>เข้าเมนู `Activities` ที่หน้า `/admin`</li>
            <li>กด `Create New` เพื่อสร้างกิจกรรมใหม่</li>
            <li>กรอก `activity_key`, `activity_name`, `richmenu_id`, `flex_payload`</li>
            <li>กำหนดช่วงเวลา `start_date` / `end_date` (ถ้ามี)</li>
            <li>บันทึกแล้วทดสอบผ่านลิงก์ `.../liff?activity=activity_key`</li>
            <li>หากต้องการแก้ไข ให้กด `Edit` และอัปเดตข้อมูลได้ทันที</li>
          </ol>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">2) งานของนักศึกษา (User)</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>สแกน QR หรือลิงก์ไปหน้า `/liff?activity=...`</li>
            <li>ระบบ LIFF จะพาเข้าสู่ LINE login อัตโนมัติ</li>
            <li>ถ้ายังไม่ยืนยันตัวตน ให้กรอก รหัสนักศึกษา / วันเกิด / บัตรหรือพาสปอร์ต</li>
            <li>เมื่อผ่านแล้ว ระบบจะทำ check-in และส่ง rich menu + flex message ตามกิจกรรม</li>
            <li>กรณีเปิดจาก browser ภายนอก จะเห็นหน้า summary และปุ่มเข้า LINE OA chat</li>
          </ol>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">3) การตรวจสอบข้อมูล</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>สถานะผูก LINE กับนักศึกษา: ตาราง `line_student_links`</li>
            <li>ประวัติการเช็กอินกิจกรรม: ตาราง `activity_checkins`</li>
            <li>ข้อมูลกิจกรรม: ตาราง `activities`</li>
          </ul>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">4) Checklist ก่อนใช้งานจริง</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>ตั้งค่า `.env` ครบ (`DATABASE_URL`, `LINE_CHANNEL_ACCESS_TOKEN`, `NEXT_PUBLIC_LIFF_ID`)</li>
            <li>รัน migration ครบทุกไฟล์ใน `db/migrations`</li>
            <li>ทดสอบทั้งกรณีผู้ใช้ที่เป็นเพื่อน OA แล้ว และยังไม่เป็นเพื่อน</li>
            <li>ยืนยันว่า rich menu และ flex message แสดงใน OA chat ถูกต้อง</li>
          </ul>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">5) หมายเหตุ Deploy (Production)</h2>
          <pre className="mt-3 overflow-x-auto rounded-md bg-slate-900 p-4 text-xs text-slate-100">
{`git pull
npm ci
npm run build
pm2 reload ecosystem.config.js --only nbu-actmenu`}
          </pre>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Appendix: LIFF Activity Flow Diagram</h2>
          <p className="mt-1 text-sm text-slate-600">แผนภาพลำดับการทำงานของระบบ</p>
        </section>

        <iframe
          title="LIFF Activity Flow Manual"
          srcDoc={manualHtml}
          className="h-[1900px] w-full rounded-lg border border-slate-200 bg-white"
        />
      </div>
    </main>
  );
}
