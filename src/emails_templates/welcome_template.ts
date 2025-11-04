type PaymentPart = {
  title: string;
  description: string;
};

type CountryInfo = {
  name: string;
  positions: string[];
  salary?: string;
  workingHours?: string;
  eligibility: string;
  englishRequirement?: string;
  benefits?: string[];
  requirements: string[];
  timeframe: string;
  paymentStructure?: PaymentPart[];
  additionalNotes?: string[];
};

const defaultPaymentStructure: PaymentPart[] = [
  {
    title: "Part 1: EUR [initial] (Prepayment to Start Processing)",
    description:
      "After receiving the initial payment, we begin preparing all necessary supportive documents, including the work permit, to ensure a smooth application process."
  },
  {
    title: "Part 2: EUR [post-permit] (after work permit is issued)",
    description:
      "Once the work permit has been successfully issued, we dispatch the documents via DHL post and guide you through the visa application process."
  },
  {
    title: "Part 3: EUR [final] (after visa issuance)",
    description:
      "After the visa has been issued, the final payment is due within 7 days."
  }
];

const countries: CountryInfo[] = [
  {
    name: "Poland",
    positions: [
      "Warehouse Worker",
      "Welder (MIG/TIG)",
      "General Construction Worker",
      "Bakery / Food Factory Worker",
      "CNC / Machine Operator",
      "Forklift Operator",
      "Packaging & Sorting Worker",
      "Kitchen Helper / Dishwasher",
      "Hotel Cleaner / Housekeeper",
      "Laundry Staff (Hotels & Hospitals)",
      "Painter / Plasterer",
      "Agricultural Worker (Seasonal)",
      "Plastic Molding Worker",
      "Parcel Sorter (Logistics)"
    ],
    salary: "PLN 30.50/hour (net)",
    workingHours: "40 hours per week (8-10 hours per day, 5 days per week)",
    eligibility: "Male/Female, ages 18-55",
    englishRequirement: "Basic level of English",
    requirements: [
      "Valid passport (scanned copy, all pages)",
      "CV/Bio-data with address"
    ],
    timeframe: "Documents ready in 60-90 days",
    additionalNotes: [
      "Note: The flight ticket is provided by the employer at no additional cost to the candidate."
    ]
  },
  {
    name: "Germany",
    positions: ["Construction Work"],
    salary: "EUR 1,800 gross per month",
    workingHours: "40 hours per week (8-10 hours per day, 5 days per week)",
    eligibility: "Male/Female, ages 18-55",
    englishRequirement: "Basic level of English",
    requirements: [
      "Valid passport (scanned copy, all pages)",
      "CV/Bio-data with address",
      "B1 German language certificate"
    ],
    timeframe: "Documents ready in 30-45 days",
    additionalNotes: [
      "Note: The flight ticket is provided by the employer at no additional cost to the candidate."
    ]
  },
  {
    name: "Belarus",
    positions: ["Seamstress", "Taxi Driver", "Construction Worker"],
    salary: "EUR 1,100 per month",
    workingHours: "40 hours per week (8-10 hours per day, 5 days per week)",
    eligibility: "Male/Female, ages 18-55",
    englishRequirement: "Basic level of English",
    requirements: [
      "Valid passport (scanned copy, all pages)",
      "CV/Bio-data with address",
      "Valid B driver's license for taxi driver plus translation into Russian"
    ],
    timeframe: "Documents ready in 15-30 days",
    additionalNotes: [
      "Note: The flight ticket is provided by the employer at no additional cost to the candidate."
    ]
  },
  {
    name: "Slovakia",
    positions: [
      "Automobile Plant Manufacturing (Seats)",
      "Auxiliary Worker in Car Factory",
      "Welder (MIG/MAG/TIG)",
      "Assembly Operator"
    ],
    salary: "EUR 900-1,200/month (gross) depending on the role",
    eligibility:
      "Male/Female, ages 20-50 for general roles, 20-40 for welding/assembly",
    requirements: [
      "Valid passport (scanned copy, all pages)",
      "CV/Bio-data with address"
    ],
    timeframe: "Documents ready in 40-55 days",
    additionalNotes: [
      "Note: The flight ticket is provided by the employer at no additional cost to the candidate."
    ]
  },
  {
    name: "Croatia",
    positions: ["Delivery Rider"],
    salary: "EUR 1,000 per month",
    eligibility: "Flexible work schedule with official employment",
    benefits: [
      "Free accommodation",
      "Company-provided scooter for work",
      "Preparation of all necessary documents"
    ],
    requirements: [
      "Euro Pass CV",
      "Education certificate",
      "Police clearance certificate",
      "Passport scan copy"
    ],
    timeframe: "Documents ready in 40-55 days",
    additionalNotes: [
      "Note: The flight ticket is provided by the employer at no additional cost to the candidate."
    ]
  },
  {
    name: "Lithuania",
    positions: ["Truck Driver"],
    salary: "EUR 2,500-2,700 per month (net)",
    eligibility: "Male/Female, ages 25-50",
    benefits: [
      "Accommodation provided",
      "Medical insurance",
      "Uniform supplied by employer"
    ],
    requirements: [
      "Valid passport (scanned copy, all pages)",
      "Police clearance certificate",
      "Valid C+E driving license"
    ],
    timeframe: "Documents ready in 40-55 days",
    additionalNotes: [
      "Note: The flight ticket is provided by the employer at no additional cost to the candidate."
    ]
  },
  {
    name: "Czech Republic",
    positions: ["Warehouse Worker", "Construction Worker"],
    salary: "EUR 950-1,200 per month (gross)",
    eligibility: "Male candidates, ages 18-50",
    requirements: [
      "Valid passport (scanned copy, all pages)",
      "CV/Bio-data with address"
    ],
    timeframe: "Documents ready in 35-45 days",
    additionalNotes: [
      "Note: The flight ticket is provided by the employer at no additional cost to the candidate."
    ]
  },
  {
    name: "Serbia",
    positions: ["Construction Worker", "General Cleaner"],
    salary: "EUR 800-1,000 per month (net)",
    eligibility: "Male/Female, ages 18-50",
    requirements: [
      "Valid passport (scanned copy, all pages)",
      "CV/Bio-data with address",
      "Education certificate/diploma with apostille translated into Serbian"
    ],
    timeframe: "Documents ready in 30-40 days",
    additionalNotes: [
      "Note: The flight ticket is provided by the employer at no additional cost to the candidate."
    ]
  },
  {
    name: "Romania",
    positions: ["Warehouse Work"],
    salary: "EUR 600-800 per month (net)",
    eligibility: "Male/Female, ages 20-50",
    requirements: [
      "Valid passport (scanned copy, all pages)",
      "CV/Bio-data with address"
    ],
    timeframe: "Documents ready in 25-30 days",
    additionalNotes: [
      "Note: The flight ticket is provided by the employer at no additional cost to the candidate."
    ]
  },
  {
    name: "Ukraine",
    positions: ["Construction (Handyman, Foreman)"],
    salary: "EUR 600-700 per month (net)",
    eligibility: "Male/Female, ages 20-50",
    requirements: [
      "Valid passport (scanned copy, all pages)",
      "CV/Bio-data with address"
    ],
    timeframe: "Documents ready in 25-30 days",
    additionalNotes: [
      "Note: The flight ticket is provided by the employer at no additional cost to the candidate."
    ]
  }
];

export type WelcomeTemplateProps = {
  candidateName?: string;
  contactPerson?: string;
  whatsappLink?: string;
};

export const WELCOME_TEMPLATE_SUBJECT =
  "EU Career Serwis - Comprehensive Work Permit Assistance";

function generateEmailHTML({
  candidateName = "Candidate",
  contactPerson = "the Asian, African, and European Manpower Recruitment Manager at EU Career Serwis",
  whatsappLink = "https://wa.me/48787277555"
}: WelcomeTemplateProps = {}): string {
  const renderCountrySection = (country: CountryInfo): string => {
    const paymentStructure =
      country.paymentStructure || defaultPaymentStructure;

    return `
      <div style="padding: 16px 0;">
        <h2 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 12px 0;">${
          country.name
        }</h2>
        
        <p style="color: #475569; font-size: 14px; line-height: 20px; margin: 12px 0 6px; font-weight: 600;">Positions Available:</p>
        <ul style="margin: 0 0 12px; padding-left: 20px; color: #1e293b; font-size: 14px; line-height: 20px;">
          ${country.positions
            .map((role) => `<li style="margin-bottom: 6px;">${role}</li>`)
            .join("")}
        </ul>
        
        ${
          country.salary
            ? `<p style="color: #1e293b; font-size: 14px; line-height: 20px; margin: 0 0 12px;"><strong>Salary:</strong> ${country.salary}</p>`
            : ""
        }
        
        ${
          country.workingHours
            ? `<p style="color: #1e293b; font-size: 14px; line-height: 20px; margin: 0 0 12px;"><strong>Working Hours:</strong> ${country.workingHours}</p>`
            : ""
        }
        
        <p style="color: #1e293b; font-size: 14px; line-height: 20px; margin: 0 0 12px;"><strong>Eligibility:</strong> ${
          country.eligibility
        }</p>
        
        ${
          country.englishRequirement
            ? `<p style="color: #1e293b; font-size: 14px; line-height: 20px; margin: 0 0 12px;"><strong>English Proficiency:</strong> ${country.englishRequirement}</p>`
            : ""
        }
        
        ${
          country.benefits
            ? `
          <p style="color: #475569; font-size: 14px; line-height: 20px; margin: 12px 0 6px; font-weight: 600;">Benefits:</p>
          <ul style="margin: 0 0 12px; padding-left: 20px; color: #1e293b; font-size: 14px; line-height: 20px;">
            ${country.benefits
              .map(
                (benefit) => `<li style="margin-bottom: 6px;">${benefit}</li>`
              )
              .join("")}
          </ul>
        `
            : ""
        }
        
        <p style="color: #475569; font-size: 14px; line-height: 20px; margin: 12px 0 6px; font-weight: 600;">Employment Requirements:</p>
        <ul style="margin: 0 0 12px; padding-left: 20px; color: #1e293b; font-size: 14px; line-height: 20px;">
          ${country.requirements
            .map((req) => `<li style="margin-bottom: 6px;">${req}</li>`)
            .join("")}
        </ul>
        
        <p style="color: #1e293b; font-size: 14px; line-height: 20px; margin: 0 0 12px;"><strong>Time frame:</strong> ${
          country.timeframe
        }</p>
        
        <p style="color: #475569; font-size: 14px; line-height: 20px; margin: 12px 0 6px; font-weight: 600;">Our Service Charges and Payment Policy (all payments in Euros):</p>
        <p style="color: #1e293b; font-size: 14px; line-height: 20px; margin: 0 0 12px;"><strong>Total Charge:</strong> Refer to your personalised service agreement.</p>
        <ul style="margin: 0 0 12px; padding-left: 20px; color: #1e293b; font-size: 14px; line-height: 20px;">
          ${paymentStructure
            .map(
              (part) =>
                `<li style="margin-bottom: 6px;"><strong>${part.title}:</strong> ${part.description}</li>`
            )
            .join("")}
        </ul>
        
        ${
          country.additionalNotes
            ? `
          <ul style="margin: 0 0 12px; padding-left: 20px; color: #1e293b; font-size: 14px; line-height: 20px;">
            ${country.additionalNotes
              .map((note) => `<li style="margin-bottom: 6px;">${note}</li>`)
              .join("")}
          </ul>
        `
            : ""
        }
        
        <hr style="border-color: #e2e8f0; margin: 24px 0;" />
      </div>
    `;
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EU Career Serwis - Work Permit Services</title>
</head>
<body style="background-color: #f8fafc; padding: 32px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0;">
  <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); max-width: 680px; margin: 0 auto;">
    
    <div>
      <h1 style="color: #0f172a; font-size: 22px; font-weight: 700; margin: 0 0 12px; line-height: 28px;">
        EU Career Serwis offers expert assistance in securing a General Work Permit!
      </h1>
    </div>

    <div>
      <p style="color: #1e293b; font-size: 14px; line-height: 20px; margin: 0 0 12px;">
        Dear ${candidateName}, Greetings for the Day!
      </p>
      <p style="color: #1e293b; font-size: 14px; line-height: 20px; margin: 0 0 12px;">
        Thank you for contacting EU Career Serwis. I am ${contactPerson}. We recently received your query via our website and social pages regarding professional services for work permit procedures in European countries.
      </p>
      <p style="color: #1e293b; font-size: 14px; line-height: 20px; margin: 0 0 12px;">
        We currently assist with work permit procedures for the following countries:
      </p>
      <ul style="margin: 0 0 12px; padding-left: 20px; color: #1e293b; font-size: 14px; line-height: 20px;">
        ${countries
          .map(
            (country) => `<li style="margin-bottom: 6px;">${country.name}</li>`
          )
          .join("")}
      </ul>
      <p style="color: #1e293b; font-size: 14px; line-height: 20px; margin: 0 0 12px;">
        If you have any questions, feel free to contact me on WhatsApp using this link: 
        <a href="${whatsappLink}" style="color: #1d4ed8; text-decoration: underline;">${whatsappLink}</a>
      </p>
    </div>

    ${countries.map((country) => renderCountrySection(country)).join("")}

    <div>
      <h2 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 12px 0;">Terms and Conditions</h2>
      <ul style="margin: 0 0 12px; padding-left: 20px; color: #1e293b; font-size: 14px; line-height: 20px;">
        <li style="margin-bottom: 6px;">Work permit cost covered by the employee</li>
        <li style="margin-bottom: 6px;">Visa application cost covered by the employee</li>
        <li style="margin-bottom: 6px;">Working hours: 8 hours per day</li>
        <li style="margin-bottom: 6px;">Overtime and allowances follow Polish labour laws</li>
        <li style="margin-bottom: 6px;">Accommodation provided by the employer</li>
        <li style="margin-bottom: 6px;">Food at the employee's expense</li>
        <li style="margin-bottom: 6px;">Temporary residence card provided based on contract duration</li>
        <li style="margin-bottom: 6px;">Working uniform supplied by the employer</li>
        <li style="margin-bottom: 6px;">Work environment: Indoor, minimum temperature of 14 degrees C</li>
        <li style="margin-bottom: 6px;">Nature of work: Physical labour</li>
        <li style="margin-bottom: 6px;">Income tax compliant with EU labour laws</li>
        <li style="margin-bottom: 6px;">Medical and insurance coverage provided by the employer</li>
        <li style="margin-bottom: 6px;">Holidays governed by EU labour laws</li>
        <li style="margin-bottom: 6px;">Contract period: Initial term of 1 year, renewable</li>
        <li style="margin-bottom: 6px;">Work permit validity: 1-3 years</li>
      </ul>
    </div>

    <div>
      <h2 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 12px 0;">Additional Benefits</h2>
      <ul style="margin: 0 0 12px; padding-left: 20px; color: #1e293b; font-size: 14px; line-height: 20px;">
        <li style="margin-bottom: 6px;">Free travel within 35 Schengen countries</li>
        <li style="margin-bottom: 6px;">Eligibility for permanent residency after 5 years</li>
      </ul>
    </div>

    <div>
      <h2 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 12px 0;">Important Notes</h2>
      <ul style="margin: 0 0 12px; padding-left: 20px; color: #1e293b; font-size: 14px; line-height: 20px;">
        <li style="margin-bottom: 6px;">EU Career Serwis does not charge for job placement; we provide professional services for obtaining European work permits.</li>
        <li style="margin-bottom: 6px;">Employers select candidates from the documents provided, typically for blue-collar positions.</li>
        <li style="margin-bottom: 6px;">Services are free for individuals with EU permanent residency or an EU passport.</li>
        <li style="margin-bottom: 6px;">Individuals outside the EU must follow the 15-step process and pay the service fees.</li>
        <li style="margin-bottom: 6px;">Payment after visa issuance or through salary deduction is not available.</li>
      </ul>
    </div>

    <div>
      <p style="color: #1e293b; font-size: 14px; line-height: 20px; margin: 0 0 12px;">
        If you agree to these terms and conditions, including the payment policy, please reply to this email or contact us via WhatsApp to proceed further.
      </p>
      <p style="color: #1e293b; font-size: 14px; line-height: 20px; margin: 0 0 12px;">
        We look forward to helping you take the next step in your European career journey.
      </p>
    </div>

    <div>
      <p style="color: #1e293b; font-size: 14px; line-height: 20px; margin: 0 0 12px;">Warm regards,</p>
      <p style="color: #1e293b; font-size: 14px; line-height: 20px; margin: 0 0 12px;">EU Career Serwis Team</p>
      <p style="color: #475569; font-size: 14px; line-height: 20px; margin: 12px 0 6px; font-weight: 600;">
        Professional Work Permit Services across Europe
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

const htmlToPlainText = (html: string): string =>
  html
    .replace(/<\/?(p|div|section|h[1-6])>/gi, "\n\n")
    .replace(/<li>\s*/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/ul>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

export const generateEmailPlainText = (
  props: WelcomeTemplateProps = {}
): string => htmlToPlainText(generateEmailHTML(props));

// Usage example:
// const htmlEmail = generateEmailHTML({
//   candidateName: "John Doe"
// });

export { generateEmailHTML };
export default generateEmailHTML;
