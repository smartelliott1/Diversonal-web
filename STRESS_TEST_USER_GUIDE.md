# Stress Test Feature - User Guide

## 🎯 Overview

The Interactive Stress Test feature allows you to simulate how your portfolio would perform under various market conditions. With 8 powerful interactive tools, you can explore scenarios, model recovery paths, and optimize your asset allocation.

---

## 🚀 Getting Started

### Step 1: Navigate to Stress Test Tab
1. Generate or load a portfolio
2. Click the **"Stress Test"** tab in the results section
3. You'll see the scenario input interface

### Step 2: Choose a Scenario
You have multiple ways to create a stress test:

#### Option A: Historical Events (Recommended for beginners)
- Click any historical event card (2008 Crisis, COVID-19, etc.)
- These use real historical data and impacts
- Perfect for understanding portfolio behavior in known scenarios

#### Option B: Quick Scenarios
- One-click scenarios for common situations
- "S&P 500 drops 10% over next year"
- "Strong bull market with 20% gains"
- "Rising interest rates and inflation"

#### Option C: Custom Text Scenario
- Type your own scenario in the input box
- Example: "Tech sector drops 25% due to regulation"
- AI analyzes and models the impact

#### Option D: Interactive Scenario Builder (Advanced)
1. Click "Scenario Builder" to expand
2. Adjust three sliders:
   - **Market Movement**: -50% to +50%
   - **Inflation**: 0% to 15%
   - **Volatility**: Low (1) to High (10)
3. Click "Run Custom Scenario"
4. AI generates analysis based on your parameters

### Step 3: Adjust Time Horizon (Optional)
- Use the **Time Horizon** slider in the right panel
- Choose: 6, 12, 18, or 24 months
- Longer horizons show more recovery potential
- Shorter horizons focus on immediate impact

---

## 📊 Understanding Your Results

### Main Metrics
- **Total Change %**: Overall portfolio performance
- **Final Value**: Your portfolio value after the scenario
- **Risk Level**: Low, Moderate, High, or Severe
- **Initial Value**: Starting portfolio value

### Asset Impact Breakdown
- Each asset class shows its individual impact
- **Green numbers**: Gains
- **Red numbers**: Losses
- Click asset chips to show/hide specific classes

### Portfolio Timeline Chart
- Shows month-by-month portfolio value
- **Hover over any point** for detailed information:
  - Exact portfolio value
  - Percentage change from start
  - Month number
  - Recovery path value (if enabled)

---

## 🔬 Advanced Features

### 1. Asset Class Filtering
**Purpose**: Focus on specific investments

**How to use:**
1. Look at the filter chips above asset impact cards
2. Click any asset class name to hide/show it
3. Use "Show All" / "Hide All" for quick control
4. Hidden assets won't appear in the breakdown

**Use case**: "I want to see only how my stocks and crypto perform"

---

### 2. Scenario History
**Purpose**: Compare multiple stress tests

**How to use:**
1. After running 2+ stress tests, a history bar appears
2. Click any previous scenario to instantly switch
3. View up to 5 recent tests
4. Each pill shows: emoji, scenario name, and % change

**Use case**: "Compare how my portfolio performs in a crash vs. inflation surge"

---

### 3. Recovery Path Modeling
**Purpose**: Model different recovery scenarios

**How to use:**
1. Run a stress test first
2. Scroll to the recovery path buttons below the chart
3. Click any recovery type:
   - **V-Shaped**: Fast recovery (2-3 quarters)
   - **U-Shaped**: Gradual recovery (4-6 quarters)
   - **L-Shaped**: Prolonged low (minimal recovery)
   - **W-Shaped**: Double-dip (recovery then second decline)
4. Purple dashed line shows the recovery path
5. Click again to remove the overlay

**Use case**: "If we have a crash, what if recovery is slow vs. fast?"

---

### 4. Live Portfolio Rebalancing
**Purpose**: Test how different allocations perform

**How to use:**
1. Look at the "Test Different Allocation" panel
2. Adjust each asset class slider
3. Watch the total % indicator (must be 100%)
4. When total is 100%, click "Test This Allocation"
5. See how the modified portfolio performs in the same scenario

**Use case**: "What if I increase bonds from 25% to 40%? Would I be more protected?"

**Tips:**
- Start with small adjustments (5-10%)
- Keep diversification in mind
- Compare results using scenario history

---

## 💡 Pro Tips

### Best Practices

1. **Test Multiple Scenarios**
   - Run both positive and negative scenarios
   - Balance optimism with realism
   - Consider sector-specific risks

2. **Use Time Horizons Strategically**
   - Short horizons (6mo) for immediate risk
   - Long horizons (24mo) for recovery potential
   - Match to your investment timeline

3. **Compare Historical Events**
   - See how 2008 vs 2020 affected portfolios differently
   - Understand which assets hedge which risks
   - Learn from real market behavior

4. **Iterate on Rebalancing**
   - Make small allocation changes
   - Test the same scenario with different allocations
   - Use history to compare results
   - Find the optimal balance

5. **Model Recovery Expectations**
   - Consider realistic recovery timelines
   - L-shaped for structural changes
   - V-shaped for temporary shocks
   - U-shaped for most scenarios

### Common Workflows

#### Workflow 1: Risk Assessment
1. Choose "2008 Financial Crisis"
2. Run with current allocation
3. Note the loss percentage
4. Adjust time horizon to 24 months
5. Model U-shaped recovery
6. Assess if you can handle the drawdown

#### Workflow 2: Allocation Optimization
1. Choose "Rising interest rates and inflation"
2. Run with current allocation
3. Note asset impacts
4. Increase commodities allocation
5. Test modified allocation
6. Compare using scenario history
7. Iterate until satisfied

#### Workflow 3: Scenario Comparison
1. Run "Market drops 10%"
2. Run "Inflation surge"
3. Run "Bull market"
4. Switch between them using history pills
5. Identify which scenario is most damaging
6. Rebalance to hedge that risk

---

## 🎨 UI Features

### Color Coding
- **Green**: Positive performance, gains, active states
- **Red**: Negative performance, losses, warnings
- **Purple**: Recovery paths, projections, advanced features
- **Cyan**: Rebalancing, testing, modifications
- **Yellow/Orange**: Moderate risk, inflation-related

### Interactive Elements
- **Hover effects**: All buttons and cards respond to hover
- **Smooth animations**: 300ms transitions throughout
- **Loading states**: Progress indicators during AI analysis
- **Toast notifications**: Success/error messages
- **Visual feedback**: Active states clearly indicated

### Space-Saving Design
- **Collapsible panels**: Scenario builder collapses when not in use
- **Side-by-side layout**: Chart and controls visible simultaneously
- **Horizontal scrolling**: History pills scroll horizontally
- **Compact controls**: Dense but readable interface
- **No scrolling needed**: Everything fits in viewport

---

## ❓ Troubleshooting

### "Portfolio must total 100%"
- Check the total % indicator in rebalancing panel
- Adjust sliders until it shows exactly 100%
- The test button is disabled until validation passes

### "Please select a stress test scenario first"
- Choose a scenario before testing modified allocation
- Historical events, quick scenarios, or custom text
- The rebalancing feature modifies an existing test

### Scenario history not appearing
- History only appears after running 2+ stress tests
- History is session-only (clears on page refresh)
- Maximum 5 scenarios stored at once

### Recovery paths look incorrect
- Recovery paths are mathematical projections, not predictions
- They model "what if" scenarios from the stress test baseline
- Different paths show different recovery speeds
- Use them for comparison, not exact forecasting

---

## 🧮 Technical Details

### Simulation Methodology
- **AI Analysis**: Claude 4 analyzes scenarios and generates impacts
- **Live Market Data**: Uses real-time prices as baseline
- **Historical Correlations**: Based on actual asset relationships
- **Fallback Algorithm**: Deterministic model if AI unavailable

### Data Points
- **Monthly granularity**: One data point per month
- **Continuous values**: Smooth interpolation between months
- **Realistic trajectories**: Non-linear paths with volatility
- **Recovery modeling**: Mathematical formulas for different patterns

### Limitations
- Projections are simulations, not guarantees
- Historical patterns may not repeat
- Black swan events are difficult to model
- Tax implications not considered
- Transaction costs not included

---

## 🎓 Learning Resources

### Understanding Risk Levels
- **Low**: < 5% expected loss, minimal volatility
- **Moderate**: 5-15% expected loss, average volatility
- **High**: 15-30% expected loss, high volatility
- **Severe**: > 30% expected loss, extreme volatility

### Asset Class Behaviors
- **Equities**: High growth potential, high risk
- **Bonds**: Stable income, inflation sensitive
- **Commodities**: Inflation hedge, volatile
- **Real Estate**: Growth + income, rate sensitive
- **Cryptocurrencies**: High risk/reward, uncorrelated
- **Cash**: Stability, inflation erosion

### Recovery Path Characteristics
- **V-Shaped**: 2-3 quarters (e.g., COVID-19 2020)
- **U-Shaped**: 4-8 quarters (e.g., Early 2000s)
- **L-Shaped**: Years (e.g., Japan 1990s)
- **W-Shaped**: Multiple cycles (e.g., 1980s recession)

---

## 📱 Mobile Usage

All features work on mobile with responsive design:
- **Touch-friendly**: Large tap targets
- **Swipe history**: Horizontal scroll for scenario pills
- **Stacked layout**: Cards stack vertically on small screens
- **Collapsible**: Panels collapse to save space
- **Pinch zoom**: Chart supports pinch to zoom

---

## 🚦 Quick Reference

| Feature | Location | Purpose |
|---------|----------|---------|
| Historical Events | Top-left grid | Quick access to real events |
| Quick Scenarios | Below historical | Common test cases |
| Custom Input | Left column bottom | Free-form scenarios |
| Time Horizon | Right sidebar top | Adjust simulation length |
| Scenario Builder | Right sidebar | Parameter-based creation |
| Scenario History | Top of results | Compare past tests |
| Asset Filtering | Right column | Focus on specific assets |
| Timeline Chart | Left column | Visual performance |
| Recovery Paths | Below chart | Model recoveries |
| Rebalancing | Right sidebar bottom | Test different allocations |

---

## 💬 Feedback & Support

### Common Questions
- Use scenario history to compare tests
- Rebalancing requires 100% total allocation
- Recovery paths are projections, not predictions
- Time horizon affects simulation length
- Asset filtering hides/shows impact cards

### Tips for Best Results
- Test multiple scenarios before making decisions
- Use historical events as benchmarks
- Consider your risk tolerance
- Match time horizon to investment period
- Iterate on rebalancing to find optimal allocation

---

**Ready to stress test your portfolio? Start by clicking any historical event card!** 🚀

