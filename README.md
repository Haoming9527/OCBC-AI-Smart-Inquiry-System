# OCBC AI Smart Inquiry System (OASIS)

> **OCBC Innovation Challenge Project**

An AI-powered customer inquiry system designed to streamline customer service interactions, reduce branch and call center traffic, and enhance customer experience through intelligent automation and seamless case management.

## 📋 Table of Contents

- [Overview](#overview)
- [Project Objectives](#project-objectives)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Features in Detail](#features-in-detail)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

The **OCBC AI Smart Inquiry System (OASIS)** is an intelligent customer service solution that leverages artificial intelligence to provide instant, personalized support for banking inquiries. The system seamlessly handles common customer questions, provides self-service options, and intelligently escalates complex cases to human agents with full context preservation.

This project was developed as part of the **OCBC Innovation Challenge**, demonstrating innovative approaches to modernizing customer service in the banking sector.

## 🎯 Project Objectives

- **Reduce Operational Load**: Minimize traffic at physical branches and call centers by handling routine inquiries automatically
- **Enhance Customer Satisfaction**: Provide faster, more personalized service through AI-powered assistance
- **Empower Bank Staff**: Deliver clear, summarized information about each customer's issue to enable efficient resolution
- **Improve Service Continuity**: Eliminate repetitive explanations by preserving conversation context across channels

## ✨ Key Features

### 🤖 AI-Powered Chatbot
- Instant responses to common banking inquiries (balance checks, lost card reporting, account opening information)
- Intelligent routing to relevant self-service options and website resources
- Step-by-step troubleshooting guidance for common banking issues
- Natural language understanding powered by Google Gemini AI

### 🔄 Smart Escalation System
- Automatic case transfer when chatbot cannot resolve an issue
- Complete conversation history and context preservation
- Seamless handoff to branch staff or call center agents
- Eliminates need for customers to repeat their issue

### 📱 QR Code Case Transfer
- Unique QR code generation for each escalated case
- Instant access to case summary, chat history, and key details
- Streamlined workflow for bank staff to retrieve customer information
- Mobile-friendly case viewing interface

### 📊 Admin Dashboard
- Comprehensive case management interface
- Real-time monitoring of customer inquiries
- Case export and reporting capabilities
- Sentiment analysis and customer interaction insights

## 🛠 Technology Stack

### Frontend
- **Next.js 16** - React framework with server-side rendering
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework

### Backend & AI
- **Google Gemini AI** - Natural language processing and generation
- **Next.js API Routes** - Serverless API endpoints

### Database
- **Neon Database** - Serverless PostgreSQL for persistent data storage

### Additional Libraries
- **QRCode** - QR code generation for case transfer
- **Sentiment Analysis** - Customer interaction sentiment tracking

## 🏗 Architecture

The system follows a modern full-stack architecture:

```
┌─────────────────┐
│   Web Client    │
│   (Next.js)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Routes     │
│  (Next.js API)  │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│ Gemini │ │   Neon   │
│   AI   │ │ Database │
└────────┘ └──────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/api-keys))
- Neon Database account ([Sign up here](https://neon.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/OCBC-AI-Smart-Inquiry-System.git
   cd OCBC-AI-Smart-Inquiry-System/oasis
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the `oasis` directory:
   ```env
   # Google Gemini API Key (REQUIRED)
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Neon Database Connection (REQUIRED)
   DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

The database schema will be automatically created on first run.

For detailed setup instructions, see the [oasis/README.md](oasis/README.md) file.

## 📁 Project Structure

```
OCBC-AI-Smart-Inquiry-System/
├── oasis/                    # Main application directory
│   ├── app/                  # Next.js app directory
│   │   ├── api/             # API routes
│   │   ├── admin/           # Admin dashboard
│   │   ├── case/            # Case viewing pages
│   │   └── components/      # React components
│   ├── lib/                 # Utility libraries
│   ├── data/                # Static data files
│   └── README.md            # Detailed setup guide
└── README.md                # This file
```

## 🔍 Features in Detail

### AI Chatbot Interface
- Modern, responsive chat UI with dark mode support
- Real-time message streaming
- Chat history persistence
- Context-aware responses

### Case Management
- Automatic case creation on escalation
- Case status tracking
- Export functionality for reporting
- QR code generation for each case

### Admin Dashboard
- View all customer cases
- Filter and search capabilities
- Case details and chat history access
- Export case data

## 🚀 Deployment

This project is optimized for deployment on Vercel. See the [deployment guide](oasis/README.md#-deployment-to-vercel) in the oasis README for detailed instructions.

### Quick Deploy to Vercel

1. Push your code to GitHub
2. Import the repository to Vercel
3. Configure environment variables in Vercel dashboard:
   - `GEMINI_API_KEY`
   - `DATABASE_URL`
   - `NEXT_PUBLIC_BASE_URL` (your Vercel deployment URL)
4. Deploy

## 🤝 Contributing

This project was developed for the OCBC Innovation Challenge. For questions or contributions, please contact the project team.

## 📄 License

This project is proprietary and confidential. All rights reserved.

---

**Developed for the OCBC Innovation Challenge**

For technical support or questions, please refer to the [oasis/README.md](oasis/README.md) file or contact the development team.
