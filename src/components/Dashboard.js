import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line,
} from 'recharts';
import { Card, SectionLabel, Slider, TabBar, ChartTooltip, InputField, SelectField } from './UI';
import { calculateHoldScenario, calculateSellScenario, calculate1031Scenario, calculateTaxBenefits, calculateMortgageScenario, fmt, fmtK } from '../utils/calculations';
import { chartColors } from '../utils/theme';

export default function Dashboard({formData, sellResult, exchangeResult, onEditAssumptions, dark, isPro, onProClick}) {
  const show1031 = !!exchangeResult;
  const colors = chartColors(dark);

  const [activeTab, setActiveTab] = useState('overview');
  const [slidersOpen, setSlidersOpen] = useState(false);

  // Sensitivity
  const [sens, setSens] = useState({
    vacancyRate: parseFloat(formData.vacancyRate)||10,
    appreciation: parseFloat(formData.annualAppreciation)||3,
    altReturn: parseFloat(formData.alternativeReturn)||7,
    yearsToHold: 10,
  });

  // What-If Snapshots (Pro)
  const [snapshots, setSnapshots] = useState([]);
  const [snapName, setSnapName] = useState('');

  // Mortgage Scenarios (Pro)
  const [mortScenarios, setMortScenarios] = useState([
    {label:'Current',principal:parseFloat(formData.mortgageBalance)||0,rate:parseFloat(formData.mortgageRate)*100||6.5,term:parseInt(formData.mortgageYearsRemaining)||30},
    {label:'Refi Option',principal:parseFloat(formData.mortgageBalance)||0,rate:5.5,term:30},
  ]);

  // AI Summary
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState('claude');

  // ── Core calculations ──
  const results = useMemo(() => {
    const a = {...formData, annualAppreciation:sens.appreciation/100, vacancyRate:sens.vacancyRate};
    const hold = calculateHoldScenario(a, sens.yearsToHold);
    const sell = calculateSellScenario(a, sens.yearsToHold, sens.altReturn/100);
    const exch = show1031 ? calculate1031Scenario(a, sens.yearsToHold) : null;
    return {hold, sell, exch};
  }, [formData, sens, show1031]);
  const {hold, sell, exch} = results;

  const taxBenefits = useMemo(() => calculateTaxBenefits(formData, sens.yearsToHold), [formData, sens.yearsToHold]);

  const rec = useMemo(() => {
    const hW=hold.totalWealth, sW=sell.totalWealthAtEnd, xW=exch?.totalWealth||0;
    if(show1031&&xW>hW&&xW>sW) return {text:'1031 Exchange',color:'var(--purple)'};
    if(hW>sW) return {text:'Hold Property',color:'var(--accent)'};
    return {text:'Sell & Invest',color:'var(--blue)'};
  }, [hold, sell, exch, show1031]);

  // ── Chart data ──
  const wealthChart = useMemo(() => {
    const d = [];
    for(let y=0;y<=sens.yearsToHold;y++){
      const p={year:y};
      if(y===0){p.hold=parseFloat(formData.currentValue)-parseFloat(formData.mortgageBalance||0);p.sell=sell.netProceeds;if(show1031)p.exchange=exch.equityTransferred;}
      else{p.hold=(hold.yearlyData[y-1]?.equity||0)+(hold.yearlyData[y-1]?.cumulativeCashFlow||0);p.sell=sell.yearlyData[y-1]?.investedValue;if(show1031)p.exchange=(exch.yearlyData[y-1]?.equity||0)+(exch.yearlyData[y-1]?.cumulativeCashFlow||0);}
      d.push(p);
    } return d;
  }, [hold, sell, exch, sens.yearsToHold, formData, show1031]);

  const cashFlowChart = useMemo(() => hold.yearlyData.map(d => ({
    year:`Yr ${d.year}`,revenue:d.effectiveRent,expenses:-(d.opExpenses+d.maintenance),debtService:-d.debtService,net:d.netCashFlow
  })), [hold]);

  const equityChart = useMemo(() => hold.yearlyData.map(d => ({
    year:`Yr ${d.year}`,equity:d.equity,cashFlow:d.cumulativeCashFlow,
  })), [hold]);

  const expensePie = useMemo(() => {
    const y=hold.yearlyData[0]||{};
    return [{name:'Operating',value:y.opExpenses||0,color:colors.blue},{name:'Maintenance',value:y.maintenance||0,color:colors.gold},{name:'Debt Service',value:y.debtService||0,color:colors.red}].filter(d=>d.value>0);
  }, [hold, colors]);

  const radarData = useMemo(() => {
    const hW=hold.totalWealth,sW=sell.totalWealthAtEnd,xW=exch?.totalWealth||0;
    const maxW=Math.max(hW,sW,xW,1);
    const hCF=hold.totalCashFlow,xCF=exch?.yearlyData?.reduce((s,d)=>s+d.netCashFlow,0)||0;
    const maxCF=Math.max(Math.abs(hCF),Math.abs(xCF),1);
    return [
      {metric:'Wealth',hold:hW/maxW*100,sell:sW/maxW*100,...(show1031?{exchange:xW/maxW*100}:{})},
      {metric:'Cash Flow',hold:Math.max(0,hCF/maxCF*100),sell:0,...(show1031?{exchange:Math.max(0,xCF/maxCF*100)}:{})},
      {metric:'Tax Efficiency',hold:60,sell:30,...(show1031?{exchange:95}:{})},
      {metric:'Liquidity',hold:20,sell:95,...(show1031?{exchange:15}:{})},
      {metric:'Appreciation',hold:80,sell:50,...(show1031?{exchange:85}:{})},
    ];
  }, [hold, sell, exch, show1031]);

  // ── Handlers ──
  const saveSnapshot = () => {
    if(!snapName.trim()) return;
    setSnapshots([...snapshots,{name:snapName,sens:{...sens},timestamp:Date.now()}]);
    setSnapName('');
  };

  const generateAI = async () => {
    setAiLoading(true);
    const prompt = `You are a real estate investment analyst. Based on these numbers for a ${formData.propertyType} in ${formData.location}: Current Value: ${fmt(formData.currentValue)}, Purchase Price: ${fmt(formData.purchasePrice)}, Annual Rent: ${fmt(formData.annualRent)}, Expenses: ${fmt(formData.annualExpenses)}, Vacancy: ${sens.vacancyRate}%, Mortgage: ${fmt(formData.mortgageBalance)} at ${(parseFloat(formData.mortgageRate)*100).toFixed(1)}%, Hold ${sens.yearsToHold}yr Total: ${fmtK(hold.totalWealth)}, Sell & Invest: ${fmtK(sell.totalWealthAtEnd)}${show1031?`, 1031: ${fmtK(exch.totalWealth)}`:''}. Recommendation: ${rec.text}. Write 3-4 sentences. Be specific with numbers. End with the key risk.`;
    try {
      if (aiProvider === 'claude') {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:500,messages:[{role:'user',content:prompt}]}),
        });
        const data = await resp.json();
        setAiSummary(data.content?.[0]?.text || 'Unable to generate summary.');
      } else {
        setAiSummary('Gemini integration requires an API key. Configure in settings to enable free AI summaries.');
      }
    } catch(err) { setAiSummary('AI summary unavailable. Check your connection and try again.'); }
    setAiLoading(false);
  };

  // ═══════════════════════════════════════════════════════════
  // ASSUMPTIONS BAR — always visible, collapsible on mobile
  // ═══════════════════════════════════════════════════════════
  const AssumptionsBar = () => (
    <div style={{background:'var(--bg-card)',border:'1px solid var(--border-primary)',borderRadius:10,padding:slidersOpen?'16px 16px 8px':'12px 16px',marginBottom:16,transition:'padding 0.2s'}}>
      {/* Collapsed: summary row + toggle */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,cursor:'pointer'}} onClick={()=>setSlidersOpen(!slidersOpen)}>
        <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--gold)'}}>ASSUMPTIONS</span>
          <span style={{fontSize:12,color:'var(--text-muted)'}}>
            Vac {Math.round(sens.vacancyRate)}% &middot; App {Math.round(sens.appreciation)}% &middot; Alt {Math.round(sens.altReturn)}% &middot; {sens.yearsToHold}yr
          </span>
        </div>
        <button style={{background:'none',border:'1px solid var(--border-primary)',borderRadius:6,padding:'4px 10px',color:'var(--accent)',fontSize:11,fontWeight:700,cursor:'pointer',flexShrink:0}}>
          {slidersOpen ? 'Collapse \u25B2' : 'Tune \u25BC'}
        </button>
      </div>
      {/* Expanded: sliders */}
      {slidersOpen && (
        <div style={{marginTop:16,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:8}}>
          <Slider label="Vacancy" min={0} max={100} step={1} value={sens.vacancyRate} displayValue={`${Math.round(sens.vacancyRate)}%`} onChange={e=>setSens({...sens,vacancyRate:e.target.value})}/>
          <Slider label="Appreciation" min={-5} max={15} step={1} value={sens.appreciation} displayValue={`${Math.round(sens.appreciation)}%`} onChange={e=>setSens({...sens,appreciation:e.target.value})}/>
          <Slider label="Alt. Return" min={0} max={15} step={1} value={sens.altReturn} displayValue={`${Math.round(sens.altReturn)}%`} onChange={e=>setSens({...sens,altReturn:e.target.value})}/>
          <Slider label="Hold Period" min={1} max={30} step={1} value={sens.yearsToHold} displayValue={`${sens.yearsToHold} yrs`} suffix=" yrs" onChange={e=>setSens({...sens,yearsToHold:e.target.value})}/>
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // TAB: OVERVIEW — metric cards + wealth chart + radar
  // ═══════════════════════════════════════════════════════════
  const renderOverview = () => (
    <>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginBottom:20}}>
        <Card style={{padding:'16px 18px'}}><SectionLabel>Hold Total</SectionLabel><div style={{fontSize:22,fontWeight:700,color:'var(--accent)'}}>{fmtK(hold.totalWealth)}</div><p style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>{sens.yearsToHold}yr equity+cash</p></Card>
        <Card style={{padding:'16px 18px'}}><SectionLabel>Sell &amp; Invest</SectionLabel><div style={{fontSize:22,fontWeight:700,color:'var(--blue)'}}>{fmtK(sell.totalWealthAtEnd)}</div><p style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>At {sens.altReturn}% return</p></Card>
        {show1031&&<Card style={{padding:'16px 18px'}}><SectionLabel>1031 Exchange</SectionLabel><div style={{fontSize:22,fontWeight:700,color:'var(--purple)'}}>{fmtK(exch.totalWealth)}</div><p style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>Deferred: {fmtK(exch.taxDeferred)}</p></Card>}
        <Card style={{padding:'16px 18px',background:'var(--bg-subtle)',border:'1px solid var(--border-accent)'}}><SectionLabel>Recommendation</SectionLabel><div style={{fontSize:18,fontWeight:700,color:rec.color}}>{rec.text}</div><p style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>+{fmtK(Math.abs(hold.totalWealth-sell.totalWealthAtEnd))}</p></Card>
      </div>

      <Card style={{marginBottom:16}}>
        <SectionLabel>Cumulative Wealth</SectionLabel>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={wealthChart} margin={{top:10,right:10,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid}/>
            <XAxis dataKey="year" stroke={colors.muted} fontSize={11}/>
            <YAxis stroke={colors.muted} fontSize={10} tickFormatter={fmtK}/>
            <Tooltip content={<ChartTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Area type="monotone" dataKey="hold" name="Hold" stroke={colors.accent} fill={colors.accent} fillOpacity={0.15} strokeWidth={2}/>
            <Area type="monotone" dataKey="sell" name="Sell" stroke={colors.blue} fill={colors.blue} fillOpacity={0.1} strokeWidth={2}/>
            {show1031&&<Area type="monotone" dataKey="exchange" name="1031" stroke={colors.purple} fill={colors.purple} fillOpacity={0.1} strokeWidth={2}/>}
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <SectionLabel>Scenario Radar</SectionLabel>
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radarData}>
            <PolarGrid stroke={colors.grid}/>
            <PolarAngleAxis dataKey="metric" tick={{fontSize:10,fill:colors.muted}}/>
            <PolarRadiusAxis tick={false} axisLine={false}/>
            <Radar name="Hold" dataKey="hold" stroke={colors.accent} fill={colors.accent} fillOpacity={0.2}/>
            <Radar name="Sell" dataKey="sell" stroke={colors.blue} fill={colors.blue} fillOpacity={0.15}/>
            {show1031&&<Radar name="1031" dataKey="exchange" stroke={colors.purple} fill={colors.purple} fillOpacity={0.15}/>}
            <Legend wrapperStyle={{fontSize:11}}/>
          </RadarChart>
        </ResponsiveContainer>
      </Card>
    </>
  );

  // ═══════════════════════════════════════════════════════════
  // TAB: ANALYSIS — charts + table (merged)
  // ═══════════════════════════════════════════════════════════
  const renderAnalysis = () => (
    <>
      <Card style={{marginBottom:16}}>
        <SectionLabel>Cash Flow &amp; Net Income</SectionLabel>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={cashFlowChart} margin={{top:10,right:10,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid}/>
            <XAxis dataKey="year" stroke={colors.muted} fontSize={10}/>
            <YAxis stroke={colors.muted} fontSize={10} tickFormatter={fmtK}/>
            <Tooltip content={<ChartTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="revenue" name="Revenue" fill={colors.accent} radius={[3,3,0,0]}/>
            <Bar dataKey="expenses" name="Expenses" fill={colors.red} radius={[3,3,0,0]}/>
            <Bar dataKey="debtService" name="Debt" fill={colors.gold} radius={[3,3,0,0]}/>
            <Line type="monotone" dataKey="net" name="Net Cash" stroke={colors.orange} strokeWidth={2} dot={false}/>
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{marginBottom:16}}>
        <SectionLabel>Equity Growth</SectionLabel>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={equityChart} margin={{top:10,right:10,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid}/>
            <XAxis dataKey="year" stroke={colors.muted} fontSize={10}/>
            <YAxis stroke={colors.muted} fontSize={10} tickFormatter={fmtK}/>
            <Tooltip content={<ChartTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Area type="monotone" dataKey="equity" name="Property Equity" stackId="1" stroke={colors.accent} fill={colors.accent} fillOpacity={0.4}/>
            <Area type="monotone" dataKey="cashFlow" name="Cumulative Cash" stackId="1" stroke={colors.teal} fill={colors.teal} fillOpacity={0.3}/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:12,marginBottom:16}}>
        <Card>
          <SectionLabel>Year 1 Expenses</SectionLabel>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={expensePie} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>{expensePie.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip formatter={v=>fmt(v)}/></PieChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionLabel>Sale Proceeds</SectionLabel>
          <div style={{fontSize:13,lineHeight:2.2,color:'var(--text-secondary)'}}>
            <div style={{display:'flex',justifyContent:'space-between'}}><span>Gross Equity</span><span>{fmt(sell.grossProceeds)}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',color:'var(--red)'}}><span>&minus; Selling Costs</span><span>{fmt(sell.sellingCosts)}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',color:'var(--red)'}}><span>&minus; Capital Gains</span><span>{fmt(sell.capitalGainsTax)}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',borderTop:'1px solid var(--border-primary)',paddingTop:8,marginTop:8,fontWeight:700,color:'var(--accent)'}}><span>Net to Invest</span><span>{fmt(sell.netProceeds)}</span></div>
          </div>
        </Card>
      </div>

      {/* Year-by-Year Table — bottom of analysis */}
      <Card style={{overflowX:'auto'}}>
        <SectionLabel>Year-by-Year Comparison</SectionLabel>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,minWidth:480}}>
          <thead><tr style={{borderBottom:'1px solid var(--border-primary)'}}>
            {['Yr','Prop Value','Equity','Cash Flow','Hold Total','Sell Value',show1031&&'1031'].filter(Boolean).map(h=>
              <th key={h} style={{padding:'8px 4px',textAlign:'right',color:'var(--gold)',fontWeight:700,fontSize:9,textTransform:'uppercase',fontFamily:"'JetBrains Mono',monospace"}}>{h}</th>
            )}
          </tr></thead>
          <tbody>{hold.yearlyData.map((d,i)=>(
            <tr key={i} style={{borderBottom:'1px solid var(--border-primary)'}}>
              <td style={{padding:'5px 4px',color:'var(--text-muted)'}}>{d.year}</td>
              <td style={{padding:'5px 4px',textAlign:'right',color:'var(--text-secondary)'}}>{fmtK(d.propertyValue)}</td>
              <td style={{padding:'5px 4px',textAlign:'right',color:'var(--accent)'}}>{fmtK(d.equity)}</td>
              <td style={{padding:'5px 4px',textAlign:'right',color:d.netCashFlow>=0?'var(--green)':'var(--red)'}}>{fmtK(d.netCashFlow)}</td>
              <td style={{padding:'5px 4px',textAlign:'right',color:'var(--accent)',fontWeight:600}}>{fmtK(d.equity+d.cumulativeCashFlow)}</td>
              <td style={{padding:'5px 4px',textAlign:'right',color:'var(--blue)'}}>{fmtK(sell.yearlyData[i]?.investedValue)}</td>
              {show1031&&<td style={{padding:'5px 4px',textAlign:'right',color:'var(--purple)'}}>{fmtK((exch.yearlyData[i]?.equity||0)+(exch.yearlyData[i]?.cumulativeCashFlow||0))}</td>}
            </tr>
          ))}</tbody>
        </table>
      </Card>
    </>
  );

  // ═══════════════════════════════════════════════════════════
  // PRO TABS
  // ═══════════════════════════════════════════════════════════
  const renderTax = () => (
    <Card>
      <SectionLabel>Tax Benefits Calculator</SectionLabel>
      <p style={{fontSize:12,color:'var(--text-muted)',marginBottom:16}}>Straight-line depreciation vs. cost segregation study at your {(parseFloat(formData.taxBracket)*100).toFixed(0)}% bracket.</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
        <div style={{padding:14,borderRadius:8,background:'var(--bg-primary)',border:'1px solid var(--border-primary)'}}>
          <div style={{fontSize:10,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>Straight-Line</div>
          <div style={{fontSize:20,fontWeight:700,color:'var(--accent)'}}>{fmt(taxBenefits.annualStraightLine)}<span style={{fontSize:11,color:'var(--text-muted)'}}>/yr</span></div>
          <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>10yr savings: {fmt(taxBenefits.totalSLSavings10yr)}</div>
        </div>
        <div style={{padding:14,borderRadius:8,background:'var(--bg-primary)',border:'1px solid var(--gold-subtle)'}}>
          <div style={{fontSize:10,color:'var(--gold)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>Cost Segregation</div>
          <div style={{fontSize:20,fontWeight:700,color:'var(--gold)'}}>{fmt(taxBenefits.costSegYear1Bonus)}<span style={{fontSize:11,color:'var(--text-muted)'}}> yr1</span></div>
          <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>10yr savings: {fmt(taxBenefits.totalCSSavings10yr)}</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={taxBenefits.yearlyData.slice(0,Math.min(sens.yearsToHold,10))} margin={{top:10,right:10,left:0,bottom:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid}/>
          <XAxis dataKey="year" stroke={colors.muted} fontSize={10}/>
          <YAxis stroke={colors.muted} fontSize={10} tickFormatter={fmtK}/>
          <Tooltip content={<ChartTooltip/>}/>
          <Legend wrapperStyle={{fontSize:11}}/>
          <Bar dataKey="slTaxSavings" name="SL Savings" fill={colors.accent} radius={[3,3,0,0]}/>
          <Bar dataKey="csTaxSavings" name="Cost Seg" fill={colors.gold} radius={[3,3,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
      <p style={{fontSize:10,color:'var(--text-faint)',marginTop:10}}>Basis: {fmt(taxBenefits.depreciableBasis)} (85% of purchase price). Consult a CPA.</p>
    </Card>
  );

  const renderMortgage = () => {
    const results = mortScenarios.map(s => ({...s, calc:calculateMortgageScenario(s.principal, s.rate, s.term)}));
    return (
      <Card>
        <SectionLabel>Mortgage Comparison</SectionLabel>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12,marginBottom:16}}>
          {results.map((s,i)=>(
            <div key={i} style={{padding:14,borderRadius:8,background:'var(--bg-primary)',border:'1px solid var(--border-primary)'}}>
              <div style={{fontSize:13,fontWeight:700,color:'var(--text-primary)',marginBottom:8}}>{s.label}</div>
              <InputField label="Principal" name="p" value={s.principal} onChange={e=>{const n=[...mortScenarios];n[i].principal=Number(e.target.value);setMortScenarios(n);}} type="number" prefix="$"/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <InputField label="Rate" name="r" value={s.rate} onChange={e=>{const n=[...mortScenarios];n[i].rate=Number(e.target.value);setMortScenarios(n);}} type="number" suffix="%"/>
                <InputField label="Term" name="t" value={s.term} onChange={e=>{const n=[...mortScenarios];n[i].term=Number(e.target.value);setMortScenarios(n);}} type="number" suffix="yrs"/>
              </div>
              <div style={{borderTop:'1px solid var(--border-primary)',paddingTop:8,marginTop:8}}>
                <div style={{fontSize:20,fontWeight:700,color:i===0?'var(--accent)':'var(--blue)'}}>{fmt(s.calc.monthlyPayment)}<span style={{fontSize:11,color:'var(--text-muted)'}}>/mo</span></div>
                <div style={{fontSize:11,color:'var(--text-muted)'}}>Total interest: {fmtK(s.calc.totalInterest)}</div>
              </div>
            </div>
          ))}
        </div>
        {results.length>=2&&results[0].calc.monthlyPayment>0&&(
          <div style={{padding:12,borderRadius:8,background:'var(--bg-subtle)',border:'1px solid var(--border-accent)',fontSize:13,color:'var(--text-secondary)'}}>
            <strong>{results[1].label}</strong> saves <strong style={{color:'var(--accent)'}}>{fmt(Math.abs(results[0].calc.monthlyPayment-results[1].calc.monthlyPayment))}/mo</strong> ({fmt(Math.abs(results[0].calc.totalInterest-results[1].calc.totalInterest))} total interest {results[1].calc.totalInterest<results[0].calc.totalInterest?'saved':'more'})
          </div>
        )}
      </Card>
    );
  };

  const renderSnapshots = () => (
    <Card>
      <SectionLabel>What-If Snapshots</SectionLabel>
      <p style={{fontSize:12,color:'var(--text-muted)',marginBottom:12}}>Save assumption sets to compare scenarios.</p>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        <input value={snapName} onChange={e=>setSnapName(e.target.value)} placeholder="Scenario name..." style={{flex:1,padding:'8px 12px',borderRadius:8,border:'1px solid var(--border-primary)',background:'var(--input-bg)',color:'var(--text-primary)',fontSize:13,outline:'none'}}/>
        <button onClick={saveSnapshot} disabled={!snapName.trim()} style={{padding:'8px 16px',borderRadius:8,border:'none',background:snapName.trim()?'var(--accent)':'var(--text-dim)',color:'#fff',fontSize:13,fontWeight:700,cursor:snapName.trim()?'pointer':'not-allowed'}}>Save</button>
      </div>
      {snapshots.length===0&&<p style={{fontSize:13,color:'var(--text-faint)',textAlign:'center',padding:16}}>No snapshots yet. Adjust sliders above and save.</p>}
      {snapshots.map((s,i)=>{
        const h=calculateHoldScenario({...formData,annualAppreciation:s.sens.appreciation/100,vacancyRate:s.sens.vacancyRate},s.sens.yearsToHold);
        const sv=calculateSellScenario({...formData,annualAppreciation:s.sens.appreciation/100,vacancyRate:s.sens.vacancyRate},s.sens.yearsToHold,s.sens.altReturn/100);
        return (
          <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:10,borderRadius:8,border:'1px solid var(--border-primary)',marginBottom:8,flexWrap:'wrap',gap:6}}>
            <div><div style={{fontSize:13,fontWeight:700,color:'var(--text-primary)'}}>{s.name}</div><div style={{fontSize:10,color:'var(--text-muted)'}}>Vac {s.sens.vacancyRate}% &middot; App {s.sens.appreciation}% &middot; Alt {s.sens.altReturn}% &middot; {s.sens.yearsToHold}yr</div></div>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <div style={{textAlign:'right'}}><div style={{fontSize:12,fontWeight:700,color:'var(--accent)'}}>{fmtK(h.totalWealth)}</div><div style={{fontSize:9,color:'var(--text-faint)'}}>Hold</div></div>
              <div style={{textAlign:'right'}}><div style={{fontSize:12,fontWeight:700,color:'var(--blue)'}}>{fmtK(sv.totalWealthAtEnd)}</div><div style={{fontSize:9,color:'var(--text-faint)'}}>Sell</div></div>
              <button onClick={()=>setSens({...s.sens})} style={{padding:'3px 8px',borderRadius:6,border:'1px solid var(--border-primary)',background:'transparent',color:'var(--accent)',fontSize:10,cursor:'pointer'}}>Load</button>
            </div>
          </div>
        );
      })}
    </Card>
  );

  const renderAI = () => (
    <Card>
      <SectionLabel>AI Investment Summary</SectionLabel>
      <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'flex-end',flexWrap:'wrap'}}>
        <div style={{minWidth:180}}><SelectField label="" name="provider" value={aiProvider} onChange={e=>setAiProvider(e.target.value)} options={[{value:'claude',label:'Claude (Anthropic)'},{value:'gemini',label:'Gemini (Free)'}]}/></div>
        <button onClick={generateAI} disabled={aiLoading} style={{padding:'10px 20px',borderRadius:8,border:'none',background:aiLoading?'var(--text-dim)':'var(--accent)',color:'#fff',fontSize:13,fontWeight:700,cursor:aiLoading?'wait':'pointer',marginBottom:16}}>
          {aiLoading?'Generating...':'Generate Summary'}
        </button>
      </div>
      {aiSummary ? (
        <div style={{padding:16,borderRadius:8,background:'var(--bg-primary)',border:'1px solid var(--border-accent)',fontSize:14,color:'var(--text-secondary)',lineHeight:1.8}}>{aiSummary}</div>
      ) : (
        <div style={{padding:20,textAlign:'center',color:'var(--text-faint)',fontSize:13}}>Click "Generate Summary" for an AI analysis of your scenarios.</div>
      )}
    </Card>
  );

  // ── Tab config ──
  const tabs = [
    {id:'overview',label:'Overview'},
    {id:'analysis',label:'Analysis'},
    ...(isPro ? [
      {id:'tax',label:'Tax'},
      {id:'mortgage',label:'Mortgage'},
      {id:'snapshots',label:'What-If'},
      {id:'ai',label:'AI'},
    ] : []),
  ];

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div style={{maxWidth:1100,margin:'0 auto',padding:'16px 12px'}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
        <div style={{fontSize:13,color:'var(--text-muted)'}}>{formData.propertyType} &middot; {formData.location}</div>
        <div style={{display:'flex',gap:6}}>
          {!isPro&&<button onClick={onProClick} style={{padding:'5px 12px',borderRadius:6,border:'none',background:'var(--gold)',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>&star; Pro</button>}
          <button onClick={onEditAssumptions} style={{padding:'5px 12px',borderRadius:6,border:'1px solid var(--border-primary)',background:'transparent',color:'var(--text-muted)',fontSize:11,cursor:'pointer'}}>&larr; Edit</button>
        </div>
      </div>

      {/* Assumptions Bar — always visible */}
      <AssumptionsBar/>

      {/* Tabs */}
      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab}/>

      {/* Pro upsell for non-pro users */}
      {!isPro && (activeTab==='overview'||activeTab==='analysis') && (
        <div style={{marginBottom:12,padding:'8px 14px',borderRadius:8,background:'var(--gold-subtle)',border:'1px solid rgba(154,120,32,0.2)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
          <span style={{fontSize:12,color:'var(--text-muted)'}}><strong style={{color:'var(--gold)'}}>&star; Pro</strong> adds Tax Benefits, Mortgage Comparison, What-If Snapshots, and AI Summary.</span>
          <button onClick={onProClick} style={{padding:'4px 12px',borderRadius:6,border:'none',background:'var(--gold)',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>Unlock</button>
        </div>
      )}

      {/* Content */}
      {activeTab==='overview'&&renderOverview()}
      {activeTab==='analysis'&&renderAnalysis()}
      {activeTab==='tax'&&isPro&&renderTax()}
      {activeTab==='mortgage'&&isPro&&renderMortgage()}
      {activeTab==='snapshots'&&isPro&&renderSnapshots()}
      {activeTab==='ai'&&isPro&&renderAI()}
    </div>
  );
}
