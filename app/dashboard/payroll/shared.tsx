"use client";

import { useState } from "react";

// ─── PAYROLL COMPUTATION LOGIC ────────────────────────────────────────────────
export function computePayroll(employee: any, attendanceMonth: any, leaveBalance: any) {
  const { year, month, days } = attendanceMonth;
  // Only count workdays — exclude weekends and future dates from payroll
  const workdays = days.filter((d: any) => d.status !== "WEEKEND" && d.status !== "FUTURE");
  const totalWorkdays = workdays.length;

  let present = 0, absent = 0, cl = 0, sl = 0, el = 0, exception = 0;
  workdays.forEach((d: any) => {
    if (d.status === "PRESENT") present++;
    else if (d.status === "LATE") present++;     // Late = present for payroll
    else if (d.status === "HALF_DAY") present++;  // Half day = present for payroll
    else if (d.status === "EXCEPTION") exception++; // Exception = present for payroll
    else if (d.status === "ABSENT") absent++;
    else if (d.status === "CL") cl++;
    else if (d.status === "SL") sl++;
    else if (d.status === "EL") el++;
  });

  const approvedCL = Math.min(cl, leaveBalance.CL || 0);
  const approvedSL = Math.min(sl, leaveBalance.SL || 0);
  const approvedEL = Math.min(el, leaveBalance.EL || 0);
  
  // Calculate LOP (Loss of Pay) for absences or unapproved leaves
  const lop = absent + (cl - approvedCL) + (sl - approvedSL) + (el - approvedEL);
  const paidDays = totalWorkdays - lop;
  
  // Salary breakdown
  const perDaySalary = (employee.grossSalary || 0) / (totalWorkdays || 30);
  const lopDeduction = Math.round(lop * perDaySalary);

  const basic   = Math.round((employee.grossSalary || 0) * 0.40);
  const hra     = Math.round((employee.grossSalary || 0) * 0.20);
  const ta      = Math.round((employee.grossSalary || 0) * 0.10);
  const special = (employee.grossSalary || 0) - basic - hra - ta;
  const pf      = Math.round(basic * 0.12);
  const netPay  = Math.max(0, Math.round((employee.grossSalary || 0) - lopDeduction - pf));

  return {
    year, month, totalWorkdays, present: present + exception, cl, sl, el,
    approvedCL, approvedSL, approvedEL, absent, lop, paidDays, exception,
    grossSalary: employee.grossSalary,
    basic, hra, ta, special, lopDeduction, pf, netPay,
    perDaySalary: Math.round(perDaySalary),
  };
}

export const MONTH_NAMES = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];

export const fmt = (n: number | string) => "₹" + Number(n).toLocaleString("en-IN");

const COLOR_MAP: Record<string, string[]> = {
  PRESENT:   ["#22c55e","#f0fdf4"],
  ABSENT:    ["#ef4444","#fef2f2"],
  LATE:      ["#f97316","#fff7ed"],
  HALF_DAY:  ["#f59e0b","#fffbeb"],
  CL:        ["#3b82f6","#eff6ff"],
  SL:        ["#f59e0b","#fffbeb"],
  EL:        ["#8b5cf6","#f5f3ff"],
  EXCEPTION: ["#f97316","#fff7ed"],
  PENDING:   ["#eab308","#fefce8"],
  WEEKEND:   ["#cbd5e1","#f8fafc"],
  FUTURE:    ["#94a3b8","#f8fafc"],
};

// ─── SALARY SLIP MODAL ────────────────────────────────────────────────────────
export function SalarySlipModal({ slip, employee, onClose }: { slip: any, employee: any, onClose: () => void }) {
  const monthLabel = `${MONTH_NAMES[slip.month]} ${slip.year}`;

  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Salary Slip - ${employee.id}</title><style>
      body{font-family:Georgia,serif;max-width:680px;margin:40px auto;color:#1e293b}
      h1{margin:0;font-size:24px}h2{font-size:13px;font-weight:normal;color:#64748b;margin:4px 0 20px}
      .row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px}
      .bold{font-weight:700}.red{color:#ef4444}.net{background:#0f172a;color:#fff;padding:14px;margin-top:16px;display:flex;justify-content:space-between;font-size:16px;font-weight:700}
      .tag{font-size:11px;color:#94a3b8}
      @media print { button { display: none; } }
    </style></head><body>
    <h1>SALARY SLIP</h1><h2>${monthLabel} &nbsp;·&nbsp; ${employee.department}</h2>
    <p class="bold">${employee.name}</p><p class="tag">${employee.id}</p>
    <div class="row"><span>Basic</span><span>${fmt(slip.basic)}</span></div>
    <div class="row"><span>HRA</span><span>${fmt(slip.hra)}</span></div>
    <div class="row"><span>Travel Allowance</span><span>${fmt(slip.ta)}</span></div>
    <div class="row"><span>Special Allowance</span><span>${fmt(slip.special)}</span></div>
    <div class="row bold"><span>Gross Salary</span><span>${fmt(slip.grossSalary)}</span></div>
    <div class="row"><span class="red">LOP (${slip.lop} days × ${fmt(slip.perDaySalary)})</span><span class="red">− ${fmt(slip.lopDeduction)}</span></div>
    <div class="row"><span class="red">PF (12% of Basic)</span><span class="red">− ${fmt(slip.pf)}</span></div>
    <div class="net"><span>NET PAY</span><span>${fmt(slip.netPay)}</span></div>
    <p style="font-size:11px;color:#94a3b8;margin-top:20px">Working days: ${slip.totalWorkdays} | Present: ${slip.present} | LOP: ${slip.lop}</p>
    </body></html>`);
    w.document.close(); 
    setTimeout(() => w.print(), 100);
  };

  return (
    <div onClick={onClose} style={{
      position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,backdropFilter:"blur(4px)"
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"#fff",borderRadius:16,padding:36,width:520,maxHeight:"90vh",
        overflowY:"auto",boxShadow:"0 25px 60px rgba(0,0,0,0.25)",
        fontFamily:"'DM Sans',system-ui,sans-serif"
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"#94a3b8",marginBottom:4}}>SALARY SLIP</div>
            <div style={{fontSize:22,fontWeight:800,color:"#0f172a"}}>{monthLabel}</div>
            <div style={{fontSize:13,color:"#64748b",marginTop:2}}>{employee.name} · {employee.id}</div>
          </div>
          <button onClick={onClose} style={{border:"none",background:"#f1f5f9",borderRadius:8,width:36,height:36,cursor:"pointer",fontSize:18,color:"#64748b",display:'flex',justifyContent:'center',alignItems:'center'}}>
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:"#94a3b8",marginBottom:8}}>EARNINGS</div>
        {[["Basic",slip.basic],["HRA",slip.hra],["Travel Allowance",slip.ta],["Special Allowance",slip.special]].map(([l,v])=>(
          <div key={l as string} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #f1f5f9",fontSize:14}}>
            <span style={{color:"#475569"}}>{l as string}</span>
            <span style={{fontWeight:600}}>{fmt(v as number)}</span>
          </div>
        ))}
        <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0",fontWeight:700,fontSize:14,borderBottom:"2px solid #e2e8f0"}}>
          <span>Gross</span><span>{fmt(slip.grossSalary)}</span>
        </div>

        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:"#94a3b8",margin:"20px 0 8px"}}>DEDUCTIONS</div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #f1f5f9",fontSize:14}}>
          <span style={{color:"#475569"}}>LOP ({slip.lop} day{slip.lop!==1?"s":""} × {fmt(slip.perDaySalary)})</span>
          <span style={{fontWeight:600,color:"#ef4444"}}>− {fmt(slip.lopDeduction)}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #f1f5f9",fontSize:14}}>
          <span style={{color:"#475569"}}>PF (12% of Basic)</span>
          <span style={{fontWeight:600,color:"#ef4444"}}>− {fmt(slip.pf)}</span>
        </div>

        <div style={{background:"#0f172a",borderRadius:12,padding:"18px 20px",marginTop:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:"#94a3b8",fontWeight:600,fontSize:13}}>NET PAY</span>
          <span style={{color:"#fff",fontWeight:800,fontSize:22}}>{fmt(slip.netPay)}</span>
        </div>

        <div style={{marginTop:14,background:"#f8fafc",borderRadius:10,padding:"14px 16px",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,textAlign:"center"}}>
          {[["Working Days",slip.totalWorkdays],["Present",slip.present],["Leaves",slip.cl+slip.sl+slip.el],["LOP",slip.lop]].map(([l,v])=>(
            <div key={l as string}>
              <div style={{fontSize:18,fontWeight:800,color: l==="LOP"&&(v as number)>0?"#ef4444":"#0f172a"}}>{v as number}</div>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,letterSpacing:"0.05em"}}>{l as string}</div>
            </div>
          ))}
        </div>

        <button onClick={handlePrint} style={{marginTop:18,width:"100%",padding:"13px",borderRadius:10,border:"none",background:"#0f172a",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>
          ⬇ Download / Print
        </button>
      </div>
    </div>
  );
}

// ─── ATTENDANCE CALENDAR ──────────────────────────────────────────────────────
export function AttendanceCalendar({ months, employeeId, isAdmin }: { months: any[], employeeId?: string, isAdmin?: boolean }) {
  const [sel, setSel] = useState(0);
  const [localMonths, setLocalMonths] = useState(months);
  const [exceptionDay, setExceptionDay] = useState<any>(null);
  const [exceptionReason, setExceptionReason] = useState("");
  const [saving, setSaving] = useState(false);

  if (!localMonths || localMonths.length === 0) {
      return <div className="text-gray-400 text-sm text-center py-6">No attendance data available.</div>;
  }

  const att = localMonths[sel];
  const firstDow = new Date(att.year, att.month, 1).getDay();
  const summary: Record<string, number> = { PRESENT:0, ABSENT:0, CL:0, SL:0, EL:0, EXCEPTION:0 };
  att.days.forEach((d: any) => { if (summary[d.status]!==undefined) summary[d.status]++; });

  const handleDayClick = (d: any) => {
    // Only allow marking exceptions for past absent days for non-admins
    if (d.status !== "ABSENT") return;
    setExceptionDay(d);
    setExceptionReason("");
  };

  const handleSaveException = async () => {
    if (!exceptionDay?.dateStr) return;
    setSaving(true);
    try {
      const res = await fetch("/api/attendance/exception", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: exceptionDay.dateStr, reason: exceptionReason })
      });
      if (res.ok) {
        // Update local state to show PENDING — approval still needed from manager/HR
        setLocalMonths(prev => prev.map((m, i) => {
          if (i !== sel) return m;
          return {
            ...m,
            days: m.days.map((d: any) =>
              d.dateStr === exceptionDay.dateStr ? { ...d, status: "PENDING" } : d
            )
          };
        }));
        setExceptionDay(null);
      } else {
        alert("Failed to save exception. Please try again.");
      }
    } catch {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {localMonths.map((m,i)=>(
          <button key={i} onClick={()=>setSel(i)} style={{
            padding:"6px 16px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,
            background: i===sel?"#0f172a":"#e2e8f0", color: i===sel?"#fff":"#475569"
          }}>{MONTH_NAMES[m.month].slice(0,3)} {m.year}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14,alignItems:"center"}}>
        {Object.entries(COLOR_MAP).filter(([k])=>!["WEEKEND","FUTURE"].includes(k)).map(([k,[c]])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:5,fontSize:12}}>
            <div style={{width:10,height:10,borderRadius:2,background:c}}/><span style={{color:"#64748b",fontWeight:500}}>{k}</span>
          </div>
        ))}
        {/* Exception instruction tip */}
        {!isAdmin && (
          <div style={{marginLeft:"auto",fontSize:11,color:"#94a3b8",fontStyle:"italic"}}>
            Click a red 🔴 absent day to raise an exception request
          </div>
        )}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:16}}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=>(
          <div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:"#94a3b8",paddingBottom:4}}>{d}</div>
        ))}
        {Array(firstDow).fill(null).map((_,i)=><div key={"p"+i}/>)}
        {att.days.map((d: any)=>{
          const [fg, bg] = COLOR_MAP[d.status] || ["#94a3b8","#f1f5f9"];
          const isClickable = d.status === "ABSENT" && !isAdmin;
          const isFuture = d.status === "FUTURE";
          return (
            <div
              key={d.date}
              title={isFuture ? "Future date" : d.status === "PENDING" ? "⏳ Exception request pending manager/HR approval" : (isClickable ? "Click to raise an exception request" : d.status)}
              onClick={() => isClickable ? handleDayClick(d) : undefined}
              style={{
                aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",
                borderRadius:6,background:bg,
                opacity: (d.status==="WEEKEND" || isFuture) ? 0.4 : 1,
                cursor: isClickable ? "pointer" : "default",
                border: isClickable ? "1.5px dashed #ef4444" : "none",
                transition: "transform 0.1s",
              }}
              onMouseEnter={e => { if (isClickable) (e.currentTarget as HTMLElement).style.transform = "scale(1.1)"; }}
              onMouseLeave={e => { if (isClickable) (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            >
              <span style={{fontSize:12,fontWeight:700,color: (isFuture||d.status==="WEEKEND") ? "#94a3b8" : fg}}>{d.date}</span>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {Object.entries(summary).map(([k,v])=>{
          const [c] = COLOR_MAP[k] || ["#64748b"];
          return (
            <div key={k} style={{background:"#f8fafc",borderRadius:8,padding:"10px 16px",textAlign:"center",minWidth:72}}>
              <div style={{fontSize:20,fontWeight:800,color:c}}>{v}</div>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,letterSpacing:"0.05em"}}>{k}</div>
            </div>
          );
        })}
      </div>

      {/* Exception Modal */}
      {exceptionDay && (
        <div onClick={() => setExceptionDay(null)} style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,backdropFilter:"blur(4px)"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:14,padding:28,width:400,boxShadow:"0 20px 50px rgba(0,0,0,0.2)",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"#f97316",marginBottom:6}}>ATTENDANCE EXCEPTION REQUEST</div>
            <div style={{fontSize:18,fontWeight:800,color:"#0f172a",marginBottom:4}}>
              {MONTH_NAMES[att.month]} {exceptionDay.date}, {att.year}
            </div>
            <p style={{fontSize:13,color:"#64748b",marginBottom:16}}>
              This exception request will be sent to your <strong>Manager and HR</strong> for approval. Once approved, this day will count as Present in your payslip.
            </p>
            <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:6}}>
              REASON (optional)
            </label>
            <textarea
              value={exceptionReason}
              onChange={e=>setExceptionReason(e.target.value)}
              placeholder="e.g. Forgot to punch in on the way back from site visit"
              style={{width:"100%",borderRadius:8,border:"1px solid #e2e8f0",padding:"10px 12px",fontSize:13,height:80,resize:"none",color:"#0f172a",boxSizing:"border-box"}}
            />
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <button onClick={()=>setExceptionDay(null)} style={{flex:1,padding:"10px",borderRadius:8,border:"1px solid #e2e8f0",background:"#f8fafc",fontWeight:600,fontSize:13,cursor:"pointer",color:"#64748b"}}>
                Cancel
              </button>
              <button onClick={handleSaveException} disabled={saving} style={{flex:2,padding:"10px",borderRadius:8,border:"none",background:"#f97316",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",opacity:saving?0.7:1}}>
                {saving ? "Submitting..." : "✓ Submit Exception Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
