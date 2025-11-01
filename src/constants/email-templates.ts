
export type EmailTemplate = {
  id: string
  name: string
  subject: string
  textBody: string
  htmlBody: string
}

export const emailTemplates: EmailTemplate[] = [
  {
    id: "follow-up",
    name: "Follow-up / Next steps",
    subject: "Following up on our conversation",
    textBody: [
      "Hi {{leadName}},",
      "",
      "It was great speaking with you earlier today. I'm attaching the next steps we discussed and will be available for any questions you might have.",
      "",
      "Looking forward to your feedback.",
      "",
      "Best regards,",
      "{{senderName}}"
    ].join("\n"),
    htmlBody: `
      <p>Hi {{leadName}},</p>
      <p>It was great speaking with you earlier today. I'm attaching the next steps we discussed and will be available for any questions you might have.</p>
      <p>Looking forward to your feedback.</p>
      <p>Best regards,<br />{{senderName}}</p>
    `
  },
  {
    id: "proposal",
    name: "Proposal sent",
    subject: "Proposal sent — let's schedule a review",
    textBody: [
      "Hi {{leadName}},",
      "",
      "I've just sent over the proposal package. Please let me know if everything came through correctly.",
      "Would you be available for a quick review call later this week?",
      "",
      "Thanks,",
      "{{senderName}}"
    ].join("\n"),
    htmlBody: `
      <p>Hi {{leadName}},</p>
      <p>I've just sent over the proposal package. Please let me know if everything came through correctly.</p>
      <p>Would you be available for a quick review call later this week?</p>
      <p>Thanks,<br />{{senderName}}</p>
    `
  },
  {
    id: "check-in",
    name: "Gentle check-in",
    subject: "Just checking in",
    textBody: [
      "Hi {{leadName}},",
      "",
      "I wanted to check whether you had a chance to review the materials I shared. I'm happy to clarify anything or adjust the proposal to better match your priorities.",
      "",
      "Let me know if you'd like to set up a quick call.",
      "",
      "Warm regards,",
      "{{senderName}}"
    ].join("\n"),
    htmlBody: `
      <p>Hi {{leadName}},</p>
      <p>I wanted to check whether you had a chance to review the materials I shared. I'm happy to clarify anything or adjust the proposal to better match your priorities.</p>
      <p>Let me know if you'd like to set up a quick call.</p>
      <p>Warm regards,<br />{{senderName}}</p>
    `
  }
]
