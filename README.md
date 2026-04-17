# Checkout animation principles (React + Vite + TypeScript)

Prototype implementing layouts and interactions inspired by the Figma file:
- Figma: https://www.figma.com/design/qJUKcIdxOvMguY4nfjD2wp/Checkout-Motion-Principles?node-id=81-4894&t=A5BWX1u39l2KtIJQ-4

## Default view and interactions
- Default view corresponds to the frame labelled "Expand".
- Clicking the amount in the top-right (e.g., `$50.00`) toggles to "Collapsed" and back to "Expand".
- Three collapsible sections are provided: "Ship to", "Method", and "Payment".

## Get started

```bash
cd "Checkout animation principles"
npm install
npm run dev
```

Open the local URL that Vite prints in the terminal.

## Structure
- `src/pages/CheckoutMotion.tsx`: Page with Expand/Collapsed toggle and summary
- `src/components/ShipTo.tsx`: Shipping address section (collapsible)
- `src/components/Method.tsx`: Shipping method selector (collapsible)
- `src/components/Payment.tsx`: Payment form (collapsible)
- `src/components/Collapsible.tsx`: Height-animated collapsible container
- `src/components/Section.tsx`: Shared section wrapper with chevron/toggle
- `src/styles/tokens.css`: Figma-inspired tokens (spacing, colors, timing)
- `src/styles/global.css`: Base styles and micro-utilities


