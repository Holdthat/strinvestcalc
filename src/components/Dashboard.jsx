// src/components/Dashboard.jsx
// Results dashboard with charts and comparisons

import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Dashboard({ data, scenarios, comparison, onEditAssumptions }) {
  const [activeTab, setActiveTab] = useState('overview');

  const theme = {
    bg: '#0B1120',
    card: '#151D2E',
    accent: '#167A5E',
    gold: '#9A7820',
    text: '#F8FAFC',
    positive: '#10B981',
    negative: '#EF4444'
  };

  const holdYears = scenarios.hold.yearByYear;
  const wealthData = holdYears.map((y, i) => ({
    year: y.year,
    hold: y.equity + holdYears.slice(0, i + 1).reduce((sum, h) => sum + h.cashFlow, 0),
    sell: comparison.sell * Math.pow(1.05, y.year) / Math.pow(1.05, 10)
  }));

  const handleExport = () => {
    const content = `
STRInvestCalc Analysis Report
========================================

Property Details:
- Current Value: $${data.currentValue?.toLocaleString()}
- Annual Rent: $${data.annualRent?.toLocaleString()}
- Annual Expenses: $${data.annualExpenses?.toLocaleString()}

10-Year Projection:
- Hold Strategy: $${scenarios.hold.totalWealth?.toLocaleString()}
- Sell Strategy: $${comparison.sell?.toLocaleString()}
- Winner: ${comparison.winner?.toUpperCase()}

Key Metrics:
- Total Cash Flow (Hold): $${scenarios.hold.totalCashFlow?.toLocaleString()}
- Final Equity (Hold): $${scenarios.hold.finalEquity?.toLocaleString()}
- Net Proceeds (Sell): $${scenarios.sell.netProceeds?.toLocaleString()}
- Taxes Paid (Sell): $${scenarios.sell.totalTaxesPaid?.toLocaleString()}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'strinvestcalc-analysis.txt';
    a.click();
  };

  return (
    <div style={{ background: theme.bg, color: theme.text, minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '40px' }}>
          <h1>STRInvestCalc Analysis Results</h1>
          <p style={{ color: theme.gold }}>10-Year Projection</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ background: theme.card, padding: '20px', borderRadius: '8px', borderLeft: `4px solid ${theme.accent}` }}>
            <p style={{ fontSize: '12px', color: theme.gold }}>HOLD STRATEGY</p>
            <h3 style={{ fontSize: '24px', marginTop: '10px' }}>${scenarios.hold.totalWealth?.toLocaleString()}</h3>
            <p style={{ fontSize: '12px', color: '#94A3B8' }}>Total Wealth (10 Years)</p>
          </div>

          <div style={{ background: theme.card, padding: '20px', borderRadius: '8px', borderLeft: `4px solid ${theme.accent}` }}>
            <p style={{ fontSize: '12px', color: theme.gold }}>SELL STRATEGY</p>
            <h3 style={{ fontSize: '24px', marginTop: '10px' }}>${comparison.sell?.toLocaleString()}</h3>
            <p style={{ fontSize: '12px', color: '#94A3B8' }}>Invested Value (10 Years)</p>
          </div>

          <div style={{ background: theme.card, padding: '20px', borderRadius: '8px', borderLeft: `4px solid ${comparison.winner === 'hold' ? theme.positive : theme.negative}` }}>
            <p style={{ fontSize: '12px', color: theme.gold }}>WINNER</p>
            <h3 style={{ fontSize: '24px', marginTop: '10px', textTransform: 'uppercase' }}>
              {comparison.winner}
            </h3>
            <p style={{ fontSize: '12px', color: '#94A3B8' }}>
              +${Math.abs(comparison.hold - comparison.sell)?.toLocaleString()}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '20px', borderBottom: `1px solid ${theme.card}`, display: 'flex', gap: '20px' }}>
          {['overview', 'yearly', 'breakdown'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                color: activeTab === tab ? theme.gold : theme.text,
                border: 'none',
                borderBottom: activeTab === tab ? `2px solid ${theme.gold}` : 'none',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div style={{ background: theme.card, padding: '20px', borderRadius: '8px', marginBottom: '40px' }}>
            <h3>Wealth Accumulation Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={wealthData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.gold} />
                <XAxis dataKey="year" stroke={theme.text} />
                <YAxis stroke={theme.text} />
                <Tooltip contentStyle={{ background: theme.card, border: `1px solid ${theme.gold}` }} />
                <Legend />
                <Line type="monotone" dataKey="hold" stroke={theme.accent} name="Hold Strategy" strokeWidth={2} />
                <Line type="monotone" dataKey="sell" stroke={theme.gold} name="Sell Strategy" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'yearly' && (
          <div style={{ background: theme.card, padding: '20px', borderRadius: '8px', marginBottom: '40px' }}>
            <h3>Year-by-Year Cash Flow (Hold Strategy)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={holdYears.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.gold} />
                <XAxis dataKey="year" stroke={theme.text} />
                <YAxis stroke={theme.text} />
                <Tooltip contentStyle={{ background: theme.card, border: `1px solid ${theme.gold}` }} />
                <Bar dataKey="cashFlow" fill={theme.accent} name="Annual Cash Flow" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'breakdown' && (
          <div style={{ background: theme.card, padding: '20px', borderRadius: '8px', marginBottom: '40px' }}>
            <h3>Cost Breakdown (Year 1)</h3>
            <div style={{ marginTop: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Rental Income:</span>
                  <strong>${holdYears[0]?.grossRent?.toLocaleString()}</strong>
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Vacancy Loss:</span>
                  <strong style={{ color: theme.negative }}>-${holdYears[0]?.vacancy?.toLocaleString()}</strong>
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Operating Expenses:</span>
                  <strong style={{ color: theme.negative }}>-${holdYears[0]?.expenses?.toLocaleString()}</strong>
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Maintenance Reserve:</span>
                  <strong style={{ color: theme.negative }}>-${holdYears[0]?.maintenanceReserve?.toLocaleString()}</strong>
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Mortgage Payment:</span>
                  <strong style={{ color: theme.negative }}>-${holdYears[0]?.mortgage?.toLocaleString()}</strong>
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${theme.gold}`, paddingTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Net Cash Flow:</strong>
                  <strong style={{ color: holdYears[0]?.cashFlow > 0 ? theme.positive : theme.negative }}>
                    ${holdYears[0]?.cashFlow?.toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginBottom: '40px' }}>
          <button onClick={onEditAssumptions}
            style={{
              padding: '12px 24px',
              background: theme.accent,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
            Edit Assumptions
          </button>
          
          <button onClick={handleExport}
            style={{
              padding: '12px 24px',
              background: theme.gold,
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}>
            Export Report
          </button>
        </div>

        <div style={{ background: theme.card, padding: '20px', borderRadius: '8px' }}>
          <h3>Analysis Summary</h3>
          <p style={{ marginTop: '15px', lineHeight: '1.6' }}>
            Based on your property details and market assumptions, over the next 10 years:
          </p>
          <ul style={{ marginTop: '10px', lineHeight: '1.8' }}>
            <li><strong>Hold Strategy</strong> would accumulate ${scenarios.hold.totalWealth?.toLocaleString()} in total wealth through a combination of cash flow and property appreciation.</li>
            <li><strong>Sell Strategy</strong> would generate ${comparison.sell?.toLocaleString()} if proceeds are invested at 5% annual return.</li>
            <li>The <strong>{comparison.winner?.toUpperCase()} strategy</strong> provides ${Math.abs(comparison.hold - comparison.sell)?.toLocaleString()} more wealth.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
