# Akiba — Digital Savings Tracker for Chamas

Akiba is a full-stack web application that helps Kenyan chamas (informal savings and investment groups) manage member savings, track contributions, and record transactions digitally — replacing manual ledgers and spreadsheets.

> 🚧 **Status:** In active development

## Features

- **Member registration** — onboard chama members with individual profiles
- **Savings & contribution tracking** — record and monitor member contributions over time
- **Transaction management** — maintain a clear, auditable record of deposits and withdrawals
- **M-Pesa integration** — powered by Safaricom's DaraJa API, enabling members to save and contribute directly via mobile money

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (TypeScript / TSX) |
| Backend | TypeScript / Node.js, REST API routes |
| API Spec | OpenAPI (YAML) |
| Payments | Safaricom DaraJa API (M-Pesa) |
| Styling | CSS |

## Why This Project

Many chamas in Kenya still rely on physical notebooks or basic spreadsheets to track member savings, which makes record-keeping error-prone and hard to audit. Akiba aims to bring these groups a simple, trustworthy digital tool built around the payment method they already use every day — M-Pesa.

## Getting Started

```bash
# Clone the repository
git clone https://github.com/32sav/akiba.git
cd akiba

# Install dependencies
npm install

# Run the development server
npm run dev
```

Environment variables for DaraJa API credentials will need to be configured — see `.env.example` (if present) or the DaraJa API documentation for setup details.

## Roadmap

- [ ] Complete member registration flow
- [ ] Finalize contribution tracking dashboard
- [ ] Full DaraJa (M-Pesa) transaction integration
- [ ] Reporting and statements for group treasurers
- [ ] Deployment

## Author

**Mark Kinyua**
Software Development student, Kabete National Polytechnic
[GitHub](https://github.com/32sav)

## License

This project is currently unlicensed / for portfolio and educational purposes.
