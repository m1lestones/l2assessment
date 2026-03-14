/**
 * Recommendation Templates - Context-aware recommendations based on category and urgency
 */

const actionTemplates = {
  "Billing Issue": {
    "High": "🚨 Escalate immediately to billing team. Check for payment failures, unauthorized charges, or account access issues.",
    "Medium": "Route to billing support team. Verify account status and payment history before responding.",
    "Low": "Direct customer to billing portal at [billing.example.com]. Provide FAQ link for common billing questions."
  },
  "Technical Problem": {
    "High": "🚨 URGENT: Escalate to engineering team immediately. This may be a production issue affecting multiple users.",
    "Medium": "Create support ticket and route to technical team. Request error logs, browser info, and steps to reproduce.",
    "Low": "Provide troubleshooting steps: clear cache, try different browser, check internet connection. Include link to technical FAQ."
  },
  "General Inquiry": {
    "High": "Respond promptly with direct answer. May indicate time-sensitive question or customer confusion.",
    "Medium": "Respond with relevant FAQ link and offer to clarify further if needed.",
    "Low": "Send automated response with FAQ resources and self-service links."
  },
  "Feature Request": {
    "High": "Forward to product team with priority flag. Customer may be considering alternatives - include account manager.",
    "Medium": "Log feature request in product feedback system. Send acknowledgment and timeline if available.",
    "Low": "Thank customer for feedback. Add to feature request backlog and provide link to product roadmap."
  },
  "Unknown": {
    "High": "⚠️ Manual review required urgently. Unable to categorize - may be complex or multi-issue message.",
    "Medium": "Flag for manual review. Unclear categorization suggests hybrid issue or unusual request.",
    "Low": "Route to general support queue for manual triage."
  }
}

/**
 * Get recommended action for a given category and urgency level
 *
 * @param {string} category - The message category
 * @param {string} urgency - The urgency level (High/Medium/Low)
 * @returns {string} - Context-aware recommended next step
 */
export function getRecommendedAction(category, urgency = "Medium") {
  const categoryTemplates = actionTemplates[category];

  if (!categoryTemplates) {
    return "⚠️ Unknown category. Route to support team for manual review.";
  }

  // If category has urgency-specific templates, use them
  if (typeof categoryTemplates === 'object') {
    return categoryTemplates[urgency] || categoryTemplates["Medium"];
  }

  // Fallback to simple template (backward compatibility)
  return categoryTemplates;
}

/**
 * Get all available categories
 * 
 * @returns {string[]} - List of categories
 */
export function getAvailableCategories() {
  return Object.keys(actionTemplates)
}

/**
 * Determines if message should be escalated to senior support or management
 *
 * @param {string} category - The message category
 * @param {string} urgency - The urgency level
 * @param {number} confidence - Confidence score (0-100)
 * @returns {boolean} - Whether to escalate
 */
export function shouldEscalate(category, urgency, confidence = 100) {
  // Always escalate high urgency issues
  if (urgency === "High") {
    return true;
  }

  // Escalate if confidence is low (uncertain categorization)
  if (confidence < 50) {
    return true;
  }

  // Escalate critical categories even at medium urgency
  if (urgency === "Medium" && (category === "Billing Issue" || category === "Technical Problem")) {
    return true;
  }

  return false;
}
