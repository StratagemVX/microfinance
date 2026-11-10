# Micro Finance Management System — Full-Stack Loan Origination & Client Banking Portal

> A Node.js/Express and MongoDB application for loan applications, staff review workflows, customer profiles, KYC, and repayment-related views. Validate deployment readiness, data protection, and financial calculations before production use.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-black.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248.svg)](https://www.mongodb.com/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3.svg)](https://getbootstrap.com/)

---

## Executive Overview

Micro Finance Management System is an end-to-end financial operations platform engineered to digitize small-loan origination and credit servicing for community development financial institutions (CDFIs) and underserved micro-entrepreneurs. The system automates the complete credit lifecycle: client onboarding, KYC profile verification, loan eligibility calculation, multi-stage approval workflows, installment repayment scheduling, and automated email receipts.

---

## Core Capabilities & Features

### Implemented Features
- **Borrower Self-Service Portal:** Transparent loan application forms, instant amortization calculators, and real-time application tracking.
- **Credit Officer & Admin Review Dashboard:** Risk profile evaluation, credit limit adjustment, and approval/rejection decision workflows.
- **Amortization & Repayment Scheduling:** Generates principal and interest breakdowns with due-date compliance matrices.
- **Transactional Notification Engine:** Robust SMTP email delivery via Nodemailer sending disbursement receipts and due-date alerts.
- **Relational Data Modeling with Mongoose:** Clean schema separation across Client Profiles, Loan Accounts, Payment Ledgers, and System Audit Logs.

---

## System Architecture

```mermaid
flowchart TD
    Client([Borrower / Client]):::user -->|Apply for Microloan| Portal[Web UI - EJS & Bootstrap 5]
    Officer([Credit Officer / Admin]):::staff -->|Underwrite / Approve| Portal
    Portal --> Server[Node.js / Express Server]
    Server --> Auth[Session & Role Authentication]
    Server --> DB[(MongoDB / Mongoose ODM)]
    Server --> Mailer[Nodemailer SMTP Service]
    Mailer -->|Disbursement Receipt Email| Client

    classDef user fill:#2563eb,stroke:#1d4ed8,color:#fff;
    classDef staff fill:#7c3aed,stroke:#6d28d9,color:#fff;
```

---

## Directory Structure

```text
microfinance/
├── public/                  # CSS stylesheets, client-side validation scripts
├── views/                   # EJS templates (loan application, admin portal, receipts)
├── routes/                  # Express controllers for loans, auth, and clients
├── models/                  # Mongoose schemas (Client, Loan, Payment, User)
├── config/                  # Database connectivity and mailer configuration
├── .env.example             # Clean environment variable specification
├── package.json             # Node dependencies and execution scripts
└── README.md                # Master repository technical documentation
```

---

## Setup & Installation

```bash
# Clone the repository
git clone https://github.com/StratagemVX/microfinance.git
cd microfinance

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start application server
npm start
```
Default application port: `http://localhost:5000` (override with `PORT`).

---

## Environment & First-Run Setup

The server requires `MONGODB_URI` and `APP_BASE_URL`. Set `JWT_SECRET` to a unique high-entropy value and configure `JWT_EXPIRY` and `PORT` as needed. Copy `.env.example` to `.env` and replace every placeholder locally; never commit the populated file.

The `npm run seed:admin` command creates initial staff accounts only when the database has none. The security remediation requires four distinct `SEED_*_PASSWORD` variables (minimum 16 characters) at seed time. Provision them through trusted environment secrets; do not put them in the repository or shell history. There is no `test` or `lint` script in the current `package.json`, and no lockfile is checked in, so dependency and automated test coverage are incomplete.

## Contributor Attribution & Profile

- **Lead Engineer:** Chethan Kumar B S (`StratagemVX`)
- **Institution:** Department of Computer Science & Engineering, MVJ College of Engineering
- **GitHub:** [https://github.com/StratagemVX](https://github.com/StratagemVX)
- **Portfolio:** [https://chethan-kumar-portfolio.vercel.app/](https://chethan-kumar-portfolio.vercel.app/)
- **LinkedIn:** [https://linkedin.com/in/chethan-kumar-b-s-781a002bb](https://linkedin.com/in/chethan-kumar-b-s-781a002bb)

## Verification and maintenance

Use the project source and package manifest as the authority for implemented features and operational commands.

### Available package scripts

- `npm run dev` — `nodemon server/server.js`
- `npm run start` — `node server/server.js`
- `npm run seed:admin` — `node server/utils/seedAdmin.js`

These are manifest-defined commands, not evidence that builds or tests have passed.

### Contribution and security notes

- Keep feature lists, architecture, screenshots, and dependencies synchronized with the implementation.
- Never commit credentials, private keys, production data, or local environment files. Use placeholder-only examples and deployment-managed secrets.
- Describe external services and environment-variable names without exposing secret values.
- Include reproduction steps and expected versus actual behavior in issue reports.
- Run relevant checks before merging. For account-seeding workflows, provision unique credentials through trusted environment configuration and never print passwords to logs.
