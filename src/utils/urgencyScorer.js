import Groq from 'groq-sdk';

/**
 * Urgency Scorer - LLM-based semantic urgency calculation
 *
 * This replaces the old rule-based system that relied on surface-level features
 * (exclamation marks, message length) with semantic understanding of urgency.
 */

// Initialize Groq client
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

/**
 * Calculate urgency using LLM to understand semantic content
 *
 * @param {string} message - The customer support message
 * @returns {Promise<{urgency: string, reasoning: string, confidence: number}>}
 */
export async function calculateUrgency(message) {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert customer support triage specialist. Analyze the urgency of customer messages based on:

1. **Severity Impact**: Production down, payment failures, data loss = High
2. **Time Sensitivity**: "now", "urgent", "immediately", "can't access" = High
3. **Customer Impact**: Revenue-blocking, multiple users affected = High
4. **Issue Type**:
   - Critical bugs/outages = High
   - Payment/billing issues = Medium to High
   - Feature requests = Low
   - General questions = Low
   - Positive feedback = Low
5. **Sentiment**: Frustrated urgent issues vs casual inquiries

Ignore superficial indicators like:
- Exclamation marks (could be enthusiasm, not urgency)
- Message length (short messages can be critical: "server down")
- Politeness (polite messages can still be urgent)

Return your analysis in this exact format:
URGENCY: [High/Medium/Low]
CONFIDENCE: [0-100]
REASONING: [1-2 sentence explanation of why this urgency level]`
        },
        {
          role: "user",
          content: `Analyze the urgency of this customer message:\n\n"${message}"`
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent urgency scoring
      max_tokens: 200
    });

    const content = response.choices[0].message.content;
    return parseLLMUrgencyResponse(content);

  } catch (error) {
    console.warn('LLM urgency scoring failed, using fallback:', error.message);
    return getFallbackUrgency(message);
  }
}

/**
 * Parse the LLM response to extract urgency, confidence, and reasoning
 */
function parseLLMUrgencyResponse(content) {
  const lines = content.split('\n').filter(line => line.trim());

  let urgency = "Medium"; // Default
  let confidence = 70;
  let reasoning = "Unable to parse LLM response";

  for (const line of lines) {
    if (line.toUpperCase().startsWith('URGENCY:')) {
      const match = line.match(/urgency:\s*(high|medium|low)/i);
      if (match) {
        urgency = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      }
    } else if (line.toUpperCase().startsWith('CONFIDENCE:')) {
      const match = line.match(/confidence:\s*(\d+)/i);
      if (match) {
        confidence = parseInt(match[1]);
      }
    } else if (line.toUpperCase().startsWith('REASONING:')) {
      reasoning = line.substring(line.indexOf(':') + 1).trim();
    }
  }

  return { urgency, reasoning, confidence };
}

/**
 * Improved fallback urgency scorer for when LLM is unavailable
 * Uses semantic keywords instead of surface features
 */
function getFallbackUrgency(message) {
  const lowerMessage = message.toLowerCase();

  // High urgency keywords - production/service issues
  const highUrgencyKeywords = [
    'down', 'outage', 'broken', 'critical', 'emergency', 'urgent',
    'immediately', 'asap', 'production', 'server', 'database',
    'crash', 'lost data', 'can\'t access', 'can\'t login', 'locked out',
    'payment failed', 'charged twice', 'unauthorized charge'
  ];

  // Medium urgency keywords - issues that need attention
  const mediumUrgencyKeywords = [
    'bug', 'error', 'issue', 'problem', 'not working', 'broken',
    'slow', 'loading', 'timeout', 'help', 'support needed'
  ];

  // Low urgency indicators - questions, feedback, requests
  const lowUrgencyIndicators = [
    'thank', 'thanks', 'appreciate', 'love', 'great', 'excellent',
    'feedback', 'suggestion', 'feature request', 'would like',
    'could you add', 'enhancement', 'when will', 'how do i',
    'what is', 'can i', 'is there a way'
  ];

  // Check for high urgency
  for (const keyword of highUrgencyKeywords) {
    if (lowerMessage.includes(keyword)) {
      return {
        urgency: "High",
        reasoning: `Contains critical keyword "${keyword}" indicating urgent issue requiring immediate attention.`,
        confidence: 75
      };
    }
  }

  // Check for low urgency (questions, feedback)
  for (const indicator of lowUrgencyIndicators) {
    if (lowerMessage.includes(indicator)) {
      return {
        urgency: "Low",
        reasoning: "Message appears to be feedback, question, or feature request - not time-sensitive.",
        confidence: 70
      };
    }
  }

  // Check for medium urgency
  for (const keyword of mediumUrgencyKeywords) {
    if (lowerMessage.includes(keyword)) {
      return {
        urgency: "Medium",
        reasoning: `Contains issue-related keyword "${keyword}" - needs attention but not critical.`,
        confidence: 65
      };
    }
  }

  // Default to low for very short messages or unclear content
  if (message.trim().length < 15) {
    return {
      urgency: "Low",
      reasoning: "Message too short to determine urgency - likely a simple question or greeting.",
      confidence: 50
    };
  }

  return {
    urgency: "Medium",
    reasoning: "Unable to determine urgency level with confidence - recommend manual review.",
    confidence: 40
  };
}
