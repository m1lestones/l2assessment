# Testing Guide for Improvements

## Setup

1. **Get Groq API Key** (FREE)
   - Visit https://console.groq.com
   - Sign up (no credit card required)
   - Go to API Keys section
   - Create a new API key

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your API key:
   # VITE_GROQ_API_KEY=gsk_your_key_here
   ```

3. **Install and Run**
   ```bash
   npm install
   npm run dev
   # Visit http://localhost:5173
   ```

---

## Test Cases from `sample-messages.json`

### ✅ Test 1: Production Emergency (Incorrectly marked Low)

**Message:** `Database connection lost`

**Expected OLD Behavior:**
- Urgency: Low (too short - 24 chars)
- Issue: Critical production issue not recognized

**Expected NEW Behavior:**
- Urgency: **High** ✅
- Confidence: 90-95%
- Reasoning: Should mention production/database/critical
- Recommendation: Should include "URGENT" and "Escalate to engineering"

**How to Test:**
1. Navigate to Analyze page
2. Paste: `Database connection lost`
3. Click "Analyze Message"
4. Verify urgency is High (red badge)
5. Check confidence score is >90%
6. Read urgency reasoning - should mention severity/production

---

### ✅ Test 2: Friendly Thank You (Incorrectly marked High)

**Message:** `Thank you so much! Your team has been incredibly helpful and I really appreciate the fast response to my question earlier today!`

**Expected OLD Behavior:**
- Urgency: High (contains '!')
- Issue: Not an actual support issue

**Expected NEW Behavior:**
- Urgency: **Low** ✅
- Confidence: 85-95%
- Reasoning: Should mention positive feedback/gratitude/not urgent
- Recommendation: Should NOT include urgent escalation

**How to Test:**
1. Paste the thank you message
2. Click "Analyze Message"
3. Verify urgency is Low (green badge)
4. Confidence should be high (system is confident this is not urgent)
5. Reasoning should mention "positive feedback" or "gratitude"

---

### ✅ Test 3: Feature Request (Wrong Template)

**Message:** `Could you add an export to CSV feature? Would be really useful for my monthly reports.`

**Expected OLD Behavior:**
- Recommended action: "Ask user to check billing portal" ❌ WRONG!

**Expected NEW Behavior:**
- Category: Feature Request
- Urgency: **Low** ✅
- Recommendation: Should mention product team, feature backlog, or roadmap
- Should NOT mention billing portal

**How to Test:**
1. Paste the feature request message
2. Click "Analyze Message"
3. Verify urgency is Low
4. Check "Recommended Action" section
5. Ensure it mentions "product team" or "feature request"
6. Ensure it does NOT say "billing portal"

---

### ✅ Test 4: Urgent Short Message

**Message:** `Server down now`

**Expected OLD Behavior:**
- Urgency: Low (too short - 15 chars)
- Issue: Actually very urgent!

**Expected NEW Behavior:**
- Urgency: **High** ✅
- Confidence: 90-95%
- Reasoning: Should recognize "server down" as critical
- Recommendation: Immediate escalation

**How to Test:**
1. Paste: `Server down now`
2. Click "Analyze Message"
3. Verify urgency is High (red badge)
4. Confidence should be very high despite short message
5. Recommendation should include urgent escalation

---

### ✅ Test 5: Long Rambling Non-Urgent

**Message:** `Hi! I was just browsing through your website and noticed you have a really nice design! I especially like the color scheme and the way you've organized the navigation menu! Everything looks so professional and clean! Just wanted to share my positive feedback!`

**Expected OLD Behavior:**
- Urgency: High (multiple '!')
- Issue: Actually not urgent at all - just positive feedback

**Expected NEW Behavior:**
- Urgency: **Low** ✅
- Confidence: 80-90%
- Reasoning: Should recognize as positive feedback despite exclamation marks
- Recommendation: Standard acknowledgment, not urgent

**How to Test:**
1. Paste the long feedback message
2. Click "Analyze Message"
3. Verify urgency is Low (NOT High)
4. System should ignore exclamation marks and focus on content
5. Reasoning should mention "feedback" or "positive sentiment"

---

### ✅ Test 6: Minimal Input (No Validation)

**Message:** `hi`

**Expected OLD Behavior:**
- No validation prevents submission
- Poor quality results expected
- Automatically marked as Low urgency

**Expected NEW Behavior:**
- Urgency: Low ✅
- Confidence: **~50%** (LOW - flags for review)
- Reasoning: Should mention "too short to determine"
- Low confidence triggers quality control flag

**How to Test:**
1. Type just: `hi`
2. Click "Analyze Message"
3. Verify urgency is Low
4. **Check confidence score is low (~50%)**
5. This indicates the system recognizes poor input quality
6. In production, this would trigger manual review

---

### ✅ Test 7: Billing + Technical Hybrid

**Message:** `My payment failed and now I can't access the dashboard. Is there a bug or do I need to update my credit card?`

**Expected OLD Behavior:**
- Category unclear - could be Billing or Technical
- May produce inconsistent results

**Expected NEW Behavior:**
- Should be categorized (Billing Issue or Technical Problem)
- Urgency: **High or Medium** (payment blocking access)
- Recommendation should be appropriate for chosen category
- If uncertain, confidence score may be lower

**How to Test:**
1. Paste the hybrid message
2. Click "Analyze Message"
3. Verify it picks a reasonable category
4. Urgency should be Medium or High (blocking issue)
5. Recommendation should be relevant to category chosen
6. May have lower confidence (~60-75%) due to ambiguity

---

### ✅ Test 8: General Inquiry

**Message:** `What are your business hours?`

**Expected OLD Behavior:**
- Short message marked as Low urgency
- Simple question with generic response

**Expected NEW Behavior:**
- Category: General Inquiry
- Urgency: **Low** ✅
- Confidence: High (~85%)
- Recommendation: FAQ link or self-service resources

**How to Test:**
1. Paste: `What are your business hours?`
2. Click "Analyze Message"
3. Verify Category is General Inquiry
4. Urgency should be Low
5. Recommendation should mention FAQ or resources

---

## Additional Edge Cases to Test

### Test 9: Production Urgent with Polite Language

**Message:** `Hi team, I'm really sorry to bother you, but our production server appears to be completely down and customers can't access their accounts. Could you please help urgently? Thank you!`

**Expected Behavior:**
- Urgency: **High** (despite politeness and "thank you")
- Old system would reduce urgency for polite words
- New system should recognize critical issue despite tone

---

### Test 10: Angry Non-Urgent

**Message:** `WHY DON'T YOU HAVE DARK MODE YET!!!`

**Expected Behavior:**
- Category: Feature Request
- Urgency: **Low** (feature request, not critical issue)
- Old system might mark as High due to caps and exclamation marks
- New system should recognize this is just an emphatic feature request

---

## Success Criteria

### ✅ Urgency Accuracy
- [ ] Critical issues (server down, database lost) → High urgency
- [ ] Positive feedback → Low urgency
- [ ] Feature requests → Low urgency
- [ ] Billing/payment failures → High or Medium urgency

### ✅ Confidence Scores
- [ ] Clear messages → 70-95% confidence
- [ ] Ambiguous messages → 50-70% confidence
- [ ] Very short messages → ~50% confidence

### ✅ Recommendations
- [ ] Feature requests → Product team actions (NOT billing portal)
- [ ] High urgency → Escalation language
- [ ] Low urgency → Self-service resources
- [ ] Context-aware based on urgency level

### ✅ UI/UX
- [ ] Confidence score displayed
- [ ] Urgency reasoning shown
- [ ] Results appear in <3 seconds
- [ ] Clear color coding (red=high, yellow=medium, green=low)

---

## Performance Testing

### Parallel API Calls
The system now runs categorization and urgency scoring in parallel using `Promise.all()`.

**Test:**
1. Open browser dev tools (Network tab)
2. Analyze a message
3. Verify both LLM calls start simultaneously
4. Total time should be ~1.5-2.5 seconds (not 3-5 seconds sequential)

---

## Fallback Testing

### Test Without API Key

1. Remove API key from `.env.local` or use invalid key
2. Try analyzing a message
3. Should fall back to semantic keyword detection
4. Results should still be reasonable (better than old exclamation-mark system)

**Example:**
- "Server down" → Should still detect as High urgency using fallback keywords
- Confidence score will indicate fallback was used

---

## History Page Testing

1. Analyze several messages
2. Navigate to "History" tab
3. Verify all results are saved
4. Check that confidence scores and urgency reasoning are preserved
5. Verify old results (before improvement) don't break the UI

---

## Conclusion

These improvements should result in:
- ✅ 90%+ accuracy on urgency classification
- ✅ Contextually relevant recommendations
- ✅ Quality control through confidence scores
- ✅ Better user experience through parallel processing
- ✅ Trust in the AI system through transparent reasoning
