export type EmailTemplate = {
  id: string
  name: string
  subject: string
  textBody: string
  htmlBody: string
}

export const emailTemplates: EmailTemplate[] = [
  {
    id: "agent-welcome",
    name: "Agent | Welcome + How we work",
    subject: "Welcome to EuroBridge Immigration",
    textBody: [
      "Hi {{leadName}},",
      "",
      "Welcome to EuroBridge Immigration. We are excited to guide you and your clients through a smooth relocation journey.",
      "",
      "Why partners enjoy working with us:",
      "- Dedicated visa specialists for each case",
      "- Transparent timelines and proactive status updates",
      "- End-to-end support covering paperwork, embassy liaison, and settlement advice",
      "",
      "Our process is straightforward: we begin with a discovery call, map the best route for the candidate, prepare all documentation, and keep you updated at every milestone until arrival in Europe.",
      "",
      "Let me know a convenient time to kick things off.",
      "",
      "Warm regards,",
      "{{senderName}}"
    ].join("\n"),
    htmlBody: `
      <p>Hi {{leadName}},</p>
      <p>Welcome to EuroBridge Immigration. We are excited to guide you and your clients through a smooth relocation journey.</p>
      <p>Why partners enjoy working with us:</p>
      <ul>
        <li>Dedicated visa specialists for each case</li>
        <li>Transparent timelines and proactive status updates</li>
        <li>End-to-end support covering paperwork, embassy liaison, and settlement advice</li>
      </ul>
      <p>Our process is straightforward: we begin with a discovery call, map the best route for the candidate, prepare all documentation, and keep you updated at every milestone until arrival in Europe.</p>
      <p>Let me know a convenient time to kick things off.</p>
      <p>Warm regards,<br />{{senderName}}</p>
    `
  },
  {
    id: "employer-overview",
    name: "Employer | Hiring across Europe",
    subject: "Skilled talent for your European teams",
    textBody: [
      "Hi {{leadName}},",
      "",
      "Thank you for reaching out to EuroBridge Immigration. We help employers across Europe onboard verified, relocation-ready professionals.",
      "",
      "Current hiring pipelines we can activate immediately:",
      "- Germany: Cloud engineers, QA analysts, automotive technicians",
      "- Netherlands: Product designers, React/Node.js developers, fintech compliance specialists",
      "- Portugal: Customer success teams, English/French support agents, sales development reps",
      "",
      "We handle visa strategy, documentation, embassy scheduling, and arrival coordination so your team can focus on onboarding.",
      "",
      "Let me know which roles are top priority and we will send shortlisted profiles within 48 hours.",
      "",
      "Best regards,",
      "{{senderName}}"
    ].join("\n"),
    htmlBody: `
      <p>Hi {{leadName}},</p>
      <p>Thank you for reaching out to EuroBridge Immigration. We help employers across Europe onboard verified, relocation-ready professionals.</p>
      <p>Current hiring pipelines we can activate immediately:</p>
      <ul>
        <li><strong>Germany:</strong> Cloud engineers, QA analysts, automotive technicians</li>
        <li><strong>Netherlands:</strong> Product designers, React/Node.js developers, fintech compliance specialists</li>
        <li><strong>Portugal:</strong> Customer success teams, English/French support agents, sales development reps</li>
      </ul>
      <p>We handle visa strategy, documentation, embassy scheduling, and arrival coordination so your team can focus on onboarding.</p>
      <p>Let me know which roles are top priority and we will send shortlisted profiles within 48 hours.</p>
      <p>Best regards,<br />{{senderName}}</p>
    `
  },
  {
    id: "jobseeker-opportunities",
    name: "JobSeeker | Roles + Fees",
    subject: "European opportunities tailored for you",
    textBody: [
      "Hi {{leadName}},",
      "",
      "Great to connect with you. Based on your profile we have a few roles that might be a fit:",
      "",
      "- Software Developer | Berlin, Germany | Salary EUR 72,000/year | Agency fee EUR 1,800 (covers visa filing, relocation coaching, and post-arrival support)",
      "- Customer Experience Specialist | Lisbon, Portugal | Salary EUR 28,000/year | Agency fee EUR 1,200 (visa assistance, accommodation search, onboarding workshop)",
      "- Mechanical Technician | Ghent, Belgium | Salary EUR 41,000/year | Agency fee EUR 1,500 (work permit processing, credential recognition, settlement kit)",
      "",
      "Every package includes document review, embassy preparation, and continuous updates from your personal case manager.",
      "",
      "Reply with the role that interests you and we will schedule a preparation call within 24 hours.",
      "",
      "Looking forward to helping you relocate,",
      "{{senderName}}"
    ].join("\n"),
    htmlBody: `
      <p>Hi {{leadName}},</p>
      <p>Great to connect with you. Based on your profile we have a few roles that might be a fit:</p>
      <ul>
        <li><strong>Software Developer</strong> &mdash; Berlin, Germany &mdash; Salary EUR 72,000/year &mdash; Agency fee EUR 1,800 (covers visa filing, relocation coaching, and post-arrival support)</li>
        <li><strong>Customer Experience Specialist</strong> &mdash; Lisbon, Portugal &mdash; Salary EUR 28,000/year &mdash; Agency fee EUR 1,200 (visa assistance, accommodation search, onboarding workshop)</li>
        <li><strong>Mechanical Technician</strong> &mdash; Ghent, Belgium &mdash; Salary EUR 41,000/year &mdash; Agency fee EUR 1,500 (work permit processing, credential recognition, settlement kit)</li>
      </ul>
      <p>Every package includes document review, embassy preparation, and continuous updates from your personal case manager.</p>
      <p>Reply with the role that interests you and we will schedule a preparation call within 24 hours.</p>
      <p>Looking forward to helping you relocate,<br />{{senderName}}</p>
    `
  }
]
