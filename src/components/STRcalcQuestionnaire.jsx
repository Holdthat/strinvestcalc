// src/components/STRcalcQuestionnaire.jsx
// Multi-step investment questionnaire

import React, { useState } from 'react';

function STRcalcQuestionnaire({ onComplete, initialData }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(initialData || {
    propertyAge: 10,
    currentValue: 500000,
    purchasePrice: 400000,
    annualRent: 60000,
    annualExpenses: 12000,
    vacancyRate: 0.08,
    mortgageBalance: 250000,
    mortgageRate: 0.045,
    mortgageYearsRemaining: 25,
    depreciation: 50000,
    annualAppreciation: 0.03,
    annualRentGrowth: 0.03,
    annualExpenseGrowth: 0.025,
    roofAge: 3,
    hvacAge: 2,
    waterHeaterAge: 1,
    exitStrategy: 'undecided'
  });

  const handleChange = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    onComplete(data);
  };

  const theme = {
    bg: '#0B1120',
    card: '#151D2E',
    accent: '#167A5E',
    gold: '#9A7820',
    text: '#F8FAFC'
  };

  return (
    <div style={{ background: theme.bg, color: theme.text, minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '10px' }}>STRInvestCalc</h1>
        <p style={{ color: theme.gold, marginBottom: '40px' }}>Step {step} of 5</p>

        {step === 1 && (
          <div style={{ background: theme.card, padding: '30px', borderRadius: '8px' }}>
            <h2>Property Details</h2>
            <div style={{ marginTop: '20px' }}>
              <label>Current Property Value: ${data.currentValue?.toLocaleString()}</label>
              <input type="range" min="100000" max="2000000" step="10000" value={data.currentValue} 
                onChange={(e) => handleChange('currentValue', parseInt(e.target.value))} 
                style={{ width: '100%', marginBottom: '20px' }} />
              
              <label>Annual Rental Income: ${data.annualRent?.toLocaleString()}</label>
              <input type="number" value={data.annualRent} 
                onChange={(e) => handleChange('annualRent', parseFloat(e.target.value))} 
                style={{ width: '100%', padding: '8px', marginBottom: '20px' }} />
              
              <label>Annual Expenses: ${data.annualExpenses?.toLocaleString()}</label>
              <input type="number" value={data.annualExpenses} 
                onChange={(e) => handleChange('annualExpenses', parseFloat(e.target.value))} 
                style={{ width: '100%', padding: '8px' }} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ background: theme.card, padding: '30px', borderRadius: '8px' }}>
            <h2>Mortgage & Financing</h2>
            <div style={{ marginTop: '20px' }}>
              <label>Mortgage Balance: ${data.mortgageBalance?.toLocaleString()}</label>
              <input type="number" value={data.mortgageBalance} 
                onChange={(e) => handleChange('mortgageBalance', parseFloat(e.target.value))} 
                style={{ width: '100%', padding: '8px', marginBottom: '20px' }} />
              
              <label>Interest Rate: {(data.mortgageRate * 100).toFixed(2)}%</label>
              <input type="number" step="0.001" value={data.mortgageRate} 
                onChange={(e) => handleChange('mortgageRate', parseFloat(e.target.value))} 
                style={{ width: '100%', padding: '8px', marginBottom: '20px' }} />
              
              <label>Years Remaining: {data.mortgageYearsRemaining}</label>
              <input type="number" value={data.mortgageYearsRemaining} 
                onChange={(e) => handleChange('mortgageYearsRemaining', parseInt(e.target.value))} 
                style={{ width: '100%', padding: '8px' }} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ background: theme.card, padding: '30px', borderRadius: '8px' }}>
            <h2>Property Condition</h2>
            <div style={{ marginTop: '20px' }}>
              <label>Property Age: {data.propertyAge} years</label>
              <input type="number" value={data.propertyAge} 
                onChange={(e) => handleChange('propertyAge', parseInt(e.target.value))} 
                style={{ width: '100%', padding: '8px', marginBottom: '20px' }} />
              
              <label>Roof Age: {data.roofAge} years</label>
              <input type="number" value={data.roofAge} 
                onChange={(e) => handleChange('roofAge', parseInt(e.target.value))} 
                style={{ width: '100%', padding: '8px', marginBottom: '20px' }} />
              
              <label>HVAC Age: {data.hvacAge} years</label>
              <input type="number" value={data.hvacAge} 
                onChange={(e) => handleChange('hvacAge', parseInt(e.target.value))} 
                style={{ width: '100%', padding: '8px' }} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ background: theme.card, padding: '30px', borderRadius: '8px' }}>
            <h2>Market & Growth</h2>
            <div style={{ marginTop: '20px' }}>
              <label>Annual Appreciation: {(data.annualAppreciation * 100).toFixed(1)}%</label>
              <input type="number" step="0.001" value={data.annualAppreciation} 
                onChange={(e) => handleChange('annualAppreciation', parseFloat(e.target.value))} 
                style={{ width: '100%', padding: '8px', marginBottom: '20px' }} />
              
              <label>Vacancy Rate: {(data.vacancyRate * 100).toFixed(1)}%</label>
              <input type="number" step="0.001" value={data.vacancyRate} 
                onChange={(e) => handleChange('vacancyRate', parseFloat(e.target.value))} 
                style={{ width: '100%', padding: '8px' }} />
            </div>
          </div>
        )}

        {step === 5 && (
          <div style={{ background: theme.card, padding: '30px', borderRadius: '8px' }}>
            <h2>Exit Strategy</h2>
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px' }}>
                <input type="radio" value="hold" checked={data.exitStrategy === 'hold'} 
                  onChange={(e) => handleChange('exitStrategy', e.target.value)} />
                {' '} Hold the property
              </label>
              <label style={{ display: 'block', marginBottom: '10px' }}>
                <input type="radio" value="sell-outright" checked={data.exitStrategy === 'sell-outright'} 
                  onChange={(e) => handleChange('exitStrategy', e.target.value)} />
                {' '} Sell outright
              </label>
              <label style={{ display: 'block', marginBottom: '10px' }}>
                <input type="radio" value="1031-exchange" checked={data.exitStrategy === '1031-exchange'} 
                  onChange={(e) => handleChange('exitStrategy', e.target.value)} />
                {' '} 1031 Exchange
              </label>
              <label style={{ display: 'block' }}>
                <input type="radio" value="undecided" checked={data.exitStrategy === 'undecided'} 
                  onChange={(e) => handleChange('exitStrategy', e.target.value)} />
                {' '} Undecided
              </label>
            </div>
          </div>
        )}

        <div style={{ marginTop: '40px', display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
          <button onClick={handleBack} disabled={step === 1}
            style={{ padding: '10px 20px', background: theme.accent, color: 'white', border: 'none', cursor: 'pointer' }}>
            Back
          </button>
          
          {step < 5 ? (
            <button onClick={handleNext}
              style={{ padding: '10px 20px', background: theme.accent, color: 'white', border: 'none', cursor: 'pointer' }}>
              Next
            </button>
          ) : (
            <button onClick={handleSubmit}
              style={{ padding: '10px 20px', background: theme.gold, color: 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              Analyze
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default STRcalcQuestionnaire;
