---
name: business-intelligence
description: Perform 14D business DNA mapping and strategic risk auditing. Use this skill to evaluate product ideas, simulate market gravity, and predict long-term sustainability using the DRTA engine logic.
---

# Lemeone Business Intelligence Skill

This skill transforms Gemini CLI into a commercial gravity auditor, allowing you to stress-test product ideas against 14 dimensions of market reality.

## Core Capabilities

1. **14D DNA Mapping**: Translate any product description or PRD into a normalized 14-dimensional vector.
2. **Scientific TechDebt Auditing**: Calculate the accumulation of entropy based on industry-specific $\lambda$, product complexity, and team size.
3. **Market Collision Simulation**: Predict survival rates and user growth over 4-week market steps.
4. **Industry Gravity Analysis**: Load specific constraints and baselines for 15+ industry clusters.

## The 14D DNA Model

When auditing a project, always map it to these 14 dimensions (0.0 to 1.0):

### Product Core (D1-D4)
- **PERF**: Raw technical performance and speed.
- **DEPTH**: Functional complexity and professional grade features.
- **INTERACT**: UI/UX smoothness and aesthetic appeal.
- **STABLE**: Reliability and data safety.

### Gateways (D5-D6)
- **ENTRY**: Ease of onboarding (Low entry barrier).
- **MONETIZE**: Pricing pressure and conversion aggressiveness.

### Market Dynamics (D7-D9)
- **UNIQUE**: Differentiation and non-commodity factor.
- **SOCIAL**: Virality and collaborative features.
- **CONSISTENCY**: Output reliability and hallucination control (for AI).

### Strategic Future (D10-D13)
- **BARRIERS**: Moats, data lock-in, and switching costs.
- **ECOSYSTEM**: API, CLI, and integration support.
- **NETWORK**: Network effects and marketplace liquidity.
- **CURVE**: Long-term growth potential.

### GTM (D14)
- **AWARENESS**: Marketing reach and channel penetration.

## Scientific TechDebt Model

Technical Debt ($T_d$) is calculated using the following gravity formula:
$$\Delta T_d = 0.5 \cdot \lambda \cdot (0.5 + C_{core}) \cdot T_{entropy}$$

- **$\lambda$ (Industry Lambda)**: Industry volatility (e.g., GenAI = 2.0, B2B SaaS = 0.4).
- **$C_{core}$ (Core Complexity)**: Average of D1 to D4.
- **$T_{entropy}$ (Team Entropy)**: SOLO=0.8, STARTUP=1.2, GROWTH=2.5, ENTERPRISE=5.0.

## Workflows

### 1. New Project Audit
When a user provides a product idea:
1. Identify the industry cluster from `references/industries/`.
2. Map the 14D vector.
3. Call `scripts/simulate.js` to project the first month.
4. Identify "Hard Constraints" (e.g., IF D5 < 0.8 -> Trigger High Churn).

### 2. Feature Impact Analysis
When adding a feature:
1. Determine which dimensions are boosted.
2. Calculate the immediate TechDebt bump ($3.0 \cdot \lambda \cdot Complexity$).
3. Rerun the simulation.

## References

- Use [references/industries/](references/industries/) to find specific industry baseline vectors and physics laws.

## Tools & Scripts

- **Simulate**: Run `node scripts/simulate.js '<JSON_STATE>'` to advance the simulation by 1 month.
  - JSON State: `{ "productVector": [...], "techDebt": 0, "techDebtLambda": 1.5, "teamSize": "STARTUP", "previousActiveUsers": 0 }`
