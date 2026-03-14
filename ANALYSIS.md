# Customer Inbox Triage - Assessment Analysis

## Executive Summary

After reviewing the codebase and testing with the provided sample messages, I've identified critical flaws in the triage system that would significantly impact Relay AI's business value. The current implementation uses naive heuristics that often produce incorrect results.

## Top 3 Areas for Improvement

### 1. 🚨 **CRITICAL: Urgency Scoring is Fundamentally Broken**

**Current Implementation** (`src/utils/urgencyScorer.js`):
- Uses exclamation mark counting (+30 points per `!`)
- Penalizes short messages (-40 to -60 points for <50 chars)
- Considers time of day and day of week
- Completely ignores semantic content

**Problems**:
```javascript
// Example: "Server down now" → Low urgency ❌
// - Only 15 chars → -60 points
// - No exclamation marks → no bonus
// - Result: Low urgency for critical production issue!

// Example: "Thank you! Great service! Love it!" → High urgency ❌
// - 3 exclamation marks → +90 points
// - Result: High urgency for positive feedback!
```

**Impact on Business**:
- Critical issues get deprioritized (lost revenue, SLA breaches)
- Non-urgent messages waste agent time
- Customer satisfaction suffers
- Defeats the entire purpose of a triage system

**Recommendation**: Replace rule-based scoring with LLM-based semantic urgency detection

---

### 2. ❌ **Recommendation Templates are Wrong and Generic**

**Current Implementation** (`src/utils/templates.js`):
```javascript
const actionTemplates = {
  "Billing Issue": "Ask user to check billing portal.",
  "Technical Problem": "Suggest user to restart their browser.",
  "Feature Request": "Ask user to check billing portal.", // ← WRONG!
  "General Inquiry": "Respond with FAQ link.",
}
```

**Problems**:
- Feature Request → "check billing portal" makes no sense
- Technical Problem → "restart browser" is too generic
- Doesn't consider urgency level (accepts parameter but ignores it)
- No escalation path for urgent issues
- Template mismatch destroys user trust

**Impact on Business**:
- Customers receive irrelevant responses
- Reduces confidence in AI system
- Requires manual review anyway

**Recommendation**: Context-aware recommendations based on category + urgency + keywords

---

### 3. 🎯 **LLM Prompting and Category Extraction is Poor**

**Current Implementation** (`src/utils/llmHelper.js`):
```javascript
// Line 27: Vague prompt
content: `Categorize this customer support message: ${message}`

// Lines 39-47: String matching extraction instead of structured output
if (content.toLowerCase().includes('billing')) {
  category = "Billing Issue";
} else if (content.toLowerCase().includes('technical')...
```

**Problems**:
- No clear instructions or category definitions
- No examples (zero-shot learning)
- Category extraction uses brittle string matching
- No structured output format
- Inconsistent results across similar messages
- No confidence scores

**Impact on Business**:
- Inconsistent categorization
- Hybrid messages (billing + technical) get random results
- No way to flag low-confidence predictions for human review

**Recommendation**: Use structured output with clear category definitions and confidence scores

---

## Additional Issues Found

### 4. No Input Validation
- Can submit single character messages ("hi")
- No minimum character requirement
- No quality checks

### 5. Unused Urgency Parameter
- `getRecommendedAction(category, urgency)` accepts urgency but doesn't use it (line 20)
- `shouldEscalate()` function is pointless (just checks `message.length > 100`)

### 6. Mock Fallback Inconsistency
- Mock categorization logic differs from real LLM logic
- Different categories and reasoning styles

---

## Proposed Implementation Priority

### Phase 1 (Highest Impact): Fix Urgency Scoring ⭐
**Why this first:**
- Directly impacts business value (wrong prioritization = angry customers)
- Relatively isolated change
- We already have LLM infrastructure
- Quick win with measurable impact

**Implementation:**
- Replace rule-based scorer with LLM-based urgency detection
- Consider: content semantics, issue severity, customer sentiment
- Return urgency level + reasoning
- Add confidence score

### Phase 2: Fix Recommendation System
**Implementation:**
- Context-aware templates based on category + urgency
- Add escalation paths for high-urgency issues
- Include confidence thresholds for human review

### Phase 3: Improve LLM Prompting
**Implementation:**
- Structured output (JSON)
- Clear category definitions with examples
- Confidence scores
- Handle multi-category messages

---

## Test Cases to Validate Improvements

From `sample-messages.json`:

1. ✅ "Database connection lost" → Should be High urgency (currently Low)
2. ✅ "Thank you so much! ..." → Should be Low urgency (currently High)
3. ✅ "Server down now" → Should be High urgency (currently Low)
4. ✅ Feature requests should get relevant recommendations (not "check billing portal")
5. ✅ Hybrid messages (billing + technical) should be handled consistently

---

## Conclusion

The **urgency scoring system** is the most critical issue affecting Relay AI's value proposition. Implementing semantic urgency detection will:
- Improve customer satisfaction through proper prioritization
- Reduce support costs by routing urgent issues correctly
- Build trust in the AI system
- Provide a foundation for future improvements

**Recommended Next Step**: Implement LLM-based urgency scoring as Phase 1.
