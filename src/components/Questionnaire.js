import React, { useState } from 'react';
import { Card, SectionLabel, InputField, SelectField } from './UI';
import { fmt } from '../utils/calculations';

const defaultForm = {
  propertyType:'single-family',location:'',purchasePrice:'',currentValue:'',yearsOwned:'',
  managementStyle:'self-managed',annualRent:'',annualExpenses:'',vacancyRate:'10',
  mortgageBalance:'',mortgageRate:'',mortgageYearsRemaining:'',roofAge:'5',hvacAge:'5',
  waterHeaterAge:'3',capRate:'',annualAppreciation:'3',alternativeInvestment:'stock-market',
  alternativeReturn:'7',exitStrategy:'undecided',replacementValue:'',replacementRent:'',
  replacementExpenses:'',taxBracket:'32',
};

export default function Questionnaire({onComplete, initialData}) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [form, setForm] = useState(initialData || defaultForm);
  const [errors, setErrors] = useState({});
  const hc = e => {setForm({...form,[e.target.name]:e.target.value}); if(errors[e.target.name]) setErrors({...errors,[e.target.name]:null});};

  const validate = () => {
    const e = {};
    if(step===1){if(!form.location)e.location='Required';if(!form.purchasePrice||form.purchasePrice<=0)e.purchasePrice='Required';if(!form.currentValue||form.currentValue<=0)e.currentValue='Required';if(!form.annualRent||form.annualRent<=0)e.annualRent='Required';}
    if(step===2){if(!form.annualExpenses&&form.annualExpenses!=='0')e.annualExpenses='Required';}
    setErrors(e); return Object.keys(e).length===0;
  };
  const next=()=>{if(validate())setStep(s=>Math.min(s+1,totalSteps));};
  const prev=()=>setStep(s=>Math.max(s-1,1));
  const submit=()=>{if(validate())onComplete(form);};

  return (
    <div style={{maxWidth:640,margin:'0 auto',padding:'40px 20px'}}>
      {/* Progress */}
      <div style={{marginBottom:32}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
          {['Property','Financials','Market','Review'].map((l,i)=>(
            <div key={i} style={{fontSize:11,fontWeight:step>i?700:500,color:step>i?'var(--accent)':step===i+1?'var(--gold)':'var(--text-muted)',letterSpacing:'0.05em',textTransform:'uppercase',fontFamily:"'JetBrains Mono',monospace"}}>{l}</div>
          ))}
        </div>
        <div style={{height:3,background:'var(--border-primary)',borderRadius:2}}>
          <div style={{height:'100%',width:`${(step/totalSteps)*100}%`,background:'linear-gradient(90deg,var(--accent),var(--gold))',borderRadius:2,transition:'width 0.3s'}}/>
        </div>
      </div>

      <Card>
        {step===1&&(<>
          <SectionLabel>Property &amp; Portfolio</SectionLabel>
          <SelectField label="Property Type" name="propertyType" value={form.propertyType} onChange={hc} options={[{value:'single-family',label:'Single Family'},{value:'condo',label:'Condo / Townhome'},{value:'multi-family',label:'Multi-Family'},{value:'cabin',label:'Cabin / Vacation Home'}]}/>
          <InputField label="Location (City, State)" name="location" value={form.location} onChange={hc} placeholder="e.g. Lincoln, NH" error={errors.location}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <InputField label="Purchase Price" name="purchasePrice" value={form.purchasePrice} onChange={hc} type="number" prefix="$" error={errors.purchasePrice}/>
            <InputField label="Current Market Value" name="currentValue" value={form.currentValue} onChange={hc} type="number" prefix="$" error={errors.currentValue}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <InputField label="Years Owned" name="yearsOwned" value={form.yearsOwned} onChange={hc} type="number" suffix="yrs"/>
            <InputField label="Annual Gross Rent" name="annualRent" value={form.annualRent} onChange={hc} type="number" prefix="$" error={errors.annualRent}/>
          </div>
          <SelectField label="Management Style" name="managementStyle" value={form.managementStyle} onChange={hc} options={[{value:'self-managed',label:'Self-Managed'},{value:'property-manager',label:'Property Manager (20-25%)'},{value:'hybrid',label:'Hybrid'}]}/>
        </>)}

        {step===2&&(<>
          <SectionLabel>Financial Snapshot</SectionLabel>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <InputField label="Annual Operating Expenses" name="annualExpenses" value={form.annualExpenses} onChange={hc} type="number" prefix="$" error={errors.annualExpenses}/>
            <InputField label="Vacancy Rate" name="vacancyRate" value={form.vacancyRate} onChange={hc} type="number" suffix="%"/>
          </div>
          <SectionLabel>Mortgage Details</SectionLabel>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <InputField label="Mortgage Balance" name="mortgageBalance" value={form.mortgageBalance} onChange={hc} type="number" prefix="$"/>
            <InputField label="Interest Rate" name="mortgageRate" value={form.mortgageRate} onChange={hc} type="number" suffix="%"/>
          </div>
          <InputField label="Years Remaining" name="mortgageYearsRemaining" value={form.mortgageYearsRemaining} onChange={hc} type="number" suffix="yrs"/>
          <SectionLabel>Property Condition</SectionLabel>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
            <InputField label="Roof Age" name="roofAge" value={form.roofAge} onChange={hc} type="number" suffix="yrs"/>
            <InputField label="HVAC Age" name="hvacAge" value={form.hvacAge} onChange={hc} type="number" suffix="yrs"/>
            <InputField label="Water Heater" name="waterHeaterAge" value={form.waterHeaterAge} onChange={hc} type="number" suffix="yrs"/>
          </div>
          <SectionLabel>Tax Info</SectionLabel>
          <SelectField label="Federal Tax Bracket" name="taxBracket" value={form.taxBracket} onChange={hc} options={[{value:'10',label:'10%'},{value:'12',label:'12%'},{value:'22',label:'22%'},{value:'24',label:'24%'},{value:'32',label:'32%'},{value:'35',label:'35%'},{value:'37',label:'37%'}]}/>
        </>)}

        {step===3&&(<>
          <SectionLabel>Market Assumptions</SectionLabel>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <InputField label="Annual Appreciation" name="annualAppreciation" value={form.annualAppreciation} onChange={hc} type="number" suffix="%"/>
            <InputField label="Cap Rate (optional)" name="capRate" value={form.capRate} onChange={hc} type="number" suffix="%"/>
          </div>
          <SectionLabel>Alternative Investment</SectionLabel>
          <SelectField label="If you sell, where would you invest?" name="alternativeInvestment" value={form.alternativeInvestment} onChange={hc} options={[{value:'stock-market',label:'Stock Market (S&P 500)'},{value:'bonds',label:'Bonds / Fixed Income'},{value:'another-property',label:'Another Property (non-1031)'},{value:'mixed',label:'Mixed Portfolio'}]}/>
          <InputField label="Expected Annual Return" name="alternativeReturn" value={form.alternativeReturn} onChange={hc} type="number" suffix="%"/>
          <SectionLabel>Exit Strategy Interest</SectionLabel>
          <SelectField label="What are you considering?" name="exitStrategy" value={form.exitStrategy} onChange={hc} options={[{value:'undecided',label:"Not sure yet \u2014 show me the data"},{value:'hold',label:'Leaning toward holding'},{value:'sell',label:'Leaning toward selling'},{value:'1031',label:'Interested in 1031 Exchange'}]}/>
          {form.exitStrategy==='1031'&&(<>
            <SectionLabel>1031 Exchange \u2014 Replacement Property</SectionLabel>
            <InputField label="Replacement Property Value" name="replacementValue" value={form.replacementValue} onChange={hc} type="number" prefix="$"/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <InputField label="Expected Annual Rent" name="replacementRent" value={form.replacementRent} onChange={hc} type="number" prefix="$"/>
              <InputField label="Expected Annual Expenses" name="replacementExpenses" value={form.replacementExpenses} onChange={hc} type="number" prefix="$"/>
            </div>
          </>)}
        </>)}

        {step===4&&(<>
          <SectionLabel>Review Your Inputs</SectionLabel>
          <div style={{fontSize:14,color:'var(--text-secondary)',lineHeight:2}}>
            <p><strong style={{color:'var(--gold)'}}>Property:</strong> {form.propertyType} in {form.location||'\u2014'}</p>
            <p><strong style={{color:'var(--gold)'}}>Purchase Price:</strong> {fmt(form.purchasePrice)}</p>
            <p><strong style={{color:'var(--gold)'}}>Current Value:</strong> {fmt(form.currentValue)}</p>
            <p><strong style={{color:'var(--gold)'}}>Annual Rent:</strong> {fmt(form.annualRent)}</p>
            <p><strong style={{color:'var(--gold)'}}>Annual Expenses:</strong> {fmt(form.annualExpenses)}</p>
            <p><strong style={{color:'var(--gold)'}}>Mortgage:</strong> {fmt(form.mortgageBalance)} @ {form.mortgageRate||0}%</p>
            <p><strong style={{color:'var(--gold)'}}>Appreciation:</strong> {form.annualAppreciation}%/yr</p>
            <p><strong style={{color:'var(--gold)'}}>Alt. Return:</strong> {form.alternativeReturn}%</p>
            <p><strong style={{color:'var(--gold)'}}>Tax Bracket:</strong> {form.taxBracket}%</p>
            <p><strong style={{color:'var(--gold)'}}>Strategy:</strong> {form.exitStrategy}</p>
          </div>
          <div style={{marginTop:20,padding:12,borderRadius:8,background:'var(--bg-subtle)',border:'1px solid var(--border-accent)',fontSize:13,color:'var(--text-muted)'}}>
            Click "Analyze" to run your Hold vs. Sell{form.exitStrategy==='1031'?' vs. 1031 Exchange':''} comparison.
          </div>
        </>)}

        <div style={{display:'flex',justifyContent:'space-between',marginTop:28}}>
          {step>1?<button onClick={prev} style={{padding:'10px 24px',borderRadius:8,border:'1px solid var(--border-primary)',background:'transparent',color:'var(--text-muted)',fontSize:14,cursor:'pointer'}}>&larr; Back</button>:<div/>}
          {step<totalSteps?<button onClick={next} style={{padding:'10px 28px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer'}}>Continue &rarr;</button>
          :<button onClick={submit} style={{padding:'12px 36px',borderRadius:8,border:'none',background:'var(--gold)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',letterSpacing:'0.05em'}}>Analyze &rarr;</button>}
        </div>
      </Card>
    </div>
  );
}
