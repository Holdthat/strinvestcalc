/**
 * STRInvestCalc — Investment Decision Tool
 * =========================================
 * Vacation Home Group
 * Landing page + embedded calculator + Pro tier with email gate
 * Version 2.0.0
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

// ═══════════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════════
const darkVars = {
  '--bg-primary':'#0B1120','--bg-secondary':'#151D2E','--bg-tertiary':'#0F172A',
  '--bg-card':'#151D2E','--bg-hover':'rgba(21,29,46,0.8)','--bg-subtle':'rgba(22,122,94,0.08)',
  '--border-primary':'rgba(255,255,255,0.08)','--border-accent':'rgba(22,122,94,0.25)',
  '--text-primary':'#F8FAFC','--text-secondary':'#E2E8F0','--text-muted':'#94A3B8',
  '--text-faint':'#64748B','--text-dim':'#475569',
  '--accent':'#167A5E','--accent-dark':'#0F5E48','--accent-glow':'#1A9070',
  '--gold':'#9A7820','--gold-light':'#B8922E','--gold-subtle':'rgba(154,120,32,0.12)',
  '--green':'#1A9070','--red':'#EF4444','--blue':'#3B82F6','--purple':'#8B5CF6',
  '--tooltip-bg':'#151D2E','--tooltip-border':'rgba(255,255,255,0.1)',
  '--input-bg':'#0F172A','--chart-grid':'rgba(255,255,255,0.06)',
};
const lightVars = {
  '--bg-primary':'#F5F5F5','--bg-secondary':'#FFFFFF','--bg-tertiary':'#EFEFEF',
  '--bg-card':'#EFEFEF','--bg-hover':'#E8E8E8','--bg-subtle':'rgba(22,122,94,0.06)',
  '--border-primary':'#D8D8D8','--border-accent':'rgba(22,122,94,0.3)',
  '--text-primary':'#0A0A0A','--text-secondary':'#1E293B','--text-muted':'#3A3A3A',
  '--text-faint':'#6B7280','--text-dim':'#94A3B8',
  '--accent':'#167A5E','--accent-dark':'#0F5E48','--accent-glow':'#1A9070',
  '--gold':'#9A7820','--gold-light':'#B8922E','--gold-subtle':'rgba(154,120,32,0.08)',
  '--green':'#167A5E','--red':'#DC2626','--blue':'#3B82F6','--purple':'#8B5CF6',
  '--tooltip-bg':'#FFFFFF','--tooltip-border':'#D8D8D8',
  '--input-bg':'#FFFFFF','--chart-grid':'#E8E8E8',
};

// ═══════════════════════════════════════════════════════════════
// CALCULATIONS
// ═══════════════════════════════════════════════════════════════
function calculateHoldScenario(data, years = 10) {
  const cv = parseFloat(data.currentValue)||0, pp = parseFloat(data.purchasePrice)||0;
  const rent = parseFloat(data.annualRent)||0, expenses = parseFloat(data.annualExpenses)||0;
  const vacancy = parseFloat(data.vacancyRate)||0, mortBal = parseFloat(data.mortgageBalance)||0;
  const mortRate = parseFloat(data.mortgageRate)||0, mortYrs = parseInt(data.mortgageYearsRemaining)||0;
  const appRate = parseFloat(data.annualAppreciation)||0.03;
  const mR = mortRate/12, tP = mortYrs*12;
  const mPay = mortBal>0&&mR>0&&tP>0 ? mortBal*(mR*Math.pow(1+mR,tP))/(Math.pow(1+mR,tP)-1) : 0;
  const annDS = mPay*12;
  const depBasis = pp*0.85, annDep = depBasis/27.5;
  const maintSched = [];
  for(let y=1;y<=years;y++){let e=0;const rA=(parseInt(data.roofAge)||0)+y,hA=(parseInt(data.hvacAge)||0)+y,wA=(parseInt(data.waterHeaterAge)||0)+y;if(rA>=25&&rA<=27)e+=cv*0.04;if(hA>=15&&hA<=17)e+=cv*0.02;if(wA>=12&&wA<=13)e+=cv*0.005;maintSched.push(e);}
  const yearlyData = [];let cumCF=0,remMort=mortBal;
  for(let y=1;y<=years;y++){
    const pv=cv*Math.pow(1+appRate,y),gr=rent*Math.pow(1.025,y-1),er=gr*(1-vacancy/100);
    const oe=expenses*Math.pow(1.03,y-1),m=maintSched[y-1]||0,ds=y<=mortYrs?annDS:0;
    if(remMort>0&&mortRate>0){const int=remMort*mortRate;const pr=Math.min(ds-int,remMort);remMort=Math.max(0,remMort-pr);}
    const ncf=er-oe-m-ds;cumCF+=ncf;const eq=pv-remMort;
    yearlyData.push({year:y,propertyValue:Math.round(pv),effectiveRent:Math.round(er),opExpenses:Math.round(oe),maintenance:Math.round(m),debtService:Math.round(ds),netCashFlow:Math.round(ncf),cumulativeCashFlow:Math.round(cumCF),equity:Math.round(eq),depreciation:Math.round(annDep)});
  }
  return {yearlyData,totalWealth:(yearlyData[years-1]?.equity||0)+cumCF};
}

function calculateSellScenario(data, years = 10, altReturn = 0.07) {
  const cv=parseFloat(data.currentValue)||0,pp=parseFloat(data.purchasePrice)||0,mortBal=parseFloat(data.mortgageBalance)||0;
  const sellCosts=cv*0.075,depBasis=pp*0.85,yrsOwned=parseInt(data.yearsOwned)||1;
  const totDep=Math.min((depBasis/27.5)*yrsOwned,depBasis),adjBasis=pp-totDep;
  const capGain=cv-adjBasis,depRecap=totDep*0.25,ltGainsTax=Math.max(0,capGain-totDep)*0.15;
  const totTax=depRecap+ltGainsTax,gross=cv-mortBal,net=gross-sellCosts-totTax;
  const yearlyData=[];for(let y=1;y<=years;y++){const iv=net*Math.pow(1+altReturn,y);yearlyData.push({year:y,investedValue:Math.round(iv)});}
  return {grossProceeds:Math.round(gross),sellingCosts:Math.round(sellCosts),capitalGainsTax:Math.round(totTax),netProceeds:Math.round(net),yearlyData,totalWealthAtEnd:yearlyData[years-1]?.investedValue||0};
}

function calculate1031Scenario(data, years = 10) {
  const cv=parseFloat(data.currentValue)||0,mortBal=parseFloat(data.mortgageBalance)||0;
  const repVal=parseFloat(data.replacementValue)||cv*1.2,repRent=parseFloat(data.replacementRent)||parseFloat(data.annualRent)*1.1;
  const repExp=parseFloat(data.replacementExpenses)||parseFloat(data.annualExpenses)*0.9;
  const appRate=parseFloat(data.annualAppreciation)||0.03,exchCosts=cv*0.03;
  const eqTransferred=cv-mortBal-exchCosts,newMort=repVal-eqTransferred;
  const mR=0.065/12,mPay=newMort>0?newMort*(mR*Math.pow(1+mR,360))/(Math.pow(1+mR,360)-1):0;
  const annDS=mPay*12;const yearlyData=[];let cumCF=0,remMort=newMort;
  for(let y=1;y<=years;y++){
    const pv=repVal*Math.pow(1+appRate,y),r=repRent*Math.pow(1.025,y-1),e=repExp*Math.pow(1.03,y-1);
    const ncf=r*0.85-e-annDS;cumCF+=ncf;
    if(remMort>0){const int=remMort*0.065;const pr=Math.min(annDS-int,remMort);remMort=Math.max(0,remMort-pr);}
    yearlyData.push({year:y,propertyValue:Math.round(pv),netCashFlow:Math.round(ncf),cumulativeCashFlow:Math.round(cumCF),equity:Math.round(pv-remMort)});
  }
  return {equityTransferred:Math.round(eqTransferred),taxDeferred:Math.round(cv*0.15),yearlyData,totalWealth:(yearlyData[years-1]?.equity||0)+cumCF};
}

// ═══════════════════════════════════════════════════════════════
// FORMATTERS
// ═══════════════════════════════════════════════════════════════
const fmt=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:0}).format(n||0);
const fmtK=n=>{const v=n||0;if(Math.abs(v)>=1e6)return`$${(v/1e6).toFixed(1)}M`;if(Math.abs(v)>=1e3)return`$${(v/1e3).toFixed(0)}K`;return fmt(v);};

// ═══════════════════════════════════════════════════════════════
// LOGOS
// ═══════════════════════════════════════════════════════════════
const APP_VERSION='2.0.0';

const VHGLogoMark=({size=36})=>(<svg viewBox="0 0 64 64" width={size} height={size} style={{flexShrink:0}}><rect width="64" height="64" rx="12" fill="var(--bg-card)" stroke="var(--border-primary)" strokeWidth="1"/><path d="M10 38 L18 26 L24 30 L32 18 L38 26 L42 22 L54 38" fill="none" stroke="#10B981" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/><line x1="8" y1="38" x2="56" y2="38" stroke="#C8962E" strokeWidth="0.8"/><text x="32" y="50" textAnchor="middle" fill="var(--text-primary)" fontFamily="Georgia,serif" fontSize="8" fontWeight="700" letterSpacing="0.04em">VH</text><text x="32" y="58" textAnchor="middle" fill="#C8962E" fontFamily="Georgia,serif" fontSize="7" fontStyle="italic">group</text></svg>);

const VHGFooterLogo=({dark})=>{const f=dark?'#FFFFFF':'#1A1A1A';return(<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 170" width="220" height="117"><path d="M85 28 L110 12 L128 22 L155 4 L178 18 L195 10 L235 28" fill="none" stroke="#10B981" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/><line x1="80" y1="28" x2="240" y2="28" stroke="#C8962E" strokeWidth="0.8"/><text x="160" y="62" textAnchor="middle" fill={f} fontFamily="Georgia,serif" fontSize="34" fontWeight="700" letterSpacing="0.08em">VACATION</text><text x="160" y="95" textAnchor="middle" fill={f} fontFamily="Georgia,serif" fontSize="34" fontWeight="700" letterSpacing="0.08em">HOME</text><line x1="60" y1="103" x2="112" y2="103" stroke="#C8962E" strokeWidth="1.5" strokeLinecap="round"/><line x1="60" y1="109" x2="98" y2="109" stroke="#C8962E" strokeWidth="1" strokeLinecap="round"/><text x="165" y="138" textAnchor="middle" fill="#C8962E" fontFamily="Georgia,serif" fontSize="32" fontStyle="italic">group</text></svg>);};

// ═══════════════════════════════════════════════════════════════
// SHARED UI
// ═══════════════════════════════════════════════════════════════
const Card=({children,style={}})=>(<div style={{background:'var(--bg-card)',border:'1px solid var(--border-primary)',borderRadius:10,padding:'20px 24px',...style}}>{children}</div>);
const SectionLabel=({children})=>(<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--gold)',marginBottom:16}}>{children}</div>);
const GoldDivider=({width=120,mb=20})=>(<div style={{width,height:1,margin:`0 auto ${mb}px`,background:'linear-gradient(90deg,transparent,var(--gold),transparent)'}}/>);

const InputField=({label,name,value,onChange,type='text',prefix,suffix,placeholder,error})=>(<div style={{marginBottom:16}}><label style={{display:'block',fontSize:13,fontWeight:600,color:'var(--text-secondary)',marginBottom:6}}>{label}</label><div style={{position:'relative'}}>{prefix&&<span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',fontSize:14}}>{prefix}</span>}<input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} style={{width:'100%',padding:'10px 12px',paddingLeft:prefix?28:12,paddingRight:suffix?40:12,background:'var(--input-bg)',border:`1px solid ${error?'var(--red)':'var(--border-primary)'}`,borderRadius:8,color:'var(--text-primary)',fontSize:14,outline:'none',fontFamily:"'JetBrains Mono',monospace"}}/>{suffix&&<span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',fontSize:13}}>{suffix}</span>}</div>{error&&<p style={{color:'var(--red)',fontSize:12,marginTop:4}}>{error}</p>}</div>);

const SelectField=({label,name,value,onChange,options})=>(<div style={{marginBottom:16}}><label style={{display:'block',fontSize:13,fontWeight:600,color:'var(--text-secondary)',marginBottom:6}}>{label}</label><select name={name} value={value} onChange={onChange} style={{width:'100%',padding:'10px 12px',background:'var(--input-bg)',border:'1px solid var(--border-primary)',borderRadius:8,color:'var(--text-primary)',fontSize:14,outline:'none'}}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>);

const Slider=({label,min,max,step,value,onChange,displayValue,suffix='%'})=>{const pct=Math.max(0,Math.min(100,((value-min)/(max-min))*100));return(<div style={{marginBottom:20,padding:14,background:'var(--bg-card)',borderRadius:8,border:'1px solid var(--border-primary)'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--gold)'}}>{label}</span><span style={{fontSize:14,fontWeight:600,color:'var(--accent)'}}>{displayValue}</span></div><input type="range" min={min} max={max} step={step} value={value} onChange={e=>{const raw=Number(e.target.value);const rounded=Math.round(raw/step)*step;onChange({target:{value:rounded}});}} style={{width:'100%',height:6,borderRadius:3,background:`linear-gradient(to right,var(--accent) 0%,var(--accent) ${pct}%,var(--border-primary) ${pct}%,var(--border-primary) 100%)`}}/><div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--text-faint)',marginTop:4}}><span>{min}{suffix}</span><span>{max}{suffix}</span></div></div>);};

const ThemeToggle=({dark,setDark})=>(<button onClick={()=>setDark(!dark)} style={{width:36,height:36,borderRadius:8,border:'1px solid var(--border-primary)',background:'rgba(255,255,255,0.06)',color:'var(--text-primary)',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>{dark?'\u2600':'\u263E'}</button>);

// ═══════════════════════════════════════════════════════════════
// VHG FOOTER
// ═══════════════════════════════════════════════════════════════
const VHGFooter=({dark})=>(<footer style={{borderTop:'1px solid var(--border-primary)',padding:'32px 24px',textAlign:'center',marginTop:40}}>
  <div style={{marginBottom:0}}><VHGFooterLogo dark={dark}/></div>
  <div style={{fontSize:14,color:'var(--text-muted)',fontStyle:'italic',fontFamily:'Georgia,serif'}}>Your Retreat, Our Expertise</div>
  <div style={{fontSize:14,color:'var(--text-primary)',marginBottom:28,fontFamily:"'DM Mono',monospace"}}>Real Broker NH, LLC</div>
  <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,color:'var(--text-primary)',marginBottom:2}}>STR<span style={{color:'var(--gold)'}}>Invest</span>Calc</div>
  <div style={{fontSize:14,color:'var(--text-muted)',marginBottom:4}}>by Vacation Home Group</div>
  <div style={{fontSize:11,color:'var(--text-faint)',marginBottom:16,fontFamily:"'JetBrains Mono',monospace"}}>v{APP_VERSION}</div>
  <GoldDivider/>
  <div style={{display:'flex',justifyContent:'center',gap:60,marginBottom:20,flexWrap:'wrap'}}>
    <div style={{textAlign:'center'}}><div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:700,color:'var(--text-primary)'}}>Joe Mori</div><div style={{fontSize:13,color:'var(--text-muted)',marginBottom:4}}>REALTOR&reg; &middot; Vacation Home Specialist</div><div style={{fontSize:14,color:'var(--text-muted)'}}><a href="tel:6039017777" style={{color:'var(--text-primary)',textDecoration:'none'}}>603-901-7777</a><span style={{margin:'0 4px'}}>&middot;</span><a href="mailto:joemori@vacationhome.group" style={{color:'var(--gold)',textDecoration:'none'}}>joemori@vacationhome.group</a></div></div>
    <div style={{textAlign:'center'}}><div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:700,color:'var(--text-primary)'}}>Dino Amato</div><div style={{fontSize:13,color:'var(--text-muted)',marginBottom:4}}>REALTOR&reg; &middot; Vacation Home Specialist</div><div style={{fontSize:14,color:'var(--text-muted)'}}><a href="tel:6032751191" style={{color:'var(--text-primary)',textDecoration:'none'}}>603-275-1191</a><span style={{margin:'0 4px'}}>&middot;</span><a href="mailto:dinoamato@vacationhome.group" style={{color:'var(--gold)',textDecoration:'none'}}>dinoamato@vacationhome.group</a></div></div>
  </div>
  <div style={{fontSize:14,color:'var(--text-muted)',marginBottom:16}}>
    <a href="https://www.vacationhomegroup.net" style={{color:'var(--gold)',textDecoration:'none',fontWeight:600}}>vacationhomegroup.net</a><span style={{margin:'0 6px'}}>&middot;</span><a href="https://www.vacationhome.group" style={{color:'var(--gold)',textDecoration:'none',fontWeight:600}}>vacationhome.group</a><span style={{margin:'0 6px'}}>&middot;</span><span>Office: <a href="tel:8554500442" style={{color:'var(--text-primary)',textDecoration:'none'}}>855-450-0442</a></span>
  </div>
  <p style={{fontSize:14,color:'var(--text-muted)',lineHeight:1.8,maxWidth:580,margin:'0 auto 10px'}}>Joe Mori &amp; Dino Amato, Real Broker NH. Each office is independently owned and operated.</p>
  <p style={{fontSize:14,color:'var(--text-muted)',lineHeight:1.8,maxWidth:580,margin:'0 auto 10px'}}>Projections are estimates based on user-provided inputs. This tool does not constitute financial or investment advice. Consult a qualified real estate professional before making investment decisions.</p>
  <p style={{fontSize:14,color:'var(--text-muted)',lineHeight:1.8,maxWidth:580,margin:'0 auto'}}>By using this platform, you consent to the collection of your email address and preferences for the purpose of delivering personalized market analysis. We do not sell or share your information with third parties.</p>
</footer>);

// ═══════════════════════════════════════════════════════════════
// NAV BAR
// ═══════════════════════════════════════════════════════════════
const NavBar=({dark,setDark,onNav})=>(<nav style={{borderBottom:'1px solid var(--border-primary)',padding:'16px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',background:dark?'linear-gradient(135deg,#0B1120,#151D2E)':'linear-gradient(135deg,#FFFFFF,#F5F5F5)',position:'sticky',top:0,zIndex:100}}>
  <div style={{display:'flex',alignItems:'center',gap:12,cursor:'pointer'}} onClick={()=>onNav&&onNav('landing')}>
    <VHGLogoMark size={36}/>
    <div><span style={{fontSize:20,fontWeight:700,color:'var(--text-primary)'}}>STR<span style={{color:'var(--gold)'}}>Invest</span>Calc</span><div style={{fontSize:11,color:'var(--gold)',fontStyle:'italic',fontFamily:'Georgia,serif'}}>by Vacation Home Group <span style={{color:'var(--text-faint)',fontStyle:'normal',fontFamily:"'JetBrains Mono',monospace",fontSize:9}}>v{APP_VERSION}</span></div></div>
  </div>
  <div style={{display:'flex',alignItems:'center',gap:16}}>
    {onNav&&<><button onClick={()=>onNav('features')} style={{background:'none',border:'none',color:'var(--text-muted)',fontSize:13,cursor:'pointer'}}>Features</button><button onClick={()=>onNav('calculator')} style={{background:'none',border:'none',color:'var(--accent)',fontSize:13,fontWeight:700,cursor:'pointer'}}>Calculator</button><button onClick={()=>onNav('pro')} style={{background:'none',border:'none',color:'var(--gold)',fontSize:13,fontWeight:700,cursor:'pointer'}}>&star; Pro</button></>}
    <ThemeToggle dark={dark} setDark={setDark}/>
  </div>
</nav>);

// ═══════════════════════════════════════════════════════════════
// PRO GATE — Email collection modal
// ═══════════════════════════════════════════════════════════════
const ProGate=({onUnlock,onClose})=>{
  const[name,setName]=useState('');const[email,setEmail]=useState('');const[phone,setPhone]=useState('');const[submitted,setSubmitted]=useState(false);
  const handleSubmit=()=>{if(name&&email){setSubmitted(true);setTimeout(()=>{onUnlock({name,email,phone});},1500);}};
  return(<div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.7)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
    <div style={{background:'var(--bg-card)',border:'1px solid var(--border-primary)',borderRadius:16,padding:32,maxWidth:440,width:'100%',position:'relative'}}>
      <button onClick={onClose} style={{position:'absolute',top:12,right:16,background:'none',border:'none',color:'var(--text-muted)',fontSize:20,cursor:'pointer'}}>&times;</button>
      {!submitted?(<>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:24,fontWeight:700,color:'var(--gold)',marginBottom:4}}>&star; Unlock Pro</div>
          <p style={{fontSize:14,color:'var(--text-muted)'}}>Pro is available at no charge to Vacation Home Group clients. Share your info to unlock all features instantly.</p>
        </div>
        <InputField label="Full Name *" name="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Jane Smith" error={!name&&submitted?'Required':null}/>
        <InputField label="Email Address *" name="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="jane@example.com" type="email" error={!email&&submitted?'Required':null}/>
        <InputField label="Phone (optional)" name="phone" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="603-555-1234" type="tel"/>
        <button onClick={handleSubmit} style={{width:'100%',padding:'14px 24px',borderRadius:8,border:'none',background:'var(--gold)',color:'#fff',fontSize:16,fontWeight:700,cursor:'pointer',marginTop:8}}>Unlock Pro Access &rarr;</button>
        <p style={{fontSize:11,color:'var(--text-faint)',textAlign:'center',marginTop:12}}>We do not sell or share your information with third parties.</p>
      </>):(<div style={{textAlign:'center',padding:'40px 0'}}>
        <div style={{fontSize:48,marginBottom:16}}>&star;</div>
        <div style={{fontSize:20,fontWeight:700,color:'var(--accent)'}}>Pro Unlocked!</div>
        <p style={{fontSize:14,color:'var(--text-muted)',marginTop:8}}>Welcome, {name}. All features are now active.</p>
      </div>)}
    </div>
  </div>);
};

// ═══════════════════════════════════════════════════════════════
// QUESTIONNAIRE
// ═══════════════════════════════════════════════════════════════
const Questionnaire=({onComplete,initialData})=>{
  const[step,setStep]=useState(1);const totalSteps=4;
  const[form,setForm]=useState(initialData||{propertyType:'single-family',location:'',purchasePrice:'',currentValue:'',yearsOwned:'',managementStyle:'self-managed',annualRent:'',annualExpenses:'',vacancyRate:'10',mortgageBalance:'',mortgageRate:'',mortgageYearsRemaining:'',roofAge:'5',hvacAge:'5',waterHeaterAge:'3',capRate:'',annualAppreciation:'3',alternativeInvestment:'stock-market',alternativeReturn:'7',exitStrategy:'undecided',replacementValue:'',replacementRent:'',replacementExpenses:''});
  const[errors,setErrors]=useState({});
  const hc=e=>{setForm({...form,[e.target.name]:e.target.value});if(errors[e.target.name])setErrors({...errors,[e.target.name]:null});};
  const validate=()=>{const e={};if(step===1){if(!form.location)e.location='Required';if(!form.purchasePrice||form.purchasePrice<=0)e.purchasePrice='Required';if(!form.currentValue||form.currentValue<=0)e.currentValue='Required';if(!form.annualRent||form.annualRent<=0)e.annualRent='Required';}if(step===2){if(!form.annualExpenses&&form.annualExpenses!=='0')e.annualExpenses='Required';}setErrors(e);return Object.keys(e).length===0;};
  const next=()=>{if(validate())setStep(s=>Math.min(s+1,totalSteps));};const prev=()=>setStep(s=>Math.max(s-1,1));const submit=()=>{if(validate())onComplete(form);};

  return(<div style={{maxWidth:640,margin:'0 auto',padding:'40px 20px'}}>
    {/* Progress */}
    <div style={{marginBottom:32}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>{['Property','Financials','Market','Review'].map((l,i)=>(<div key={i} style={{fontSize:11,fontWeight:step>i?700:500,color:step>i?'var(--accent)':step===i+1?'var(--gold)':'var(--text-muted)',letterSpacing:'0.05em',textTransform:'uppercase',fontFamily:"'JetBrains Mono',monospace"}}>{l}</div>))}</div><div style={{height:3,background:'var(--border-primary)',borderRadius:2}}><div style={{height:'100%',width:`${(step/totalSteps)*100}%`,background:'linear-gradient(90deg,var(--accent),var(--gold))',borderRadius:2,transition:'width 0.3s'}}/></div></div>
    <Card>
      {step===1&&(<><SectionLabel>Property &amp; Portfolio</SectionLabel>
        <SelectField label="Property Type" name="propertyType" value={form.propertyType} onChange={hc} options={[{value:'single-family',label:'Single Family'},{value:'condo',label:'Condo / Townhome'},{value:'multi-family',label:'Multi-Family'},{value:'cabin',label:'Cabin / Vacation Home'}]}/>
        <InputField label="Location (City, State)" name="location" value={form.location} onChange={hc} placeholder="e.g. Lincoln, NH" error={errors.location}/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><InputField label="Purchase Price" name="purchasePrice" value={form.purchasePrice} onChange={hc} type="number" prefix="$" error={errors.purchasePrice}/><InputField label="Current Market Value" name="currentValue" value={form.currentValue} onChange={hc} type="number" prefix="$" error={errors.currentValue}/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><InputField label="Years Owned" name="yearsOwned" value={form.yearsOwned} onChange={hc} type="number" suffix="yrs"/><InputField label="Annual Gross Rent" name="annualRent" value={form.annualRent} onChange={hc} type="number" prefix="$" error={errors.annualRent}/></div>
        <SelectField label="Management Style" name="managementStyle" value={form.managementStyle} onChange={hc} options={[{value:'self-managed',label:'Self-Managed'},{value:'property-manager',label:'Property Manager (20-25%)'},{value:'hybrid',label:'Hybrid'}]}/>
      </>)}
      {step===2&&(<><SectionLabel>Financial Snapshot</SectionLabel>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><InputField label="Annual Operating Expenses" name="annualExpenses" value={form.annualExpenses} onChange={hc} type="number" prefix="$" error={errors.annualExpenses}/><InputField label="Vacancy Rate" name="vacancyRate" value={form.vacancyRate} onChange={hc} type="number" suffix="%"/></div>
        <SectionLabel>Mortgage Details</SectionLabel>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><InputField label="Mortgage Balance" name="mortgageBalance" value={form.mortgageBalance} onChange={hc} type="number" prefix="$"/><InputField label="Interest Rate" name="mortgageRate" value={form.mortgageRate} onChange={hc} type="number" suffix="%"/></div>
        <InputField label="Years Remaining" name="mortgageYearsRemaining" value={form.mortgageYearsRemaining} onChange={hc} type="number" suffix="yrs"/>
        <SectionLabel>Property Condition</SectionLabel>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}><InputField label="Roof Age" name="roofAge" value={form.roofAge} onChange={hc} type="number" suffix="yrs"/><InputField label="HVAC Age" name="hvacAge" value={form.hvacAge} onChange={hc} type="number" suffix="yrs"/><InputField label="Water Heater" name="waterHeaterAge" value={form.waterHeaterAge} onChange={hc} type="number" suffix="yrs"/></div>
      </>)}
      {step===3&&(<><SectionLabel>Market Assumptions</SectionLabel>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><InputField label="Annual Appreciation" name="annualAppreciation" value={form.annualAppreciation} onChange={hc} type="number" suffix="%"/><InputField label="Cap Rate (optional)" name="capRate" value={form.capRate} onChange={hc} type="number" suffix="%"/></div>
        <SectionLabel>Alternative Investment</SectionLabel>
        <SelectField label="If you sell, where would you invest?" name="alternativeInvestment" value={form.alternativeInvestment} onChange={hc} options={[{value:'stock-market',label:'Stock Market (S&P 500)'},{value:'bonds',label:'Bonds / Fixed Income'},{value:'another-property',label:'Another Property (non-1031)'},{value:'mixed',label:'Mixed Portfolio'}]}/>
        <InputField label="Expected Annual Return" name="alternativeReturn" value={form.alternativeReturn} onChange={hc} type="number" suffix="%"/>
        <SectionLabel>Exit Strategy Interest</SectionLabel>
        <SelectField label="What are you considering?" name="exitStrategy" value={form.exitStrategy} onChange={hc} options={[{value:'undecided',label:"Not sure yet \u2014 show me the data"},{value:'hold',label:'Leaning toward holding'},{value:'sell',label:'Leaning toward selling'},{value:'1031',label:'Interested in 1031 Exchange'}]}/>
        {form.exitStrategy==='1031'&&(<><SectionLabel>1031 Exchange \u2014 Replacement Property</SectionLabel><InputField label="Replacement Property Value" name="replacementValue" value={form.replacementValue} onChange={hc} type="number" prefix="$"/><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><InputField label="Expected Annual Rent" name="replacementRent" value={form.replacementRent} onChange={hc} type="number" prefix="$"/><InputField label="Expected Annual Expenses" name="replacementExpenses" value={form.replacementExpenses} onChange={hc} type="number" prefix="$"/></div></>)}
      </>)}
      {step===4&&(<><SectionLabel>Review Your Inputs</SectionLabel>
        <div style={{fontSize:14,color:'var(--text-secondary)',lineHeight:2}}>
          <p><strong style={{color:'var(--gold)'}}>Property:</strong> {form.propertyType} in {form.location||'\u2014'}</p><p><strong style={{color:'var(--gold)'}}>Purchase Price:</strong> {fmt(form.purchasePrice)}</p><p><strong style={{color:'var(--gold)'}}>Current Value:</strong> {fmt(form.currentValue)}</p><p><strong style={{color:'var(--gold)'}}>Annual Rent:</strong> {fmt(form.annualRent)}</p><p><strong style={{color:'var(--gold)'}}>Annual Expenses:</strong> {fmt(form.annualExpenses)}</p><p><strong style={{color:'var(--gold)'}}>Mortgage:</strong> {fmt(form.mortgageBalance)} @ {form.mortgageRate||0}%</p><p><strong style={{color:'var(--gold)'}}>Appreciation:</strong> {form.annualAppreciation}%/yr</p><p><strong style={{color:'var(--gold)'}}>Alt. Return:</strong> {form.alternativeReturn}%</p><p><strong style={{color:'var(--gold)'}}>Strategy:</strong> {form.exitStrategy}</p>
        </div>
        <div style={{marginTop:20,padding:12,borderRadius:8,background:'var(--bg-subtle)',border:'1px solid var(--border-accent)',fontSize:13,color:'var(--text-muted)'}}>Click "Analyze" to run your Hold vs. Sell{form.exitStrategy==='1031'?' vs. 1031 Exchange':''} comparison.</div>
      </>)}
      <div style={{display:'flex',justifyContent:'space-between',marginTop:28}}>
        {step>1?<button onClick={prev} style={{padding:'10px 24px',borderRadius:8,border:'1px solid var(--border-primary)',background:'transparent',color:'var(--text-muted)',fontSize:14,cursor:'pointer'}}>&larr; Back</button>:<div/>}
        {step<totalSteps?<button onClick={next} style={{padding:'10px 28px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer'}}>Continue &rarr;</button>:<button onClick={submit} style={{padding:'12px 36px',borderRadius:8,border:'none',background:'var(--gold)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',letterSpacing:'0.05em'}}>Analyze &rarr;</button>}
      </div>
    </Card>
  </div>);
};

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
const Dashboard=({formData,sellResult,exchangeResult,onEditAssumptions,dark,isPro,onProClick})=>{
  const show1031=!!exchangeResult;
  const[sens,setSens]=useState({vacancyRate:parseFloat(formData.vacancyRate)||10,appreciation:parseFloat(formData.annualAppreciation)||3,altReturn:parseFloat(formData.alternativeReturn)||7,yearsToHold:10});
  const results=useMemo(()=>{const a={...formData,annualAppreciation:sens.appreciation/100,vacancyRate:sens.vacancyRate};const h=calculateHoldScenario(a,sens.yearsToHold);const s=calculateSellScenario(a,sens.yearsToHold,sens.altReturn/100);const x=show1031?calculate1031Scenario(a,sens.yearsToHold):null;return{hold:h,sell:s,exch:x};},[formData,sens,show1031]);
  const{hold,sell,exch}=results;
  const rec=useMemo(()=>{const hW=hold.totalWealth,sW=sell.totalWealthAtEnd,xW=exch?.totalWealth||0;if(show1031&&xW>hW&&xW>sW)return{text:'1031 Exchange',color:'var(--purple)'};if(hW>sW)return{text:'Hold Property',color:'var(--accent)'};return{text:'Sell & Invest',color:'var(--blue)'};},[hold,sell,exch,show1031]);

  const chartData=useMemo(()=>{const d=[];for(let y=0;y<=sens.yearsToHold;y++){const p={year:y};if(y===0){p.hold=parseFloat(formData.currentValue)-parseFloat(formData.mortgageBalance||0);p.sell=sell.netProceeds;if(show1031)p.exchange=exch.equityTransferred;}else{p.hold=(hold.yearlyData[y-1]?.equity||0)+(hold.yearlyData[y-1]?.cumulativeCashFlow||0);p.sell=sell.yearlyData[y-1]?.investedValue;if(show1031)p.exchange=(exch.yearlyData[y-1]?.equity||0)+(exch.yearlyData[y-1]?.cumulativeCashFlow||0);}d.push(p);}return d;},[hold,sell,exch,sens.yearsToHold,formData,show1031]);

  const cashFlowData=useMemo(()=>hold.yearlyData.map(d=>({year:`Yr ${d.year}`,revenue:d.effectiveRent,expenses:-(d.opExpenses+d.maintenance),debtService:-d.debtService})),[hold]);
  const expensePieData=useMemo(()=>{const y=hold.yearlyData[0]||{};return[{name:'Operating',value:y.opExpenses||0,color:'#3B82F6'},{name:'Maintenance',value:y.maintenance||0,color:'#9A7820'},{name:'Debt Service',value:y.debtService||0,color:dark?'#EF4444':'#DC2626'}].filter(d=>d.value>0);},[hold,dark]);
  const CustomTooltip=useCallback(({active,payload,label})=>{if(!active||!payload)return null;return(<div style={{background:'var(--tooltip-bg)',border:'1px solid var(--tooltip-border)',borderRadius:8,padding:12,fontSize:12,boxShadow:'0 8px 24px rgba(0,0,0,0.4)'}}><p style={{color:'var(--gold)',fontWeight:700,marginBottom:6}}>Year {label}</p>{payload.map((p,i)=><p key={i} style={{color:p.color,margin:'2px 0'}}>{p.name}: {fmt(p.value)}</p>)}</div>);},[]);

  const aH=dark?'#1A9070':'#167A5E',bH='#3B82F6',pH='#8B5CF6',rH=dark?'#EF4444':'#DC2626',gH='#9A7820',grH=dark?'rgba(255,255,255,0.06)':'#E8E8E8',mH=dark?'#94A3B8':'#6B7280';

  return(<div style={{maxWidth:1200,margin:'0 auto',padding:'24px 20px'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
      <div style={{fontSize:13,color:'var(--text-muted)'}}>{formData.propertyType} in {formData.location}</div>
      <div style={{display:'flex',gap:8}}>
        {!isPro&&<button onClick={onProClick} style={{padding:'8px 16px',borderRadius:8,border:'none',background:'var(--gold)',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>&star; Unlock Pro</button>}
        <button onClick={onEditAssumptions} style={{padding:'8px 18px',borderRadius:8,border:'1px solid var(--border-primary)',background:'transparent',color:'var(--text-muted)',fontSize:13,cursor:'pointer'}}>&larr; Edit</button>
      </div>
    </div>

    {/* Metric cards */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:16,marginBottom:32}}>
      <Card><SectionLabel>Hold Equity + Cash Flow</SectionLabel><div style={{fontSize:28,fontWeight:700,color:'var(--accent)'}}>{fmtK(hold.totalWealth)}</div><p style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>{sens.yearsToHold}-year total wealth</p></Card>
      <Card><SectionLabel>Sell &amp; Invest Value</SectionLabel><div style={{fontSize:28,fontWeight:700,color:'var(--blue)'}}>{fmtK(sell.totalWealthAtEnd)}</div><p style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>Net proceeds at {sens.altReturn}%</p></Card>
      {show1031&&<Card><SectionLabel>1031 Exchange</SectionLabel><div style={{fontSize:28,fontWeight:700,color:'var(--purple)'}}>{fmtK(exch.totalWealth)}</div><p style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>Tax-deferred: {fmtK(exch.taxDeferred)}</p></Card>}
      <Card style={{background:'var(--bg-subtle)',border:'1px solid var(--border-accent)'}}><SectionLabel>Recommendation</SectionLabel><div style={{fontSize:24,fontWeight:700,color:rec.color}}>{rec.text}</div><p style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>Advantage: {fmtK(Math.abs(hold.totalWealth-sell.totalWealthAtEnd))}</p></Card>
    </div>

    {/* Charts + Sliders */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:24}}>
      <div>
        <Card style={{marginBottom:24}}><SectionLabel>Cumulative Wealth Comparison</SectionLabel><ResponsiveContainer width="100%" height={320}><LineChart data={chartData} margin={{top:10,right:10,left:10,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke={grH}/><XAxis dataKey="year" stroke={mH} fontSize={12}/><YAxis stroke={mH} fontSize={11} tickFormatter={fmtK}/><Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:12}}/><Line type="monotone" dataKey="hold" name="Hold" stroke={aH} strokeWidth={3} dot={false}/><Line type="monotone" dataKey="sell" name="Sell & Invest" stroke={bH} strokeWidth={3} dot={false}/>{show1031&&<Line type="monotone" dataKey="exchange" name="1031 Exchange" stroke={pH} strokeWidth={3} dot={false}/>}</LineChart></ResponsiveContainer></Card>

        <Card style={{marginBottom:24}}><SectionLabel>Annual Cash Flow Breakdown</SectionLabel><ResponsiveContainer width="100%" height={280}><BarChart data={cashFlowData} margin={{top:10,right:10,left:10,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke={grH}/><XAxis dataKey="year" stroke={mH} fontSize={11}/><YAxis stroke={mH} fontSize={11} tickFormatter={fmtK}/><Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:12}}/><Bar dataKey="revenue" name="Revenue" fill={aH} radius={[4,4,0,0]}/><Bar dataKey="expenses" name="Expenses" fill={rH} radius={[4,4,0,0]}/><Bar dataKey="debtService" name="Debt Service" fill={gH} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></Card>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <Card><SectionLabel>Year 1 Expense Split</SectionLabel><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={expensePieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>{expensePieData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip formatter={v=>fmt(v)}/></PieChart></ResponsiveContainer></Card>
          <Card><SectionLabel>Sale Proceeds Breakdown</SectionLabel><div style={{fontSize:13,lineHeight:2.2,color:'var(--text-secondary)'}}><div style={{display:'flex',justifyContent:'space-between'}}><span>Gross Equity</span><span>{fmt(sell.grossProceeds)}</span></div><div style={{display:'flex',justifyContent:'space-between',color:'var(--red)'}}><span>&minus; Selling Costs</span><span>{fmt(sell.sellingCosts)}</span></div><div style={{display:'flex',justifyContent:'space-between',color:'var(--red)'}}><span>&minus; Capital Gains Tax</span><span>{fmt(sell.capitalGainsTax)}</span></div><div style={{display:'flex',justifyContent:'space-between',borderTop:'1px solid var(--border-primary)',paddingTop:8,marginTop:8,fontWeight:700,color:'var(--accent)'}}><span>Net to Invest</span><span>{fmt(sell.netProceeds)}</span></div></div></Card>
        </div>
      </div>

      {/* Sliders */}
      <div><Card><SectionLabel>Sensitivity Sliders</SectionLabel><p style={{fontSize:12,color:'var(--text-muted)',marginBottom:20}}>Adjust assumptions &mdash; charts update in real time.</p>
        <Slider label="Vacancy Rate" min={0} max={100} step={1} value={sens.vacancyRate} displayValue={`${Math.round(sens.vacancyRate)}%`} onChange={e=>setSens({...sens,vacancyRate:e.target.value})}/>
        <Slider label="Appreciation" min={-5} max={15} step={1} value={sens.appreciation} displayValue={`${Math.round(sens.appreciation)}%`} onChange={e=>setSens({...sens,appreciation:e.target.value})}/>
        <Slider label="Alt. Return" min={0} max={15} step={1} value={sens.altReturn} displayValue={`${Math.round(sens.altReturn)}%`} onChange={e=>setSens({...sens,altReturn:e.target.value})}/>
        <Slider label="Years to Hold" min={1} max={30} step={1} value={sens.yearsToHold} displayValue={`${sens.yearsToHold} yrs`} suffix=" yrs" onChange={e=>setSens({...sens,yearsToHold:e.target.value})}/>
        {!isPro&&<div style={{marginTop:16,padding:12,borderRadius:8,background:'var(--gold-subtle)',border:'1px solid rgba(154,120,32,0.3)',fontSize:12,color:'var(--text-muted)',textAlign:'center'}}><strong style={{color:'var(--gold)'}}>&star; Pro</strong> unlocks additional sliders, PDF export, and more.<br/><button onClick={onProClick} style={{marginTop:8,padding:'6px 16px',borderRadius:6,border:'none',background:'var(--gold)',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>Unlock Pro</button></div>}
      </Card></div>
    </div>

    {/* Table */}
    <Card style={{marginTop:24,overflowX:'auto'}}><SectionLabel>Year-by-Year Comparison</SectionLabel>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr style={{borderBottom:'1px solid var(--border-primary)'}}>{['Year','Prop. Value','Hold Equity','Cash Flow','Hold Total','Sell Invested',show1031&&'1031 Total'].filter(Boolean).map(h=><th key={h} style={{padding:'10px 8px',textAlign:'right',color:'var(--gold)',fontWeight:700,fontSize:10,textTransform:'uppercase',fontFamily:"'JetBrains Mono',monospace"}}>{h}</th>)}</tr></thead>
      <tbody>{hold.yearlyData.map((d,i)=><tr key={i} style={{borderBottom:'1px solid var(--border-primary)'}}><td style={{padding:8,color:'var(--text-muted)'}}>{d.year}</td><td style={{padding:8,textAlign:'right',color:'var(--text-secondary)'}}>{fmtK(d.propertyValue)}</td><td style={{padding:8,textAlign:'right',color:'var(--accent)'}}>{fmtK(d.equity)}</td><td style={{padding:8,textAlign:'right',color:d.netCashFlow>=0?'var(--green)':'var(--red)'}}>{fmtK(d.netCashFlow)}</td><td style={{padding:8,textAlign:'right',color:'var(--accent)',fontWeight:600}}>{fmtK(d.equity+d.cumulativeCashFlow)}</td><td style={{padding:8,textAlign:'right',color:'var(--blue)'}}>{fmtK(sell.yearlyData[i]?.investedValue)}</td>{show1031&&<td style={{padding:8,textAlign:'right',color:'var(--purple)'}}>{fmtK((exch.yearlyData[i]?.equity||0)+(exch.yearlyData[i]?.cumulativeCashFlow||0))}</td>}</tr>)}</tbody></table>
    </Card>
  </div>);
};

// ═══════════════════════════════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════════════════════════════
const LandingPage=({dark,setDark,onOpenCalc,onProClick,isPro,calcRef,featRef,proRef})=>{
  const features=[
    {icon:'\uD83D\uDCCA',title:'Hold vs. Sell vs. 1031',desc:'Three-scenario modeling with 10-year projections. See cumulative wealth, cash flow, and equity side by side.'},
    {icon:'\uD83C\uDFE6',title:'Full Financial Engine',desc:'Mortgage P&I, depreciation, capital gains tax, depreciation recapture, vacancy, maintenance reserves — all calculated automatically.'},
    {icon:'\u2699\uFE0F',title:'Sensitivity Sliders',desc:'Drag to stress-test. Adjust appreciation, vacancy, alternative returns, and time horizon. Charts update in real time.'},
    {icon:'\uD83C\uDFAF',title:'Smart Recommendation',desc:'Data-driven hold/sell/1031 recommendation that shifts dynamically as you adjust assumptions.'},
    {icon:'\uD83D\uDCC8',title:'Interactive Charts',desc:'Cumulative wealth line chart, cash flow bar chart, expense pie chart, and year-by-year comparison table.'},
    {icon:'\u26A1',title:'No Account Required',desc:'Standard features work instantly. No login, no signup. Everything runs in your browser.'},
  ];

  const proFeatures=[
    ['Core Calculator','Hold vs. Sell vs. 1031 analysis',true,true],
    ['Sensitivity Sliders (4 core)',true,true],
    ['Recharts Visualizations',true,true],
    ['Year-by-Year Table',true,true],
    ['Smart Recommendation',true,true],
    ['Additional Sensitivity Controls',false,true],
    ['Maintenance Forecasting',false,true],
    ['PDF Export',false,true],
    ['Saved Scenarios',false,true],
    ['Priority Support',false,true],
  ];

  return(<div>
    {/* HERO */}
    <div style={{textAlign:'center',padding:'80px 24px 60px',maxWidth:800,margin:'0 auto'}}>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--gold)',marginBottom:16}}>Vacation Home Group &middot; STR Investment Tool</div>
      <h1 style={{fontSize:42,fontWeight:800,lineHeight:1.15,color:'var(--text-primary)',marginBottom:20,fontFamily:"'Playfair Display',Georgia,serif"}}>Should you hold, sell, or 1031 exchange your vacation rental?</h1>
      <p style={{fontSize:18,color:'var(--text-muted)',lineHeight:1.7,maxWidth:600,margin:'0 auto 32px'}}>Model cash flow, equity, and returns across three scenarios. Real numbers before you make a decision.</p>
      <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
        <button onClick={onOpenCalc} style={{padding:'14px 32px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',fontSize:16,fontWeight:700,cursor:'pointer'}}>Open Calculator &rarr;</button>
        <button onClick={()=>featRef.current?.scrollIntoView({behavior:'smooth'})} style={{padding:'14px 32px',borderRadius:8,border:'1px solid var(--border-primary)',background:'transparent',color:'var(--text-muted)',fontSize:16,cursor:'pointer'}}>See All Features</button>
      </div>
      {/* Stats bar */}
      <div style={{display:'flex',justifyContent:'center',gap:40,marginTop:48,flexWrap:'wrap'}}>
        {[['3','Scenario Models'],['10yr','Cash Flow Projection'],['6','Sensitivity Sliders'],['\u221E','Properties']].map(([v,l],i)=>(
          <div key={i} style={{textAlign:'center'}}><div style={{fontSize:28,fontWeight:800,color:'var(--accent)'}}>{v}</div><div style={{fontSize:12,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{l}</div></div>
        ))}
      </div>
    </div>

    {/* FEATURES */}
    <div ref={featRef} style={{maxWidth:1000,margin:'0 auto',padding:'60px 24px'}} id="features">
      <div style={{textAlign:'center',marginBottom:40}}>
        <SectionLabel>What's included</SectionLabel>
        <h2 style={{fontSize:28,fontWeight:700,color:'var(--text-primary)',marginTop:8}}>Everything you need to evaluate an STR investment decision</h2>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:24}}>
        {features.map((f,i)=>(<Card key={i}><div style={{fontSize:28,marginBottom:12}}>{f.icon}</div><h3 style={{fontSize:16,fontWeight:700,color:'var(--text-primary)',marginBottom:8}}>{f.title}</h3><p style={{fontSize:14,color:'var(--text-muted)',lineHeight:1.6}}>{f.desc}</p></Card>))}
      </div>
    </div>

    {/* CALCULATOR SECTION */}
    <div ref={calcRef} style={{padding:'60px 0',background:'var(--bg-tertiary)'}} id="calculator">
      <div style={{textAlign:'center',marginBottom:24}}>
        <SectionLabel>Start analyzing your deal</SectionLabel>
        <h2 style={{fontSize:28,fontWeight:700,color:'var(--text-primary)',marginTop:8}}>Fill in the property details below</h2>
      </div>
      {/* The calculator is embedded by the parent */}
    </div>

    {/* HOW IT WORKS */}
    <div style={{maxWidth:800,margin:'0 auto',padding:'60px 24px'}}>
      <div style={{textAlign:'center',marginBottom:40}}><SectionLabel>Simple Process</SectionLabel><h2 style={{fontSize:28,fontWeight:700,color:'var(--text-primary)',marginTop:8}}>From property details to decision in 5 minutes</h2></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:24}}>
        {[['1','Enter Property Info','Address, beds, price, and financing. Takes 2 minutes.'],['2','Set Assumptions','Market appreciation, vacancy, alternative returns.'],['3','Review & Analyze','Run the analysis. Dashboard updates instantly.'],['4','Read Your Recommendation','Hold, sell, or 1031 — backed by data. Adjust sliders to stress-test.']].map(([n,t,d],i)=>(
          <div key={i} style={{textAlign:'center'}}><div style={{width:40,height:40,borderRadius:'50%',background:'var(--accent)',color:'#fff',fontSize:18,fontWeight:700,display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:12}}>{n}</div><h3 style={{fontSize:15,fontWeight:700,color:'var(--text-primary)',marginBottom:6}}>{t}</h3><p style={{fontSize:13,color:'var(--text-muted)',lineHeight:1.6}}>{d}</p></div>
        ))}
      </div>
    </div>

    {/* STANDARD vs PRO */}
    <div ref={proRef} style={{maxWidth:700,margin:'0 auto',padding:'60px 24px'}} id="pro">
      <div style={{textAlign:'center',marginBottom:32}}><SectionLabel>Pricing</SectionLabel><h2 style={{fontSize:28,fontWeight:700,color:'var(--text-primary)',marginTop:8}}>Standard vs Pro</h2><p style={{fontSize:14,color:'var(--text-muted)',marginTop:8}}>Pro is available at <strong>no charge</strong> to Vacation Home Group clients. Share your contact info to unlock.</p></div>
      <Card>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead><tr style={{borderBottom:'2px solid var(--border-primary)'}}><th style={{textAlign:'left',padding:'12px 8px',color:'var(--text-primary)'}}>Feature</th><th style={{textAlign:'center',padding:'12px 8px',color:'var(--text-primary)'}}>Standard</th><th style={{textAlign:'center',padding:'12px 8px',color:'var(--gold)',fontWeight:700}}>&star; Pro</th></tr></thead>
          <tbody>{proFeatures.map(([name,std,pro],i)=>{const isStr=typeof std==='string';return(<tr key={i} style={{borderBottom:'1px solid var(--border-primary)'}}><td style={{padding:'10px 8px',color:'var(--text-secondary)'}}>{isStr?<strong style={{color:'var(--gold)',fontSize:11,textTransform:'uppercase',letterSpacing:'0.1em'}}>{name}</strong>:name}</td><td style={{textAlign:'center',padding:'10px 8px',color:std===true?'var(--green)':std===false?'var(--text-dim)':'var(--text-secondary)'}}>{isStr?'':std?'\u2713':'\u2014'}</td><td style={{textAlign:'center',padding:'10px 8px',color:pro===true?'var(--green)':'var(--text-secondary)'}}>{typeof pro==='boolean'?(pro?'\u2713':'\u2014'):pro}</td></tr>);})}</tbody>
        </table>
        <div style={{textAlign:'center',marginTop:24}}>
          {isPro?<div style={{color:'var(--accent)',fontWeight:700,fontSize:14}}>&star; Pro Active</div>:<button onClick={onProClick} style={{padding:'12px 32px',borderRadius:8,border:'none',background:'var(--gold)',color:'#fff',fontSize:16,fontWeight:700,cursor:'pointer'}}>Unlock Pro Access &rarr;</button>}
        </div>
      </Card>
    </div>
  </div>);
};

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
function App(){
  const[dark,setDark]=useState(()=>{try{const s=localStorage.getItem('vhg-theme');return s?s==='dark':true;}catch(_e){return true;}});
  useEffect(()=>{try{localStorage.setItem('vhg-theme',dark?'dark':'light');}catch(_e){}},[dark]);

  const[view,setView]=useState('landing'); // landing | questionnaire | dashboard
  const[formData,setFormData]=useState(null);
  const[holdResult,setHoldResult]=useState(null);
  const[sellResult,setSellResult]=useState(null);
  const[exchangeResult,setExchangeResult]=useState(null);
  const[isPro,setIsPro]=useState(false);
  const[showProGate,setShowProGate]=useState(false);
  const[proUser,setProUser]=useState(null);

  const calcRef=useRef(null);const featRef=useRef(null);const proRef=useRef(null);

  const handleNav=(target)=>{
    if(target==='landing'){setView('landing');window.scrollTo({top:0,behavior:'smooth'});}
    else if(target==='calculator'){if(view==='landing'){setView('questionnaire');setTimeout(()=>calcRef.current?.scrollIntoView({behavior:'smooth'}),100);}else{setView('questionnaire');}}
    else if(target==='features'){if(view!=='landing')setView('landing');setTimeout(()=>featRef.current?.scrollIntoView({behavior:'smooth'}),100);}
    else if(target==='pro'){if(view!=='landing')setView('landing');setTimeout(()=>proRef.current?.scrollIntoView({behavior:'smooth'}),100);}
  };

  const handleAnalyze=useCallback((data)=>{
    const n={...data,vacancyRate:parseFloat(data.vacancyRate)||10,mortgageRate:(parseFloat(data.mortgageRate)||0)/100,annualAppreciation:(parseFloat(data.annualAppreciation)||3)/100,alternativeReturn:(parseFloat(data.alternativeReturn)||7)/100};
    setFormData(n);setHoldResult(calculateHoldScenario(n,10));setSellResult(calculateSellScenario(n,10,n.alternativeReturn));setExchangeResult(data.exitStrategy==='1031'?calculate1031Scenario(n,10):null);setView('dashboard');window.scrollTo({top:0,behavior:'smooth'});
  },[]);

  const handleProUnlock=(user)=>{setProUser(user);setIsPro(true);setShowProGate(false);};

  const themeVars=dark?darkVars:lightVars;

  return(
    <div style={{...themeVars,background:'var(--bg-primary)',color:'var(--text-primary)',minHeight:'100vh',fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <NavBar dark={dark} setDark={setDark} onNav={handleNav}/>

      {view==='landing'&&(
        <LandingPage dark={dark} setDark={setDark} isPro={isPro}
          onOpenCalc={()=>setView('questionnaire')}
          onProClick={()=>setShowProGate(true)}
          calcRef={calcRef} featRef={featRef} proRef={proRef}/>
      )}

      {view==='questionnaire'&&(
        <div ref={calcRef}>
          <Questionnaire onComplete={handleAnalyze} initialData={formData}/>
        </div>
      )}

      {view==='dashboard'&&holdResult&&sellResult&&(
        <Dashboard formData={formData} holdResult={holdResult} sellResult={sellResult}
          exchangeResult={exchangeResult} onEditAssumptions={()=>setView('questionnaire')}
          dark={dark} isPro={isPro} onProClick={()=>setShowProGate(true)}/>
      )}

      <VHGFooter dark={dark}/>

      {showProGate&&<ProGate onUnlock={handleProUnlock} onClose={()=>setShowProGate(false)}/>}
    </div>
  );
}

export default App;
