// Banking Knowledge Base
export interface BankingGuide {
  id: string;
  title: string;
  description?: string;
  category: 'account' | 'card' | 'loan' | 'transfer' | 'investment' | 'insurance' | 'general';
  steps: string[];
  importantNotes?: string[];
  links?: {
    text: string;
    url: string;
  }[];
}

export interface SelfServiceLink {
  id: string;
  title: string;
  description: string;
  url: string;
  category: 'account' | 'card' | 'loan' | 'transfer' | 'investment' | 'insurance' | 'general';
  icon?: string;
}

// Step-by-step guides for common banking issues
export const bankingGuides: BankingGuide[] = [
  {
    id: 'lost-card',
    title: 'Report Lost or Stolen Card',
    description: 'If your OCBC card is lost or stolen, report it immediately to prevent unauthorized use. Your card will be blocked instantly and a replacement will be issued.',
    category: 'card',
    steps: [
      'Call OCBC 24/7 hotline immediately: 1800 363 3333 (from Singapore) or +65 6363 3333 (from overseas)',
      'Or report via OCBC Mobile Banking app - Go to Cards > Report Lost Card',
      'Your card will be blocked immediately to prevent unauthorized transactions',
      'A replacement card will be sent within 5-7 business days to your registered address',
      'Check your account statements for any unauthorized transactions and report them immediately',
      'Update any recurring payments linked to the old card',
    ],
    importantNotes: [
      'Report immediately - you are protected from unauthorized transactions if reported within 24 hours',
      'Replacement card fee may apply (check with customer service)',
      'Keep your card details secure and never share your PIN',
    ],
    links: [
      {
        text: 'Report Lost Card Online',
        url: 'https://www.ocbc.com/personal-banking/cards/report-lost-card',
      },
      {
        text: 'OCBC Mobile Banking',
        url: 'https://www.ocbc.com/mobile-banking',
      },
      {
        text: 'Card Security Tips',
        url: 'https://www.ocbc.com/personal-banking/cards/security',
      },
    ],
  },
  {
    id: 'check-balance',
    title: 'Check Account Balance',
    description: 'Multiple convenient ways to check your account balance anytime, anywhere. View your current balance, available balance, and transaction history.',
    category: 'account',
    steps: [
      'Mobile Banking: Log in to OCBC Mobile Banking app and view balance on the home screen',
      'Internet Banking: Log in to OCBC Internet Banking and check your account dashboard',
      'ATM: Insert your card, enter PIN, and select "Balance Inquiry"',
      'SMS Banking: Text "BAL" to 72327 (charges may apply)',
      'Phone Banking: Call 1800 363 3333 and follow the automated prompts',
      'Branch: Visit any OCBC branch with your ID for balance inquiry',
    ],
    importantNotes: [
      'Available balance may differ from current balance due to pending transactions',
      'SMS banking charges may apply - check with customer service',
      'For security, never share your PIN or OTP with anyone',
    ],
    links: [
      {
        text: 'OCBC Mobile Banking',
        url: 'https://www.ocbc.com/mobile-banking',
      },
      {
        text: 'Internet Banking',
        url: 'https://www.ocbc.com/internet-banking',
      },
      {
        text: 'ATM Locator',
        url: 'https://www.ocbc.com/atm-locator',
      },
    ],
  },
  {
    id: 'open-account',
    title: 'Open a New Account',
    description: 'Open a new OCBC account online or at a branch. Choose from various account types including Savings, Current, Fixed Deposit, and more.',
    category: 'account',
    steps: [
      'Choose the account type that suits your needs (Savings, Current, Fixed Deposit, etc.)',
      'Online: Apply via OCBC website with digital submission of documents',
      'Branch: Visit any OCBC branch with required documents',
      'Required documents: NRIC/Passport (original), proof of address (utility bill, bank statement), employment letter (if applicable)',
      'Minimum initial deposit varies by account type (typically $500-$1,000 for savings)',
      'Complete the application form and submit for processing',
      'Account will be activated within 1-3 business days',
    ],
    importantNotes: [
      'You must be at least 18 years old to open an account',
      'Some accounts may require minimum balance to avoid fees',
      'Online application is faster and more convenient',
      'Bring original documents for branch applications',
    ],
    links: [
      {
        text: 'Open Account Online',
        url: 'https://www.ocbc.com/personal-banking/accounts',
      },
      {
        text: 'Account Types & Features',
        url: 'https://www.ocbc.com/personal-banking/accounts/types',
      },
      {
        text: 'Find Branch',
        url: 'https://www.ocbc.com/branch-locator',
      },
    ],
  },
  {
    id: 'transfer-money',
    title: 'Transfer Money',
    description: 'Transfer funds to other OCBC accounts, other banks, or overseas. Fast, secure, and convenient money transfers with various options available.',
    category: 'transfer',
    steps: [
      'Log in to OCBC Mobile Banking or Internet Banking',
      'Select "Transfer" or "Pay & Transfer" from the main menu',
      'Choose transfer type: OCBC to OCBC, Other Banks (FAST), or Overseas Transfer',
      'Select recipient from saved list or add new recipient (requires verification)',
      'Enter transfer amount and select source account',
      'Review transaction details including fees (if applicable)',
      'Authenticate with OTP or biometric verification',
      'Confirm transaction - OCBC to OCBC transfers are instant, FAST transfers take minutes',
    ],
    importantNotes: [
      'FAST transfers to other banks are usually instant (within minutes)',
      'Overseas transfers may take 1-3 business days and incur fees',
      'Daily transfer limits apply - check your account limits',
      'Keep recipient details accurate to avoid transfer delays',
    ],
    links: [
      {
        text: 'Mobile Banking',
        url: 'https://www.ocbc.com/mobile-banking',
      },
      {
        text: 'Transfer Guide & Fees',
        url: 'https://www.ocbc.com/personal-banking/transfers',
      },
      {
        text: 'Overseas Transfer',
        url: 'https://www.ocbc.com/personal-banking/transfers/overseas',
      },
    ],
  },
  {
    id: 'forgot-password',
    title: 'Reset Internet Banking Password',
    category: 'account',
    steps: [
      'Go to OCBC Internet Banking login page',
      'Click "Forgot Password"',
      'Enter your User ID and registered mobile number',
      'Verify with OTP sent to your mobile',
      'Set a new password following security requirements',
    ],
    links: [
      {
        text: 'Reset Password',
        url: 'https://www.ocbc.com/internet-banking/reset-password',
      },
    ],
  },
  {
    id: 'card-activation',
    title: 'Activate New Card',
    description: 'Activate your new OCBC credit or debit card to start using it. Activation is quick and can be done via phone, mobile app, or ATM.',
    category: 'card',
    steps: [
      'Receive your new card via registered mail (usually within 5-7 business days)',
      'Phone: Call OCBC hotline 1800 363 3333 and follow automated prompts',
      'Mobile App: Log in to OCBC Mobile Banking > Cards > Activate Card',
      'Enter card details (16-digit card number, expiry date, CVV)',
      'Verify your identity with OTP sent to registered mobile',
      'Set your PIN at any OCBC ATM within 30 days of activation',
    ],
    importantNotes: [
      'Activate your card within 30 days of receipt',
      'Your card is not active until you complete activation',
      'Keep your card details secure and never share your PIN',
      'If you don\'t receive your card, contact customer service immediately',
    ],
    links: [
      {
        text: 'Activate Card Online',
        url: 'https://www.ocbc.com/personal-banking/cards/activate-card',
      },
      {
        text: 'Card Features & Benefits',
        url: 'https://www.ocbc.com/personal-banking/cards',
      },
    ],
  },
  {
    id: 'apply-loan',
    title: 'Apply for a Personal Loan',
    description: 'Apply for a personal loan with competitive interest rates. Get instant approval and flexible repayment options.',
    category: 'loan',
    steps: [
      'Check your eligibility using OCBC Loan Calculator',
      'Choose loan amount and tenure (1-5 years typically)',
      'Apply online via OCBC website or visit a branch',
      'Submit required documents: NRIC, income proof (CPF, payslip, tax assessment)',
      'Wait for approval (usually within 1-3 business days)',
      'Review loan terms and interest rates',
      'Sign loan agreement and receive funds',
    ],
    importantNotes: [
      'Interest rates vary based on credit profile and loan amount',
      'Minimum income requirements apply (typically $30,000-$50,000 annually)',
      'Early repayment may incur fees - check terms',
      'Compare rates and terms before applying',
    ],
    links: [
      {
        text: 'Apply for Loan',
        url: 'https://www.ocbc.com/personal-banking/loans/personal-loan',
      },
      {
        text: 'Loan Calculator',
        url: 'https://www.ocbc.com/personal-banking/loans/calculator',
      },
      {
        text: 'Loan Interest Rates',
        url: 'https://www.ocbc.com/personal-banking/loans/rates',
      },
    ],
  },
  {
    id: 'investment-account',
    title: 'Open Investment Account',
    description: 'Start investing with OCBC. Open an investment account to trade stocks, bonds, and other investment products.',
    category: 'investment',
    steps: [
      'Choose investment account type (Cash, Margin, or Custody account)',
      'Apply online or visit OCBC Securities branch',
      'Submit required documents: NRIC, proof of address, income proof',
      'Complete risk assessment questionnaire',
      'Fund your account with minimum initial deposit (typically $1,000)',
      'Account will be activated within 2-3 business days',
      'Start trading via OCBC Securities platform or mobile app',
    ],
    importantNotes: [
      'Investment involves risk - read all terms and conditions',
      'Minimum deposit requirements vary by account type',
      'Trading fees and commissions apply',
      'Complete risk assessment is mandatory',
    ],
    links: [
      {
        text: 'Open Investment Account',
        url: 'https://www.ocbc.com/personal-banking/investments',
      },
      {
        text: 'Investment Products',
        url: 'https://www.ocbc.com/personal-banking/investments/products',
      },
      {
        text: 'Trading Platform',
        url: 'https://www.ocbc.com/personal-banking/investments/trading',
      },
    ],
  },
  {
    id: 'update-profile',
    title: 'Update Personal Information',
    description: 'Update your personal details like address, phone number, email, or employment information with OCBC.',
    category: 'account',
    steps: [
      'Log in to OCBC Internet Banking or Mobile Banking',
      'Go to Profile or Settings section',
      'Select the information you want to update',
      'Enter new details and verify with OTP',
      'For address change: Upload proof of address document',
      'For phone/email: Verify with OTP sent to new number/email',
      'Submit changes for processing',
      'Changes take effect within 1-2 business days',
    ],
    importantNotes: [
      'Keep your contact details updated for security alerts',
      'Address changes require proof of address document',
      'Some changes may require branch visit',
      'Update immediately if you change phone number',
    ],
    links: [
      {
        text: 'Update Profile Online',
        url: 'https://www.ocbc.com/internet-banking/profile',
      },
      {
        text: 'Contact Us',
        url: 'https://www.ocbc.com/contact-us',
      },
    ],
  },
  {
    id: 'block-unblock-card',
    title: 'Block or Unblock Card',
    description: 'Temporarily block your card if misplaced, then unblock it when found. Quick and easy card management.',
    category: 'card',
    steps: [
      'Log in to OCBC Mobile Banking app',
      'Go to Cards section',
      'Select the card you want to block/unblock',
      'Tap "Block Card" or "Unblock Card"',
      'Confirm action with OTP or biometric verification',
      'Card will be blocked/unblocked immediately',
      'You can unblock anytime if you find your card',
    ],
    importantNotes: [
      'Blocking prevents new transactions but existing authorizations may still go through',
      'You can unblock your card anytime via mobile app',
      'If card is permanently lost, report it instead of just blocking',
      'Blocked cards cannot be used for any transactions',
    ],
    links: [
      {
        text: 'Manage Cards',
        url: 'https://www.ocbc.com/mobile-banking/cards',
      },
      {
        text: 'Card Security',
        url: 'https://www.ocbc.com/personal-banking/cards/security',
      },
    ],
  },
];

// Self-service links
export const selfServiceLinks: SelfServiceLink[] = [
  {
    id: 'mobile-banking',
    title: 'OCBC Mobile Banking',
    description: 'Bank on the go with our mobile app. Check balances, transfer funds, pay bills, and more.',
    url: 'https://www.ocbc.com/mobile-banking',
    category: 'general',
    icon: '📱',
  },
  {
    id: 'internet-banking',
    title: 'Internet Banking',
    description: 'Access your accounts online 24/7. Full banking services from your computer.',
    url: 'https://www.ocbc.com/internet-banking',
    category: 'account',
    icon: '💻',
  },
  {
    id: 'branch-locator',
    title: 'Find a Branch',
    description: 'Locate nearest OCBC branch, ATM, or self-service kiosk. View hours and services.',
    url: 'https://www.ocbc.com/branch-locator',
    category: 'general',
    icon: '📍',
  },
  {
    id: 'card-services',
    title: 'Card Services',
    description: 'Manage your credit and debit cards. Activate, block, view statements, and more.',
    url: 'https://www.ocbc.com/personal-banking/cards',
    category: 'card',
    icon: '💳',
  },
  {
    id: 'loan-calculator',
    title: 'Loan Calculator',
    description: 'Calculate your loan eligibility, monthly payments, and interest rates instantly.',
    url: 'https://www.ocbc.com/personal-banking/loans/calculator',
    category: 'loan',
    icon: '💰',
  },
  {
    id: 'investment-platform',
    title: 'Investment Platform',
    description: 'Trade stocks, bonds, and other investment products. Real-time market data and analysis.',
    url: 'https://www.ocbc.com/personal-banking/investments',
    category: 'investment',
    icon: '📈',
  },
  {
    id: 'insurance-products',
    title: 'Insurance Products',
    description: 'Protect what matters. Life, health, travel, and home insurance options.',
    url: 'https://www.ocbc.com/personal-banking/insurance',
    category: 'insurance',
    icon: '🛡️',
  },
  {
    id: 'contact-us',
    title: 'Contact Us',
    description: 'Get in touch with OCBC. 24/7 hotline, live chat, email support, and branch locations.',
    url: 'https://www.ocbc.com/contact-us',
    category: 'general',
    icon: '📞',
  },
  {
    id: 'faq',
    title: 'Frequently Asked Questions',
    description: 'Find answers to common banking questions. Quick help and troubleshooting guides.',
    url: 'https://www.ocbc.com/faq',
    category: 'general',
    icon: '❓',
  },
  {
    id: 'security-tips',
    title: 'Security Tips',
    description: 'Learn how to protect your accounts. Fraud prevention and online security best practices.',
    url: 'https://www.ocbc.com/security',
    category: 'general',
    icon: '🔒',
  },
];

// Banking query detection
export function detectBankingQuery(message: string): {
  type: string | null;
  guide: BankingGuide | null;
  links: SelfServiceLink[];
} {
  const lowerMessage = message.toLowerCase();
  
  // Detect query type
  let queryType: string | null = null;
  let guide: BankingGuide | null = null;
  const relevantLinks: SelfServiceLink[] = [];

  // Check for lost card
  if (
    lowerMessage.includes('lost card') ||
    lowerMessage.includes('stolen card') ||
    lowerMessage.includes('card missing') ||
    lowerMessage.includes('report card')
  ) {
    queryType = 'lost-card';
    guide = bankingGuides.find((g) => g.id === 'lost-card') || null;
    relevantLinks.push(...selfServiceLinks.filter((l) => l.category === 'card'));
  }

  // Check for balance inquiry
  if (
    lowerMessage.includes('balance') ||
    lowerMessage.includes('check balance') ||
    lowerMessage.includes('account balance') ||
    lowerMessage.includes('how much')
  ) {
    queryType = 'balance';
    guide = bankingGuides.find((g) => g.id === 'check-balance') || null;
    relevantLinks.push(...selfServiceLinks.filter((l) => l.category === 'account'));
  }

  // Check for account opening
  if (
    lowerMessage.includes('open account') ||
    lowerMessage.includes('new account') ||
    lowerMessage.includes('create account') ||
    lowerMessage.includes('account opening')
  ) {
    queryType = 'open-account';
    guide = bankingGuides.find((g) => g.id === 'open-account') || null;
    relevantLinks.push(...selfServiceLinks.filter((l) => l.category === 'account'));
  }

  // Check for money transfer
  if (
    lowerMessage.includes('transfer') ||
    lowerMessage.includes('send money') ||
    lowerMessage.includes('pay') ||
    lowerMessage.includes('remit')
  ) {
    queryType = 'transfer';
    guide = bankingGuides.find((g) => g.id === 'transfer-money') || null;
    relevantLinks.push(...selfServiceLinks.filter((l) => l.category === 'transfer'));
  }

  // Check for password reset
  if (
    lowerMessage.includes('forgot password') ||
    lowerMessage.includes('reset password') ||
    lowerMessage.includes('change password')
  ) {
    queryType = 'password';
    guide = bankingGuides.find((g) => g.id === 'forgot-password') || null;
    relevantLinks.push(...selfServiceLinks.filter((l) => l.category === 'account'));
  }

  // Check for card activation
  if (
    lowerMessage.includes('activate card') ||
    lowerMessage.includes('new card') ||
    lowerMessage.includes('card activation')
  ) {
    queryType = 'card-activation';
    guide = bankingGuides.find((g) => g.id === 'card-activation') || null;
    relevantLinks.push(...selfServiceLinks.filter((l) => l.category === 'card'));
  }

  // Check for loan application
  if (
    lowerMessage.includes('apply loan') ||
    lowerMessage.includes('personal loan') ||
    lowerMessage.includes('loan application') ||
    lowerMessage.includes('need loan') ||
    lowerMessage.includes('borrow money')
  ) {
    queryType = 'apply-loan';
    guide = bankingGuides.find((g) => g.id === 'apply-loan') || null;
    relevantLinks.push(...selfServiceLinks.filter((l) => l.category === 'loan'));
  }

  // Check for investment account
  if (
    lowerMessage.includes('investment') ||
    lowerMessage.includes('invest') ||
    lowerMessage.includes('trading account') ||
    lowerMessage.includes('stocks') ||
    lowerMessage.includes('open investment')
  ) {
    queryType = 'investment-account';
    guide = bankingGuides.find((g) => g.id === 'investment-account') || null;
    relevantLinks.push(...selfServiceLinks.filter((l) => l.category === 'investment'));
  }

  // Check for profile update
  if (
    lowerMessage.includes('update profile') ||
    lowerMessage.includes('change address') ||
    lowerMessage.includes('change phone') ||
    lowerMessage.includes('update information') ||
    lowerMessage.includes('change details')
  ) {
    queryType = 'update-profile';
    guide = bankingGuides.find((g) => g.id === 'update-profile') || null;
    relevantLinks.push(...selfServiceLinks.filter((l) => l.category === 'account'));
  }

  // Check for block/unblock card
  if (
    lowerMessage.includes('block card') ||
    lowerMessage.includes('unblock card') ||
    lowerMessage.includes('freeze card') ||
    lowerMessage.includes('temporarily block')
  ) {
    queryType = 'block-unblock-card';
    guide = bankingGuides.find((g) => g.id === 'block-unblock-card') || null;
    relevantLinks.push(...selfServiceLinks.filter((l) => l.category === 'card'));
  }

  // Add general links if no specific category found
  if (relevantLinks.length === 0) {
    relevantLinks.push(...selfServiceLinks.slice(0, 3));
  }

  return { type: queryType, guide, links: relevantLinks };
}

