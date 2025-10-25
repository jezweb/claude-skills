# Audio Guide (Whisper & TTS)

**Last Updated**: 2025-10-25

Complete guide to OpenAI's Audio API for transcription and text-to-speech.

---

## Whisper Transcription

### Supported Formats
- mp3, mp4, mpeg, mpga, m4a, wav, webm

### Best Practices

✅ **Audio Quality**:
- Use clear audio with minimal background noise
- 16 kHz or higher sample rate recommended
- Mono or stereo both supported

✅ **File Size**:
- Max file size: 25 MB
- For larger files: split into chunks or compress

✅ **Languages**:
- Whisper automatically detects language
- Supports 50+ languages
- Best results with English, Spanish, French, German, Chinese

❌ **Limitations**:
- May struggle with heavy accents
- Background noise reduces accuracy
- Very quiet audio may fail

---

## Text-to-Speech (TTS)

### Model Selection

| Model | Quality | Latency | Features | Best For |
|-------|---------|---------|----------|----------|
| tts-1 | Standard | Lowest | Basic TTS | Real-time streaming |
| tts-1-hd | High | Medium | Better fidelity | Offline audio, podcasts |
| gpt-4o-mini-tts | Best | Medium | Voice instructions, streaming | Maximum control |

### Voice Selection Guide

| Voice | Character | Best For |
|-------|-----------|----------|
| alloy | Neutral, balanced | General use, professional |
| ash | Clear, professional | Business, presentations |
| ballad | Warm, storytelling | Narration, audiobooks |
| coral | Soft, friendly | Customer service, greetings |
| echo | Calm, measured | Meditation, calm content |
| fable | Expressive, narrative | Stories, entertainment |
| onyx | Deep, authoritative | News, serious content |
| nova | Bright, energetic | Marketing, enthusiastic content |
| sage | Wise, thoughtful | Educational, informative |
| shimmer | Gentle, soothing | Relaxation, sleep content |
| verse | Poetic, rhythmic | Poetry, artistic content |

### Voice Instructions (gpt-4o-mini-tts only)

```typescript
// Professional tone
{
  model: 'gpt-4o-mini-tts',
  voice: 'ash',
  input: 'Welcome to our service',
  instructions: 'Speak in a calm, professional, and friendly tone suitable for customer service.',
}

// Energetic marketing
{
  model: 'gpt-4o-mini-tts',
  voice: 'nova',
  input: 'Don\'t miss this sale!',
  instructions: 'Use an enthusiastic, energetic tone perfect for marketing and advertisements.',
}

// Meditation guidance
{
  model: 'gpt-4o-mini-tts',
  voice: 'shimmer',
  input: 'Take a deep breath',
  instructions: 'Adopt a calm, soothing voice suitable for meditation and relaxation guidance.',
}
```

### Speed Control

```typescript
// Slow (0.5x)
{ speed: 0.5 } // Good for: Learning, accessibility

// Normal (1.0x)
{ speed: 1.0 } // Default

// Fast (1.5x)
{ speed: 1.5 } // Good for: Previews, time-saving

// Very fast (2.0x)
{ speed: 2.0 } // Good for: Quick previews only
```

Range: 0.25 to 4.0

### Audio Format Selection

| Format | Compression | Quality | Best For |
|--------|-------------|---------|----------|
| mp3 | Lossy | Good | Maximum compatibility |
| opus | Lossy | Excellent | Web streaming, low bandwidth |
| aac | Lossy | Good | iOS, Apple devices |
| flac | Lossless | Best | Archiving, editing |
| wav | Uncompressed | Best | Editing, processing |
| pcm | Raw | Best | Low-level processing |

---

## Common Patterns

### 1. Transcribe Interview

```typescript
const transcription = await openai.audio.transcriptions.create({
  file: fs.createReadStream('./interview.mp3'),
  model: 'whisper-1',
});

// Save transcript
fs.writeFileSync('./interview.txt', transcription.text);
```

### 2. Generate Podcast Narration

```typescript
const script = "Welcome to today's podcast...";

const audio = await openai.audio.speech.create({
  model: 'tts-1-hd',
  voice: 'fable',
  input: script,
  response_format: 'mp3',
});

const buffer = Buffer.from(await audio.arrayBuffer());
fs.writeFileSync('./podcast.mp3', buffer);
```

### 3. Multi-Voice Conversation

```typescript
// Speaker 1
const speaker1 = await openai.audio.speech.create({
  model: 'tts-1',
  voice: 'onyx',
  input: 'Hello, how are you?',
});

// Speaker 2
const speaker2 = await openai.audio.speech.create({
  model: 'tts-1',
  voice: 'nova',
  input: 'I\'m doing great, thanks!',
});

// Combine audio files (requires audio processing library)
```

---

## Cost Optimization

1. **Use tts-1 for real-time** (cheaper, faster)
2. **Use tts-1-hd for final production** (better quality)
3. **Cache generated audio** (deterministic for same input)
4. **Choose appropriate format** (opus for web, mp3 for compatibility)
5. **Batch transcriptions** with delays to avoid rate limits

---

## Common Issues

### Transcription Accuracy
- Improve audio quality
- Reduce background noise
- Ensure adequate volume levels
- Use supported audio formats

### TTS Naturalness
- Test different voices
- Use voice instructions (gpt-4o-mini-tts)
- Adjust speed for better pacing
- Add punctuation for natural pauses

### File Size
- Compress audio before transcribing
- Choose lossy formats (mp3, opus) for TTS
- Use appropriate bitrates

---

**See Also**: Official Audio Guide (https://platform.openai.com/docs/guides/speech-to-text)
