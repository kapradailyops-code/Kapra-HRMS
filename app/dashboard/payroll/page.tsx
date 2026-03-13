"use client";

import { useState, useEffect } from "react";
import { computePayroll, SalarySlipModal, AttendanceCalendar, fmt, MONTH_NAMES } from "./shared";

export default function EmployeePayrollView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewSlip, setViewSlip] = useState<{ slip: any, emp: any } | null>(null);
  const [tab, setTab] = useState("salary");

  useEffect(() => {
     fetch("/api/payroll/dashboard")
        .then(r => r.json())
        .then(d => {
             if (d.employees && d.employees.length > 0) {
                 setData(d.employees[0]);
             }
             setLoading(false);
        })
        .catch(e => {
             console.error(e);
             setLoading(false);
        });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading payroll data...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-gray-500">Failed to load payroll data.</div>;
  }

  const emp = { id: data.employeeId, name: data.name, department: data.department, grossSalary: data.grossSalary };
  const payrolls = data.attendance.map((m: any) => computePayroll(emp, m, data.leaveBalances));

  return (
    <div style={{fontFamily:"'DM Sans',system-ui,sans-serif",background:"#fff",minHeight:"100vh",padding:24,maxWidth:1100,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.14em",color:"#94a3b8"}}>HRMS PLATFORM</div>
          <div style={{fontSize:26,fontWeight:800,color:"#0f172a",marginTop:2}}>My Payroll</div>
        </div>
      </div>

      <div style={{background:"#0f172a",borderRadius:14,padding:"20px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"#475569"}}>MY ACCOUNT</div>
          <div style={{fontSize:22,fontWeight:800,color:"#fff",marginTop:2}}>{emp.name}</div>
          <div style={{fontSize:13,color:"#94a3b8",marginTop:2}}>{emp.department} · {emp.id}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",color:"#475569"}}>GROSS SALARY</div>
          <div style={{fontSize:24,fontWeight:800,color:"#60a5fa"}}>{fmt(emp.grossSalary)}</div>
        </div>
      </div>

      <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"}}>
        {Object.entries(data.leaveBalances).map(([t,v])=>(
          <div key={t} style={{flex:1, minWidth:120, background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:"14px",textAlign:"center"}}>
            <div style={{fontSize:28,fontWeight:800,color:"#0f172a"}}>{v as number}</div>
            <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,marginTop:2}}>{t} Balance</div>
          </div>
        ))}
        <div style={{flex:1, minWidth:120, background:"#fef2f2",border:"1px solid #fecaca",borderRadius:12,padding:"14px",textAlign:"center"}}>
          <div style={{fontSize:28,fontWeight:800,color:"#ef4444"}}>{payrolls.length > 0 ? payrolls[0].lop : 0}</div>
          <div style={{fontSize:11,color:"#ef4444",fontWeight:700,marginTop:2}}>LOP This Month</div>
        </div>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:20}}>
        {[["salary","Salary Slips"],["attendance","Attendance"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{
            padding:"8px 18px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,
            background:tab===k?"#0f172a":"#f1f5f9", color:tab===k?"#fff":"#475569"
          }}>{l}</button>
        ))}
      </div>

      {tab==="salary" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {payrolls.map((slip: any,i: number)=>(
            <div key={i} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:"18px 22px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontWeight:700,fontSize:16}}>{MONTH_NAMES[slip.month]} {slip.year}</div>
                <div style={{fontSize:12,color:"#64748b",marginTop:4}}>
                  Paid days: {slip.paidDays}/{slip.totalWorkdays}
                  {slip.lop>0&&<span style={{color:"#ef4444",fontWeight:700}}> · LOP: {slip.lop} days</span>}
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <div style={{textAlign:"right"}}>
                  {slip.lop>0&&<div style={{fontSize:12,color:"#ef4444",fontWeight:600}}>− {fmt(slip.lopDeduction)} LOP</div>}
                  <div style={{fontSize:20,fontWeight:800,color:"#0f172a"}}>{fmt(slip.netPay)}</div>
                </div>
                <button onClick={()=>setViewSlip({slip,emp})} style={{padding:"9px 16px",borderRadius:8,border:"none",background:"#0f172a",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                  Download
                </button>
              </div>
            </div>
          ))}
          {payrolls.length === 0 && <div className="text-gray-500 text-sm py-4">No recent payroll slips generated.</div>}
        </div>
      )}

      {tab==="attendance" && (
        <div style={{background:"#f8fafc",borderRadius:12,padding:20,border:"1px solid #e2e8f0"}}>
          <div className="mb-4 text-sm text-gray-500">Note: Absences without an approved leave request are marked as Absent/LOP.</div>
          <AttendanceCalendar months={data.attendance}/>
        </div>
      )}

      {viewSlip&&<SalarySlipModal slip={viewSlip.slip} employee={viewSlip.emp} onClose={()=>setViewSlip(null)}/>}
    </div>
  );
}
