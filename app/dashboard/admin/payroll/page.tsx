"use client";

import { useState, useEffect } from "react";
import { computePayroll, SalarySlipModal, AttendanceCalendar, fmt, MONTH_NAMES } from "../../payroll/shared";

export default function HRAdminPayrollView() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewSlip, setViewSlip] = useState<{ slip: any, emp: any } | null>(null);

  useEffect(() => {
     fetch("/api/payroll/dashboard")
        .then(r => r.json())
        .then(d => {
             if (d.employees) {
                 setEmployees(d.employees);
             }
             setLoading(false);
        })
        .catch(e => {
             console.error(e);
             setLoading(false);
        });
  }, []);

  const handleSalarySave = async (empDbId: string, newSalary: number) => {
      try {
          const res = await fetch(`/api/employees/${empDbId}/salary`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ grossSalary: newSalary })
          });
          if (res.ok) {
              setEmployees(prev => prev.map(x => x.id === empDbId ? { ...x, grossSalary: newSalary } : x));
          } else {
              alert("Failed to update salary.");
          }
      } catch (err) {
          console.error(err);
          alert("Error updating salary.");
      }
      setEditing(null);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading HR dashboard...</div>;
  }

  const selectedData = selectedId ? employees.find(e => e.id === selectedId) : null;
  const emp = selectedData ? { id: selectedData.employeeId, name: selectedData.name, department: selectedData.department, grossSalary: selectedData.grossSalary } : null;
  const payrolls = selectedData ? selectedData.attendance.map((m: any) => computePayroll(emp, m, selectedData.leaveBalances)) : [];

  return (
    <div style={{fontFamily:"'DM Sans',system-ui,sans-serif",background:"#fff",minHeight:"100vh",padding:24,maxWidth:1200,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.14em",color:"#94a3b8"}}>HRMS PLATFORM</div>
          <div style={{fontSize:26,fontWeight:800,color:"#0f172a",marginTop:2}}>Payroll Administration</div>
        </div>
      </div>

      <div style={{display:"flex",gap:24,minHeight:500,flexDirection:"row"}}>
        {/* Sidebar */}
        <div style={{width:290,flexShrink:0, height:"calc(100vh - 120px)", overflowY:"auto", paddingRight:8}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:"#94a3b8",marginBottom:12,position:"sticky",top:0,background:"#fff",paddingBottom:8}}>EMPLOYEE DIRECTORY</div>
          {employees.map(e=>(
            <div key={e.id} onClick={()=>setSelectedId(e.id)} style={{
              padding:"14px 16px",borderRadius:10,marginBottom:8,cursor:"pointer",
              background: selectedId===e.id?"#0f172a":"#f8fafc",
              color: selectedId===e.id?"#fff":"#1e293b",
              border:`1px solid ${selectedId===e.id?"#0f172a":"#e2e8f0"}`,
              transition:"all 0.1s"
            }}>
              <div style={{fontWeight:700,fontSize:14}}>{e.name}</div>
              <div style={{fontSize:12,opacity:0.6,marginTop:2}}>{e.department} · {e.employeeId}</div>
              <div style={{marginTop:10,display:"flex",alignItems:"center",gap:8}} onClick={ev=>ev.stopPropagation()}>
                {editing===e.id ? (
                  <div style={{display:"flex",gap:6}}>
                    <input value={editVal} onChange={ev=>setEditVal(ev.target.value)}
                      style={{width:90,padding:"4px 8px",borderRadius:6,border:"1px solid #cbd5e1",fontSize:13,color: '#000'}} autoFocus/>
                    <button onClick={()=>{
                      const v=parseInt(editVal);
                      if(!isNaN(v)&&v>=0) handleSalarySave(e.id, v);
                      else setEditing(null);
                    }} style={{padding:"4px 10px",borderRadius:6,border:"none",background:"#22c55e",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>✓</button>
                    <button onClick={()=>setEditing(null)} style={{padding:"4px 8px",borderRadius:6,border:"none",background:"#ef4444",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>×</button>
                  </div>
                ) : (
                  <>
                    <span style={{fontSize:14,fontWeight:800,color:selectedId===e.id?"#60a5fa":"#3b82f6"}}>{fmt(e.grossSalary)}</span>
                    <button onClick={()=>{setEditing(e.id);setEditVal(String(e.grossSalary));}} style={{
                      padding:"2px 8px",borderRadius:5,border:"none",fontSize:11,cursor:"pointer",fontWeight:600,
                      background:selectedId===e.id?"rgba(255,255,255,0.15)":"#e2e8f0",
                      color:selectedId===e.id?"#fff":"#475569"
                    }}>Edit Salary</button>
                  </>
                )}
              </div>
            </div>
          ))}
          {employees.length === 0 && <div className="text-sm text-gray-500 italic">No employees found.</div>}
        </div>

        {/* Detail */}
        <div style={{flex:1, height:"calc(100vh - 120px)", overflowY:"auto"}}>
          {!selectedData || !emp ? (
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:300,color:"#94a3b8",fontSize:15}}>
              Select an employee from the directory to view payroll details
            </div>
          ) : (<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div>
                <div style={{fontSize:22,fontWeight:800,color:"#0f172a"}}>{emp.name}</div>
                <div style={{fontSize:13,color:"#64748b"}}>{emp.department} · {emp.id}</div>
              </div>
              <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:"10px 18px",textAlign:"right"}}>
                <div style={{fontSize:11,color:"#15803d",fontWeight:700,letterSpacing:"0.08em"}}>GROSS SALARY</div>
                <div style={{fontSize:20,fontWeight:800,color:"#15803d"}}>{fmt(emp.grossSalary)}</div>
              </div>
            </div>

            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:"#94a3b8",marginBottom:10}}>LEAVE BALANCE</div>
            <div style={{display:"flex",gap:10,marginBottom:24, flexWrap:"wrap"}}>
              {Object.entries(selectedData.leaveBalances).map(([t,v])=>(
                <div key={t} style={{flex:1, minWidth:120, background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"12px 20px",textAlign:"center"}}>
                  <div style={{fontSize:24,fontWeight:800,color:"#0f172a"}}>{v as number}</div>
                  <div style={{fontSize:11,color:"#94a3b8",fontWeight:700}}>{t} Balance</div>
                </div>
              ))}
            </div>

            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:"#94a3b8",marginBottom:10}}>PAYROLL COMPUTATION — PAST 3 MONTHS</div>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
              {payrolls.map((slip: any,i: number)=>(
                <div key={i} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center", flexWrap:"wrap", gap: 16}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:15}}>{MONTH_NAMES[slip.month]} {slip.year}</div>
                    <div style={{fontSize:12,color:"#64748b",marginTop:3}}>
                      Present: {slip.present} &nbsp;·&nbsp; Leaves: {slip.cl+slip.sl+slip.el} &nbsp;·&nbsp;
                      LOP: <span style={{color:slip.lop>0?"#ef4444":"#22c55e",fontWeight:700}}>{slip.lop}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:14}}>
                    {slip.lop>0&&(
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:11,color:"#ef4444",fontWeight:700}}>LOP Deduction</div>
                        <div style={{fontSize:13,fontWeight:700,color:"#ef4444"}}>− {fmt(slip.lopDeduction)}</div>
                      </div>
                    )}
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:11,color:"#94a3b8",fontWeight:700}}>NET PAY</div>
                      <div style={{fontSize:18,fontWeight:800,color:"#0f172a"}}>{fmt(slip.netPay)}</div>
                    </div>
                    <button onClick={()=>setViewSlip({slip,emp})} style={{padding:"8px 14px",borderRadius:8,border:"none",background:"#0f172a",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>
                      View Slip
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:"#94a3b8",marginBottom:10}}>ATTENDANCE RECORDS</div>
            <div style={{background:"#f8fafc",borderRadius:12,padding:20,border:"1px solid #e2e8f0"}}>
              <div className="mb-4 text-sm text-gray-500">Note: Absences without an approved leave request are marked as Absent/LOP.</div>
              <AttendanceCalendar months={selectedData.attendance}/>
            </div>
          </>)}
        </div>
      </div>

      {viewSlip&&<SalarySlipModal slip={viewSlip.slip} employee={viewSlip.emp} onClose={()=>setViewSlip(null)}/>}
    </div>
  );
}
