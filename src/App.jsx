/**
 * STRInvestCalc - Complete Investment Decision Tool
 * =================================================
 * All Phases Integrated: Questionnaire → Calculations → Dashboard
 * Hold vs Sell vs 1031 Exchange Analysis
 * Sensitivity Sliders, Recharts Visualizations, PDF-ready
 * VHG Branding: #167A5E green, #9A7820 gold, dark theme
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

// ═══════════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════════
const theme = {
  accent: '#167A5E',
  accentLight: '#1A9070',
  accentDark: '#0F5E48',
  gold: '#9A7820',
  goldLight: '#C8962E',
  bgPrimary: '#0B1120',
  bgCard: '#151D2E',
  bgCardHover: '#1A2438',
  textPrimary: '#F8FAFC',
  textSecondary: '#E2E8F0',
  textMuted: '#94A3B8',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.12)',
  green: '#1A9070',
  red: '#EF4444',
  blue: '#3B82F6',
  purple: '#8B5CF6',
};

// ═══════════════════════════════════════════════════════════════
// CALCULATION ENGINE
// ═══════════════════════════════════════════════════════════════

function calculateHoldScenario(data, years = 10) {
  const {
    currentValue = 0, purchasePrice = 0, annualRent = 0,
    annualExpenses = 0, vacancyRate = 0, mortgageBalance = 0,
    mortgageRate = 0, mortgageYearsRemaining = 0,
    annualAppreciation = 0.03, roofAge = 0, hvacAge = 0,
    waterHeaterAge = 0,
  } = data;

  const cv = parseFloat(currentValue) || 0;
  const pp = parseFloat(purchasePrice) || 0;
  const rent = parseFloat(annualRent) || 0;
  const expenses = parseFloat(annualExpenses) || 0;
  const vacancy = parseFloat(vacancyRate) || 0;
  const mortBal = parseFloat(mortgageBalance) || 0;
  const mortRate = parseFloat(mortgageRate) || 0;
  const mortYrs = parseInt(mortgageYearsRemaining) || 0;
  const appRate = parseFloat(annualAppreciation) || 0.03;

  // Annual mortgage payment (P&I)
  const monthlyRate = mortRate / 12;
  const totalPayments = mortYrs * 12;
  const monthlyPayment = mortBal > 0 && monthlyRate > 0 && totalPayments > 0
    ? mortBal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1)
    : 0;
  const annualDebtService = monthlyPayment * 12;

  // Depreciation (27.5 year straight-line on 85% of purchase price)
  const depreciableBasis = pp * 0.85;
  const annualDepreciation = depreciableBasis / 27.5;

  // Maintenance reserves based on component age
  const maintenanceSchedule = [];
  for (let y = 1; y <= years; y++) {
    let extra = 0;
    const rAge = parseInt(roofAge) + y;
    const hAge = parseInt(hvacAge) + y;
    const wAge = parseInt(waterHeaterAge) + y;
    if (rAge >= 25 && rAge <= 27) extra += cv * 0.04; // Roof replacement
    if (hAge >= 15 && hAge <= 17) extra += cv * 0.02; // HVAC replacement
    if (wAge >= 12 && wAge <= 13) extra += cv * 0.005; // Water heater
    maintenanceSchedule.push(extra);
  }

  // Year-by-year projections
  const yearlyData = [];
  let cumulativeCashFlow = 0;
  let remainingMortgage = mortBal;

  for (let y = 1; y <= years; y++) {
    const propertyValue = cv * Math.pow(1 + appRate, y);
    const grossRent = rent * Math.pow(1.025, y - 1); // 2.5% rent growth
    const effectiveRent = grossRent * (1 - vacancy / 100);
    const opExpenses = expenses * Math.pow(1.03, y - 1); // 3% expense growth
    const maintenance = maintenanceSchedule[y - 1] || 0;
    const debtService = y <= mortYrs ? annualDebtService : 0;

    // Principal paydown
    let principalPaid = 0;
    if (remainingMortgage > 0 && mortRate > 0) {
      const interestThisYear = remainingMortgage * mortRate;
      principalPaid = Math.min(debtService - interestThisYear, remainingMortgage);
      remainingMortgage = Math.max(0, remainingMortgage - principalPaid);
    }

    const netCashFlow = effectiveRent - opExpenses - maintenance - debtService;
    cumulativeCashFlow += netCashFlow;
    const equity = propertyValue - remainingMortgage;

    yearlyData.push({
      year: y,
      propertyValue: Math.round(propertyValue),
      grossRent: Math.round(grossRent),
      effectiveRent: Math.round(effectiveRent),
      opExpenses: Math.round(opExpenses),
      maintenance: Math.round(maintenance),
      debtService: Math.round(debtService),
      netCashFlow: Math.round(netCashFlow),
      cumulativeCashFlow: Math.round(cumulativeCashFlow),
      equity: Math.round(equity),
      mortgageBalance: Math.round(remainingMortgage),
      depreciation: Math.round(annualDepreciation),
    });
  }

  return {
    yearlyData,
    totalEquityAtEnd: yearlyData[years - 1]?.equity || 0,
    totalCashFlow: cumulativeCashFlow,
    annualCashFlow: cumulativeCashFlow / years,
    totalWealth: (yearlyData[years - 1]?.equity || 0) + cumulativeCashFlow,
  };
}

function calculateSellScenario(data, years = 10, altReturn = 0.07) {
  const cv = parseFloat(data.currentValue) || 0;
  const pp = parseFloat(data.purchasePrice) || 0;
  const mortBal = parseFloat(data.mortgageBalance) || 0;

  // Selling costs
  const realtorFees = cv * 0.06;
  const closingCosts = cv * 0.015;
  const totalSellingCosts = realtorFees + closingCosts;

  // Capital gains
  const depreciableBasis = pp * 0.85;
  const yearsOwned = parseInt(data.yearsOwned) || 1;
  const totalDepreciation = Math.min((depreciableBasis / 27.5) * yearsOwned, depreciableBasis);
  const adjustedBasis = pp - totalDepreciation;
  const capitalGain = cv - adjustedBasis;
  const depreciationRecapture = totalDepreciation * 0.25;
  const longTermGainsTax = Math.max(0, capitalGain - totalDepreciation) * 0.15;
  const totalTax = depreciationRecapture + longTermGainsTax;

  // Net proceeds
  const grossProceeds = cv - mortBal;
  const netProceeds = grossProceeds - totalSellingCosts - totalTax;

  // Invest proceeds
  const yearlyData = [];
  for (let y = 1; y <= years; y++) {
    const investedValue = netProceeds * Math.pow(1 + altReturn, y);
    yearlyData.push({
      year: y,
      investedValue: Math.round(investedValue),
      annualReturn: Math.round(investedValue * altReturn),
    });
  }

  return {
    grossProceeds: Math.round(grossProceeds),
    sellingCosts: Math.round(totalSellingCosts),
    capitalGainsTax: Math.round(totalTax),
    depreciationRecapture: Math.round(depreciationRecapture),
    netProceeds: Math.round(netProceeds),
    yearlyData,
    totalWealthAtEnd: yearlyData[years - 1]?.investedValue || 0,
  };
}

function calculate1031Scenario(data, years = 10) {
  const cv = parseFloat(data.currentValue) || 0;
  const mortBal = parseFloat(data.mortgageBalance) || 0;
  const replacementValue = parseFloat(data.replacementValue) || cv * 1.2;
  const replacementRent = parseFloat(data.replacementRent) || parseFloat(data.annualRent) * 1.1;
  const replacementExpenses = parseFloat(data.replacementExpenses) || parseFloat(data.annualExpenses) * 0.9;
  const appRate = parseFloat(data.annualAppreciation) || 0.03;

  const exchangeCosts = cv * 0.03; // QI fees, legal, etc.
  const equityTransferred = cv - mortBal - exchangeCosts;
  const newMortgage = replacementValue - equityTransferred;

  const monthlyRate = 0.065 / 12; // Assume 6.5% on new property
  const totalPayments = 360;
  const monthlyPayment = newMortgage > 0
    ? newMortgage * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1)
    : 0;
  const annualDebtService = monthlyPayment * 12;

  const yearlyData = [];
  let cumulativeCashFlow = 0;
  let remainingMortgage = newMortgage;

  for (let y = 1; y <= years; y++) {
    const propValue = replacementValue * Math.pow(1 + appRate, y);
    const rent = replacementRent * Math.pow(1.025, y - 1);
    const expenses = replacementExpenses * Math.pow(1.03, y - 1);
    const netCash = rent * 0.85 - expenses - annualDebtService;
    cumulativeCashFlow += netCash;

    if (remainingMortgage > 0) {
      const interest = remainingMortgage * 0.065;
      const principal = Math.min(annualDebtService - interest, remainingMortgage);
      remainingMortgage = Math.max(0, remainingMortgage - principal);
    }

    yearlyData.push({
      year: y,
      propertyValue: Math.round(propValue),
      netCashFlow: Math.round(netCash),
      cumulativeCashFlow: Math.round(cumulativeCashFlow),
      equity: Math.round(propValue - remainingMortgage),
    });
  }

  return {
    replacementValue: Math.round(replacementValue),
    equityTransferred: Math.round(equityTransferred),
    newMortgage: Math.round(newMortgage),
    exchangeCosts: Math.round(exchangeCosts),
    taxDeferred: Math.round(cv * 0.15), // Approximate deferred tax
    yearlyData,
    totalWealth: (yearlyData[years - 1]?.equity || 0) + cumulativeCashFlow,
  };
}

// ═══════════════════════════════════════════════════════════════
// UTILITY: Currency formatter
// ═══════════════════════════════════════════════════════════════
const fmt = (num) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD',
  minimumFractionDigits: 0, maximumFractionDigits: 0,
}).format(num || 0);

const fmtK = (num) => {
  if (Math.abs(num) >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (Math.abs(num) >= 1000) return `$${(num / 1000).toFixed(0)}K`;
  return fmt(num);
};

// ═══════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════

const Card = ({ children, style = {}, hover = false }) => (
  <div style={{
    background: theme.bgCard,
    border: `1px solid ${theme.border}`,
    borderRadius: '12px',
    padding: '24px',
    transition: 'all 0.2s',
    ...(hover ? { cursor: 'pointer' } : {}),
    ...style,
  }}>
    {children}
  </div>
);

const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: '11px', fontWeight: '700', letterSpacing: '0.14em',
    textTransform: 'uppercase', color: theme.gold,
    fontFamily: "'JetBrains Mono', monospace", marginBottom: '16px',
  }}>
    {children}
  </div>
);

const InputField = ({ label, name, value, onChange, type = 'text', prefix, suffix, placeholder, error }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{
      display: 'block', fontSize: '13px', fontWeight: '600',
      color: theme.textSecondary, marginBottom: '6px',
    }}>
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      {prefix && (
        <span style={{
          position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
          color: theme.textMuted, fontSize: '14px',
        }}>{prefix}</span>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 12px',
          paddingLeft: prefix ? '28px' : '12px',
          paddingRight: suffix ? '40px' : '12px',
          background: theme.bgPrimary,
          border: `1px solid ${error ? theme.red : theme.border}`,
          borderRadius: '8px', color: theme.textPrimary,
          fontSize: '14px', outline: 'none',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      />
      {suffix && (
        <span style={{
          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
          color: theme.textMuted, fontSize: '13px',
        }}>{suffix}</span>
      )}
    </div>
    {error && <p style={{ color: theme.red, fontSize: '12px', marginTop: '4px' }}>{error}</p>}
  </div>
);

const SelectField = ({ label, name, value, onChange, options }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{
      display: 'block', fontSize: '13px', fontWeight: '600',
      color: theme.textSecondary, marginBottom: '6px',
    }}>{label}</label>
    <select
      name={name} value={value} onChange={onChange}
      style={{
        width: '100%', padding: '10px 12px',
        background: theme.bgPrimary, border: `1px solid ${theme.border}`,
        borderRadius: '8px', color: theme.textPrimary,
        fontSize: '14px', outline: 'none',
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

const Slider = ({ label, min, max, step, value, onChange, displayValue }) => (
  <div style={{
    marginBottom: '20px', padding: '14px',
    background: theme.bgCard, borderRadius: '8px',
    border: `1px solid ${theme.border}`,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
      <span style={{
        fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: theme.gold,
        fontFamily: "'JetBrains Mono', monospace",
      }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: '600', color: theme.accent }}>
        {displayValue}
      </span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={onChange}
      style={{
        width: '100%', height: '6px', borderRadius: '3px',
        background: `linear-gradient(to right, ${theme.accent} 0%, ${theme.accent} ${((value - min) / (max - min)) * 100}%, ${theme.border} ${((value - min) / (max - min)) * 100}%, ${theme.border} 100%)`,
      }}
    />
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      fontSize: '10px', color: theme.textMuted, marginTop: '4px',
    }}>
      <span>{min}</span><span>{max}</span>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// QUESTIONNAIRE COMPONENT
// ═══════════════════════════════════════════════════════════════

const Questionnaire = ({ onComplete, initialData }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [form, setForm] = useState(initialData || {
    propertyType: 'single-family',
    location: '',
    purchasePrice: '',
    purchaseDate: '',
    currentValue: '',
    yearsOwned: '',
    managementStyle: 'self-managed',
    annualRent: '',
    annualExpenses: '',
    vacancyRate: '10',
    mortgageBalance: '',
    mortgageRate: '',
    mortgageYearsRemaining: '',
    depreciation: '',
    roofAge: '5',
    hvacAge: '5',
    waterHeaterAge: '3',
    capRate: '',
    annualAppreciation: '3',
    alternativeInvestment: 'stock-market',
    alternativeReturn: '7',
    exitStrategy: 'undecided',
    replacementValue: '',
    replacementRent: '',
    replacementExpenses: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  };

  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!form.location) e.location = 'Required';
      if (!form.purchasePrice || form.purchasePrice <= 0) e.purchasePrice = 'Required';
      if (!form.currentValue || form.currentValue <= 0) e.currentValue = 'Required';
      if (!form.annualRent || form.annualRent <= 0) e.annualRent = 'Required';
    }
    if (step === 2) {
      if (!form.annualExpenses && form.annualExpenses !== '0') e.annualExpenses = 'Required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => Math.min(s + 1, totalSteps)); };
  const prev = () => setStep(s => Math.max(s - 1, 1));
  const submit = () => { if (validate()) onComplete(form); };

  // Progress bar
  const ProgressBar = () => (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        {['Property', 'Financials', 'Market', 'Review'].map((label, i) => (
          <div key={i} style={{
            fontSize: '11px', fontWeight: step > i ? '700' : '500',
            color: step > i ? theme.accent : step === i + 1 ? theme.gold : theme.textMuted,
            letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>{label}</div>
        ))}
      </div>
      <div style={{ height: '3px', background: theme.border, borderRadius: '2px' }}>
        <div style={{
          height: '100%', width: `${(step / totalSteps) * 100}%`,
          background: `linear-gradient(90deg, ${theme.accent}, ${theme.gold})`,
          borderRadius: '2px', transition: 'width 0.3s',
        }} />
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '700', margin: 0 }}>
          STR<span style={{ color: theme.gold }}>Invest</span>Calc
        </h1>
        <p style={{ color: theme.gold, fontSize: '13px', marginTop: '8px',
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }}>
          INVESTMENT DECISION TOOL
        </p>
      </div>

      <ProgressBar />

      <Card>
        {/* STEP 1: Property & Portfolio */}
        {step === 1 && (
          <>
            <SectionLabel>Property & Portfolio</SectionLabel>
            <SelectField label="Property Type" name="propertyType" value={form.propertyType}
              onChange={handleChange} options={[
                { value: 'single-family', label: 'Single Family' },
                { value: 'condo', label: 'Condo / Townhome' },
                { value: 'multi-family', label: 'Multi-Family' },
                { value: 'cabin', label: 'Cabin / Vacation Home' },
              ]} />
            <InputField label="Location (City, State)" name="location" value={form.location}
              onChange={handleChange} placeholder="e.g. Lincoln, NH" error={errors.location} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <InputField label="Purchase Price" name="purchasePrice" value={form.purchasePrice}
                onChange={handleChange} type="number" prefix="$" error={errors.purchasePrice} />
              <InputField label="Current Market Value" name="currentValue" value={form.currentValue}
                onChange={handleChange} type="number" prefix="$" error={errors.currentValue} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <InputField label="Years Owned" name="yearsOwned" value={form.yearsOwned}
                onChange={handleChange} type="number" suffix="yrs" />
              <InputField label="Annual Gross Rent" name="annualRent" value={form.annualRent}
                onChange={handleChange} type="number" prefix="$" error={errors.annualRent} />
            </div>
            <SelectField label="Management Style" name="managementStyle" value={form.managementStyle}
              onChange={handleChange} options={[
                { value: 'self-managed', label: 'Self-Managed' },
                { value: 'property-manager', label: 'Property Manager (20-25%)' },
                { value: 'hybrid', label: 'Hybrid' },
              ]} />
          </>
        )}

        {/* STEP 2: Financial Snapshot */}
        {step === 2 && (
          <>
            <SectionLabel>Financial Snapshot</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <InputField label="Annual Operating Expenses" name="annualExpenses" value={form.annualExpenses}
                onChange={handleChange} type="number" prefix="$" error={errors.annualExpenses} />
              <InputField label="Vacancy Rate" name="vacancyRate" value={form.vacancyRate}
                onChange={handleChange} type="number" suffix="%" />
            </div>
            <SectionLabel>Mortgage Details</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <InputField label="Mortgage Balance" name="mortgageBalance" value={form.mortgageBalance}
                onChange={handleChange} type="number" prefix="$" />
              <InputField label="Interest Rate" name="mortgageRate" value={form.mortgageRate}
                onChange={handleChange} type="number" suffix="%" />
            </div>
            <InputField label="Years Remaining" name="mortgageYearsRemaining" value={form.mortgageYearsRemaining}
              onChange={handleChange} type="number" suffix="yrs" />
            <SectionLabel>Property Condition</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <InputField label="Roof Age" name="roofAge" value={form.roofAge}
                onChange={handleChange} type="number" suffix="yrs" />
              <InputField label="HVAC Age" name="hvacAge" value={form.hvacAge}
                onChange={handleChange} type="number" suffix="yrs" />
              <InputField label="Water Heater" name="waterHeaterAge" value={form.waterHeaterAge}
                onChange={handleChange} type="number" suffix="yrs" />
            </div>
          </>
        )}

        {/* STEP 3: Market & Opportunity */}
        {step === 3 && (
          <>
            <SectionLabel>Market Assumptions</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <InputField label="Annual Appreciation" name="annualAppreciation" value={form.annualAppreciation}
                onChange={handleChange} type="number" suffix="%" />
              <InputField label="Cap Rate (optional)" name="capRate" value={form.capRate}
                onChange={handleChange} type="number" suffix="%" />
            </div>
            <SectionLabel>Alternative Investment</SectionLabel>
            <SelectField label="If you sell, where would you invest?" name="alternativeInvestment"
              value={form.alternativeInvestment} onChange={handleChange} options={[
                { value: 'stock-market', label: 'Stock Market (S&P 500)' },
                { value: 'bonds', label: 'Bonds / Fixed Income' },
                { value: 'another-property', label: 'Another Property (non-1031)' },
                { value: 'mixed', label: 'Mixed Portfolio' },
              ]} />
            <InputField label="Expected Annual Return" name="alternativeReturn" value={form.alternativeReturn}
              onChange={handleChange} type="number" suffix="%" />
            <SectionLabel>Exit Strategy Interest</SectionLabel>
            <SelectField label="What are you considering?" name="exitStrategy"
              value={form.exitStrategy} onChange={handleChange} options={[
                { value: 'undecided', label: "Not sure yet — show me the data" },
                { value: 'hold', label: 'Leaning toward holding' },
                { value: 'sell', label: 'Leaning toward selling' },
                { value: '1031', label: 'Interested in 1031 Exchange' },
              ]} />
            {form.exitStrategy === '1031' && (
              <>
                <SectionLabel>1031 Exchange — Replacement Property</SectionLabel>
                <InputField label="Replacement Property Value" name="replacementValue"
                  value={form.replacementValue} onChange={handleChange} type="number" prefix="$" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <InputField label="Expected Annual Rent" name="replacementRent"
                    value={form.replacementRent} onChange={handleChange} type="number" prefix="$" />
                  <InputField label="Expected Annual Expenses" name="replacementExpenses"
                    value={form.replacementExpenses} onChange={handleChange} type="number" prefix="$" />
                </div>
              </>
            )}
          </>
        )}

        {/* STEP 4: Review */}
        {step === 4 && (
          <>
            <SectionLabel>Review Your Inputs</SectionLabel>
            <div style={{ fontSize: '14px', color: theme.textSecondary, lineHeight: '2' }}>
              <p><strong style={{ color: theme.gold }}>Property:</strong> {form.propertyType} in {form.location || '—'}</p>
              <p><strong style={{ color: theme.gold }}>Purchase Price:</strong> {fmt(form.purchasePrice)}</p>
              <p><strong style={{ color: theme.gold }}>Current Value:</strong> {fmt(form.currentValue)}</p>
              <p><strong style={{ color: theme.gold }}>Annual Rent:</strong> {fmt(form.annualRent)}</p>
              <p><strong style={{ color: theme.gold }}>Annual Expenses:</strong> {fmt(form.annualExpenses)}</p>
              <p><strong style={{ color: theme.gold }}>Mortgage:</strong> {fmt(form.mortgageBalance)} @ {form.mortgageRate || 0}%</p>
              <p><strong style={{ color: theme.gold }}>Appreciation:</strong> {form.annualAppreciation}% / year</p>
              <p><strong style={{ color: theme.gold }}>Alt. Return:</strong> {form.alternativeReturn}%</p>
              <p><strong style={{ color: theme.gold }}>Strategy:</strong> {form.exitStrategy}</p>
            </div>
            <div style={{
              marginTop: '20px', padding: '12px', borderRadius: '8px',
              background: `rgba(22, 122, 94, 0.1)`, border: `1px solid rgba(22, 122, 94, 0.3)`,
              fontSize: '13px', color: theme.textMuted,
            }}>
              Click "Analyze" to run your Hold vs. Sell{form.exitStrategy === '1031' ? ' vs. 1031 Exchange' : ''} comparison.
              You can adjust assumptions anytime from the dashboard.
            </div>
          </>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
          {step > 1 ? (
            <button onClick={prev} style={{
              padding: '10px 24px', borderRadius: '8px', border: `1px solid ${theme.border}`,
              background: 'transparent', color: theme.textMuted, fontSize: '14px', cursor: 'pointer',
            }}>← Back</button>
          ) : <div />}
          {step < totalSteps ? (
            <button onClick={next} style={{
              padding: '10px 28px', borderRadius: '8px', border: 'none',
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`,
              color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
            }}>Continue →</button>
          ) : (
            <button onClick={submit} style={{
              padding: '12px 36px', borderRadius: '8px', border: 'none',
              background: `linear-gradient(135deg, ${theme.gold}, ${theme.goldLight})`,
              color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
              letterSpacing: '0.05em',
            }}>Analyze →</button>
          )}
        </div>
      </Card>

      {/* Footer */}
      <p style={{
        textAlign: 'center', fontSize: '11px', color: theme.textMuted,
        marginTop: '32px', lineHeight: '1.8',
      }}>
        This tool does not constitute financial or investment advice.<br />
        Consult a qualified real estate professional before making investment decisions.
      </p>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════

const Dashboard = ({ formData, holdResult, sellResult, exchangeResult, onEditAssumptions }) => {
  const show1031 = !!exchangeResult;
  const years = 10;

  // Sensitivity state
  const [sens, setSens] = useState({
    rentGrowth: 2.5,
    vacancyRate: parseFloat(formData.vacancyRate) || 10,
    maintenanceMult: 1.0,
    appreciation: parseFloat(formData.annualAppreciation) || 3,
    altReturn: parseFloat(formData.alternativeReturn) || 7,
    yearsToHold: 10,
  });

  // Recalculate with sensitivity
  const results = useMemo(() => {
    const adjustedData = {
      ...formData,
      annualAppreciation: sens.appreciation / 100,
      vacancyRate: sens.vacancyRate,
      alternativeReturn: sens.altReturn / 100,
    };

    const hold = calculateHoldScenario(adjustedData, sens.yearsToHold);
    const sell = calculateSellScenario(adjustedData, sens.yearsToHold, sens.altReturn / 100);
    const exch = show1031 ? calculate1031Scenario(adjustedData, sens.yearsToHold) : null;

    return { hold, sell, exch };
  }, [formData, sens, show1031]);

  const { hold, sell, exch } = results;

  // Determine recommendation
  const getRecommendation = () => {
    const holdW = hold.totalWealth;
    const sellW = sell.totalWealthAtEnd;
    const exchW = exch?.totalWealth || 0;

    if (show1031 && exchW > holdW && exchW > sellW) return { text: '1031 Exchange', color: theme.purple };
    if (holdW > sellW) return { text: 'Hold Property', color: theme.accent };
    return { text: 'Sell & Invest', color: theme.blue };
  };

  const rec = getRecommendation();

  // Chart data
  const chartData = useMemo(() => {
    const data = [];
    for (let y = 0; y <= sens.yearsToHold; y++) {
      const point = { year: y };
      if (y === 0) {
        point.hold = parseFloat(formData.currentValue) - parseFloat(formData.mortgageBalance || 0);
        point.sell = sell.netProceeds;
        if (show1031) point.exchange = exch.equityTransferred;
      } else {
        point.hold = hold.yearlyData[y - 1]?.equity + (hold.yearlyData[y - 1]?.cumulativeCashFlow || 0);
        point.sell = sell.yearlyData[y - 1]?.investedValue;
        if (show1031) point.exchange = (exch.yearlyData[y - 1]?.equity || 0) + (exch.yearlyData[y - 1]?.cumulativeCashFlow || 0);
      }
      data.push(point);
    }
    return data;
  }, [hold, sell, exch, sens.yearsToHold, formData, show1031]);

  // Cash flow chart data
  const cashFlowData = useMemo(() => {
    return hold.yearlyData.map(d => ({
      year: `Yr ${d.year}`,
      revenue: d.effectiveRent,
      expenses: -(d.opExpenses + d.maintenance),
      debtService: -d.debtService,
      net: d.netCashFlow,
    }));
  }, [hold]);

  // Expense breakdown for pie chart
  const expensePieData = useMemo(() => {
    const yr1 = hold.yearlyData[0] || {};
    return [
      { name: 'Operating', value: yr1.opExpenses || 0, color: theme.blue },
      { name: 'Maintenance', value: yr1.maintenance || 0, color: theme.gold },
      { name: 'Debt Service', value: yr1.debtService || 0, color: theme.red },
    ].filter(d => d.value > 0);
  }, [hold]);

  // Tooltip formatter
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <div style={{
        background: theme.bgCard, border: `1px solid ${theme.border}`,
        borderRadius: '8px', padding: '12px', fontSize: '12px',
      }}>
        <p style={{ color: theme.gold, fontWeight: '700', marginBottom: '6px' }}>Year {label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, margin: '2px 0' }}>
            {p.name}: {fmt(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '32px', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>
            STR<span style={{ color: theme.gold }}>Invest</span>Calc
          </h1>
          <p style={{ color: theme.textMuted, fontSize: '13px', marginTop: '4px' }}>
            {formData.propertyType} in {formData.location}
          </p>
        </div>
        <button onClick={onEditAssumptions} style={{
          padding: '10px 20px', borderRadius: '8px', border: `1px solid ${theme.border}`,
          background: 'transparent', color: theme.textMuted, fontSize: '13px', cursor: 'pointer',
        }}>← Edit Assumptions</button>
      </div>

      {/* Metric Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px', marginBottom: '32px',
      }}>
        <Card>
          <SectionLabel>Hold Equity + Cash Flow</SectionLabel>
          <div style={{ fontSize: '28px', fontWeight: '700', color: theme.accent }}>
            {fmtK(hold.totalWealth)}
          </div>
          <p style={{ fontSize: '12px', color: theme.textMuted, marginTop: '4px' }}>
            {sens.yearsToHold}-year total wealth
          </p>
        </Card>
        <Card>
          <SectionLabel>Sell & Invest Value</SectionLabel>
          <div style={{ fontSize: '28px', fontWeight: '700', color: theme.blue }}>
            {fmtK(sell.totalWealthAtEnd)}
          </div>
          <p style={{ fontSize: '12px', color: theme.textMuted, marginTop: '4px' }}>
            Net proceeds invested at {sens.altReturn}%
          </p>
        </Card>
        {show1031 && (
          <Card>
            <SectionLabel>1031 Exchange</SectionLabel>
            <div style={{ fontSize: '28px', fontWeight: '700', color: theme.purple }}>
              {fmtK(exch.totalWealth)}
            </div>
            <p style={{ fontSize: '12px', color: theme.textMuted, marginTop: '4px' }}>
              Tax-deferred: {fmtK(exch.taxDeferred)}
            </p>
          </Card>
        )}
        <Card style={{ background: `rgba(${rec.color === theme.accent ? '22,122,94' : rec.color === theme.blue ? '59,130,246' : '139,92,246'}, 0.1)` }}>
          <SectionLabel>Recommendation</SectionLabel>
          <div style={{ fontSize: '24px', fontWeight: '700', color: rec.color }}>
            {rec.text}
          </div>
          <p style={{ fontSize: '12px', color: theme.textMuted, marginTop: '4px' }}>
            Advantage: {fmtK(Math.abs(hold.totalWealth - sell.totalWealthAtEnd))}
          </p>
        </Card>
      </div>

      {/* Main content: Charts + Sliders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        {/* Left: Charts */}
        <div>
          {/* Cumulative Wealth Chart */}
          <Card style={{ marginBottom: '24px' }}>
            <SectionLabel>Cumulative Wealth Comparison</SectionLabel>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                <XAxis dataKey="year" stroke={theme.textMuted} fontSize={12}
                  label={{ value: 'Year', position: 'insideBottom', offset: -5, fill: theme.textMuted }} />
                <YAxis stroke={theme.textMuted} fontSize={11} tickFormatter={fmtK} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="hold" name="Hold" stroke={theme.accent}
                  strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="sell" name="Sell & Invest" stroke={theme.blue}
                  strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                {show1031 && (
                  <Line type="monotone" dataKey="exchange" name="1031 Exchange" stroke={theme.purple}
                    strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Cash Flow Chart */}
          <Card style={{ marginBottom: '24px' }}>
            <SectionLabel>Annual Cash Flow Breakdown</SectionLabel>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cashFlowData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                <XAxis dataKey="year" stroke={theme.textMuted} fontSize={11} />
                <YAxis stroke={theme.textMuted} fontSize={11} tickFormatter={fmtK} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="revenue" name="Revenue" fill={theme.accent} radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill={theme.red} radius={[4, 4, 0, 0]} />
                <Bar dataKey="debtService" name="Debt Service" fill={theme.gold} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Expense Pie + Sell Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Card>
              <SectionLabel>Year 1 Expense Split</SectionLabel>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={expensePieData} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false} fontSize={11}>
                    {expensePieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <SectionLabel>Sale Proceeds Breakdown</SectionLabel>
              <div style={{ fontSize: '13px', lineHeight: '2.2', color: theme.textSecondary }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Gross Equity</span><span>{fmt(sell.grossProceeds)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.red }}>
                  <span>− Selling Costs</span><span>{fmt(sell.sellingCosts)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.red }}>
                  <span>− Capital Gains Tax</span><span>{fmt(sell.capitalGainsTax)}</span>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  borderTop: `1px solid ${theme.border}`, paddingTop: '8px', marginTop: '8px',
                  fontWeight: '700', color: theme.accent,
                }}>
                  <span>Net to Invest</span><span>{fmt(sell.netProceeds)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Right: Sensitivity Sliders */}
        <div>
          <Card>
            <SectionLabel>Sensitivity Sliders</SectionLabel>
            <p style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '20px' }}>
              Adjust assumptions — charts update in real time.
            </p>

            <Slider label="Rent Growth" min={-2} max={6} step={0.5}
              value={sens.rentGrowth} displayValue={`${sens.rentGrowth}%`}
              onChange={(e) => setSens({ ...sens, rentGrowth: parseFloat(e.target.value) })} />

            <Slider label="Vacancy Rate" min={0} max={25} step={1}
              value={sens.vacancyRate} displayValue={`${sens.vacancyRate}%`}
              onChange={(e) => setSens({ ...sens, vacancyRate: parseFloat(e.target.value) })} />

            <Slider label="Maintenance Mult" min={0.5} max={2.0} step={0.1}
              value={sens.maintenanceMult} displayValue={`${sens.maintenanceMult}×`}
              onChange={(e) => setSens({ ...sens, maintenanceMult: parseFloat(e.target.value) })} />

            <Slider label="Appreciation" min={-1} max={6} step={0.5}
              value={sens.appreciation} displayValue={`${sens.appreciation}%`}
              onChange={(e) => setSens({ ...sens, appreciation: parseFloat(e.target.value) })} />

            <Slider label="Alt. Return" min={2} max={12} step={0.5}
              value={sens.altReturn} displayValue={`${sens.altReturn}%`}
              onChange={(e) => setSens({ ...sens, altReturn: parseFloat(e.target.value) })} />

            <Slider label="Years to Hold" min={1} max={10} step={1}
              value={sens.yearsToHold} displayValue={`${sens.yearsToHold} yrs`}
              onChange={(e) => setSens({ ...sens, yearsToHold: parseInt(e.target.value) })} />

            <div style={{
              marginTop: '16px', padding: '12px', borderRadius: '6px',
              background: `rgba(154, 120, 32, 0.1)`, border: `1px solid rgba(154, 120, 32, 0.3)`,
              fontSize: '11px', color: theme.textMuted,
            }}>
              <strong>Tip:</strong> Drag sliders to stress-test your decision. Watch the recommendation change as assumptions shift.
            </div>
          </Card>
        </div>
      </div>

      {/* Year-by-Year Table */}
      <Card style={{ marginTop: '24px', overflowX: 'auto' }}>
        <SectionLabel>Year-by-Year Comparison</SectionLabel>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
              {['Year', 'Property Value', 'Hold Equity', 'Cash Flow', 'Hold Total', 'Sell Invested', show1031 && '1031 Total']
                .filter(Boolean).map(h => (
                <th key={h} style={{
                  padding: '10px 8px', textAlign: 'right', color: theme.gold,
                  fontWeight: '700', letterSpacing: '0.05em', fontSize: '10px',
                  textTransform: 'uppercase',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hold.yearlyData.map((d, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                <td style={{ padding: '8px', color: theme.textMuted }}>{d.year}</td>
                <td style={{ padding: '8px', textAlign: 'right', color: theme.textSecondary }}>{fmtK(d.propertyValue)}</td>
                <td style={{ padding: '8px', textAlign: 'right', color: theme.accent }}>{fmtK(d.equity)}</td>
                <td style={{ padding: '8px', textAlign: 'right', color: d.netCashFlow >= 0 ? theme.green : theme.red }}>
                  {fmtK(d.netCashFlow)}
                </td>
                <td style={{ padding: '8px', textAlign: 'right', color: theme.accent, fontWeight: '600' }}>
                  {fmtK(d.equity + d.cumulativeCashFlow)}
                </td>
                <td style={{ padding: '8px', textAlign: 'right', color: theme.blue }}>
                  {fmtK(sell.yearlyData[i]?.investedValue)}
                </td>
                {show1031 && (
                  <td style={{ padding: '8px', textAlign: 'right', color: theme.purple }}>
                    {fmtK((exch.yearlyData[i]?.equity || 0) + (exch.yearlyData[i]?.cumulativeCashFlow || 0))}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Footer */}
      <div style={{
        textAlign: 'center', padding: '32px 0', fontSize: '11px',
        color: theme.textMuted, lineHeight: '2',
      }}>
        <p>Joe Mori & Dino Amato, Real Broker NH. Each office is independently owned and operated.</p>
        <p>This tool does not constitute financial or investment advice. Consult a qualified real estate professional before making investment decisions.</p>
        <p>By using this platform, you consent to the collection of your email address and preferences for the purpose of delivering personalized market analysis. We do not sell or share your information with third parties.</p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN APP - STATE MACHINE
// ═══════════════════════════════════════════════════════════════

function App() {
  const [view, setView] = useState('questionnaire');
  const [formData, setFormData] = useState(null);
  const [holdResult, setHoldResult] = useState(null);
  const [sellResult, setSellResult] = useState(null);
  const [exchangeResult, setExchangeResult] = useState(null);

  const handleAnalyze = useCallback((data) => {
    // Normalize percentage inputs
    const normalized = {
      ...data,
      vacancyRate: parseFloat(data.vacancyRate) || 10,
      mortgageRate: (parseFloat(data.mortgageRate) || 0) / 100,
      annualAppreciation: (parseFloat(data.annualAppreciation) || 3) / 100,
      alternativeReturn: (parseFloat(data.alternativeReturn) || 7) / 100,
    };

    const hold = calculateHoldScenario(normalized, 10);
    const sell = calculateSellScenario(normalized, 10, normalized.alternativeReturn);
    const exch = data.exitStrategy === '1031' ? calculate1031Scenario(normalized, 10) : null;

    setFormData(normalized);
    setHoldResult(hold);
    setSellResult(sell);
    setExchangeResult(exch);
    setView('dashboard');
  }, []);

  const handleEditAssumptions = useCallback(() => {
    setView('questionnaire');
  }, []);

  if (view === 'dashboard' && holdResult && sellResult) {
    return (
      <Dashboard
        formData={formData}
        holdResult={holdResult}
        sellResult={sellResult}
        exchangeResult={exchangeResult}
        onEditAssumptions={handleEditAssumptions}
      />
    );
  }

  return <Questionnaire onComplete={handleAnalyze} initialData={formData} />;
}

export default App;
