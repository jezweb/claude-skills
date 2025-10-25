# OpenAI API Skill - Phase 2 Session Plan

**Created**: 2025-10-25
**Status**: Phase 1 Complete ✅ - Ready for Phase 2
**Estimated Phase 2 Time**: 3-4 hours

---

## Phase 1 Completion Summary ✅

### What's Done
1. **SKILL.md** - Complete foundation (900+ lines)
   - ✅ Full Chat Completions API documentation
   - ✅ GPT-5 series coverage with unique parameters
   - ✅ Streaming patterns (both SDK and fetch)
   - ✅ Function calling complete guide
   - ✅ Structured outputs examples
   - ✅ Vision (GPT-4o) coverage
   - ✅ Error handling section
   - ✅ Rate limits section
   - ✅ Production best practices
   - ✅ Relationship to openai-responses

2. **README.md** - Complete with comprehensive keywords ✅
   - All auto-trigger keywords
   - When to use guide
   - Quick examples
   - Known issues table
   - Token efficiency metrics

3. **Core Templates** (6 files) ✅
   - chat-completion-basic.ts
   - chat-completion-nodejs.ts
   - streaming-chat.ts
   - streaming-fetch.ts
   - function-calling.ts
   - cloudflare-worker.ts
   - package.json

4. **Reference Docs** (1 file) ✅
   - top-errors.md (10 common errors with solutions)

5. **Scripts** (1 file) ✅
   - check-versions.sh

6. **Research** ✅
   - Complete research log: `/planning/research-logs/openai-api.md`

### Current Status
- **Usable NOW**: Chat Completions fully documented and working
- **Phase 1**: Production-ready for primary use case (Chat Completions)
- **Phase 2**: Remaining APIs to be completed

---

## Phase 2 Tasks

### 1. Complete SKILL.md Sections (2-3 hours)

#### Embeddings API Section
Location: `SKILL.md` line ~600 (marked as "Phase 2")

**Content to Add**:
- Models: text-embedding-3-small, text-embedding-3-large, text-embedding-ada-002
- Custom dimensions parameter
- Batch processing patterns
- Request/response examples
- RAG integration patterns
- Dimension reduction techniques
- Token limits (8192 per input, 300k summed)

**Source**: `/planning/research-logs/openai-api.md` Section 2

#### Images API Section
Location: `SKILL.md` line ~620 (marked as "Phase 2")

**Content to Add**:
- DALL-E 3 generation (/v1/images/generations)
- Image editing (/v1/images/edits)
- Parameters: size, quality, style, response_format
- Quality settings (standard vs HD)
- Style options (vivid vs natural)
- Transparent backgrounds
- Output compression
- Request/response examples

**Source**: `/planning/research-logs/openai-api.md` Section 3

#### Audio API Section
Location: `SKILL.md` line ~640 (marked as "Phase 2")

**Content to Add**:
- Whisper transcription (/v1/audio/transcriptions)
- Text-to-Speech (/v1/audio/speech)
- Models: whisper-1, tts-1, tts-1-hd, gpt-4o-mini-tts
- 11 voices (alloy, ash, ballad, coral, echo, fable, onyx, nova, sage, shimmer, verse)
- Audio formats: mp3, opus, aac, flac, wav, pcm
- Speed control (0.25 to 4.0)
- Voice instructions (gpt-4o-mini-tts only)
- Streaming audio (sse format)
- Request/response examples

**Source**: `/planning/research-logs/openai-api.md` Section 4

#### Moderation API Section
Location: `SKILL.md` line ~660 (marked as "Phase 2")

**Content to Add**:
- Moderation endpoint (/v1/moderations)
- Model: omni-moderation-latest
- Categories: sexual, hate, harassment, self-harm, violence, etc.
- Category scores (0-1 confidence)
- Multi-modal moderation (text + images)
- Batch moderation
- Request/response examples
- Threshold recommendations

**Source**: `/planning/research-logs/openai-api.md` Section 5

### 2. Create Remaining Templates (9 files, 1-2 hours)

#### Embeddings Templates
1. **embeddings.ts** - Basic embeddings generation
   ```typescript
   // text-embedding-3-small and text-embedding-3-large examples
   // Custom dimensions
   // Batch processing
   ```

#### Images Templates
2. **image-generation.ts** - DALL-E 3 generation
   ```typescript
   // Basic generation
   // Quality and style options
   // Transparent backgrounds
   ```

3. **image-editing.ts** - Image editing
   ```typescript
   // Edit with mask
   // Transparent backgrounds
   // Compression options
   ```

#### Audio Templates
4. **audio-transcription.ts** - Whisper transcription
   ```typescript
   // File transcription
   // Supported formats
   ```

5. **text-to-speech.ts** - TTS generation
   ```typescript
   // All 11 voices
   // gpt-4o-mini-tts with instructions
   // Speed control
   // Format options
   ```

#### Moderation Templates
6. **moderation.ts** - Content moderation
   ```typescript
   // Basic moderation
   // Category filtering
   // Batch moderation
   ```

#### Advanced Templates
7. **structured-output.ts** - JSON schema validation
   ```typescript
   // Using response_format with JSON schema
   // Strict mode
   // Complex nested schemas
   ```

8. **vision-gpt4o.ts** - Vision examples
   ```typescript
   // Image via URL
   // Image via base64
   // Multiple images
   ```

9. **rate-limit-handling.ts** - Production retry logic
   ```typescript
   // Exponential backoff
   // Rate limit header monitoring
   // Queue implementation
   ```

### 3. Create Remaining Reference Docs (7 files, 1 hour)

1. **models-guide.md**
   - GPT-5 vs GPT-4o vs GPT-4 Turbo comparison table
   - When to use each model
   - Cost comparison
   - Capability matrix

2. **function-calling-patterns.md**
   - Advanced tool patterns
   - Parallel tool calls
   - Dynamic tool generation
   - Error handling in tools

3. **structured-output-guide.md**
   - JSON schema best practices
   - Complex nested schemas
   - Validation strategies
   - Error handling

4. **embeddings-guide.md**
   - Model comparison (small vs large vs ada-002)
   - Dimension selection
   - RAG patterns
   - Cosine similarity examples
   - Batch processing strategies

5. **images-guide.md**
   - DALL-E 3 prompting tips
   - Quality vs cost trade-offs
   - Style guide (vivid vs natural)
   - Transparent backgrounds use cases
   - Editing best practices

6. **audio-guide.md**
   - Voice selection guide
   - TTS vs real recordings
   - Whisper accuracy tips
   - Format selection

7. **cost-optimization.md**
   - Model selection strategies
   - Caching patterns
   - Batch processing
   - Token optimization
   - Rate limit management

### 4. Testing & Validation (30 min)

- [ ] Install skill: `./scripts/install-skill.sh openai-api`
- [ ] Test auto-discovery with Claude Code
- [ ] Verify all templates compile (TypeScript check)
- [ ] Test at least 2-3 templates end-to-end with real API calls
- [ ] Check against ONE_PAGE_CHECKLIST.md

### 5. Final Documentation (30 min)

- [ ] Update roadmap: `/planning/skills-roadmap.md`
  - Mark openai-api as complete
  - Add completion metrics (token savings, errors prevented)
  - Update status to Production Ready

- [ ] Update SKILL.md
  - Remove all "Phase 2" markers
  - Update status to "Production Ready ✅"
  - Update Last Updated date

- [ ] Create final commit message

---

## Quick Start for Phase 2 Session

### Context to Load
1. Read this file (NEXT-SESSION.md)
2. Read `/planning/research-logs/openai-api.md` for all API details
3. Review current `SKILL.md` to see structure

### First Steps
```bash
# 1. Navigate to skill directory
cd /home/jez/Documents/claude-skills/skills/openai-api

# 2. Verify current state
ls -la templates/
ls -la references/

# 3. Start with Embeddings API section
# Edit SKILL.md around line 600
```

### Development Order
1. **Embeddings** (most requested after Chat Completions)
2. **Images** (DALL-E 3 popular)
3. **Audio** (Whisper + TTS)
4. **Moderation** (simple, quick)
5. **Templates** (parallel work)
6. **Reference docs** (parallel work)
7. **Testing**
8. **Commit**

---

## Reference Files

### Already Created
- `SKILL.md` - Foundation with Chat Completions complete
- `README.md` - Complete
- `templates/chat-completion-basic.ts` ✅
- `templates/chat-completion-nodejs.ts` ✅
- `templates/streaming-chat.ts` ✅
- `templates/streaming-fetch.ts` ✅
- `templates/function-calling.ts` ✅
- `templates/cloudflare-worker.ts` ✅
- `templates/package.json` ✅
- `references/top-errors.md` ✅
- `scripts/check-versions.sh` ✅
- `/planning/research-logs/openai-api.md` ✅

### To Be Created (Phase 2)
- **Templates** (9 files)
- **References** (7 files)
- **SKILL.md sections** (4 API sections)

---

## Success Criteria

### Phase 2 Complete When:
- [ ] All 4 API sections in SKILL.md complete (Embeddings, Images, Audio, Moderation)
- [ ] All 14 templates created (6 done + 9 new = 15 total)
- [ ] All 10 reference docs created (1 done + 7 new = 8 total minimum)
- [ ] Auto-discovery working
- [ ] All templates tested
- [ ] Token savings >= 60% (measured)
- [ ] Errors prevented: 10+ (documented)
- [ ] Roadmap updated
- [ ] Committed to git
- [ ] Status: Production Ready ✅

---

## Token Efficiency Target

**Phase 1 Baseline**:
- Manual Chat Completions setup: ~10,000 tokens
- With Phase 1 skill: ~4,000 tokens
- **Savings: ~60%**

**Phase 2 Target** (full skill):
- Manual full API setup: ~21,000 tokens
- With complete skill: ~8,500 tokens
- **Target savings: ~60%**

---

## Notes

- All research is complete and documented
- Templates follow consistent patterns
- Both SDK and fetch approaches where applicable
- Focus on copy-paste ready code
- Production patterns emphasized
- Clear relationship to openai-responses skill

---

**Ready to Execute Phase 2!** 🚀

When starting next session, simply read this file and continue from Phase 2 Tasks.
