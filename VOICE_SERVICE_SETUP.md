# Voice Service Setup Guide

## 🎤 Hybrid Voice Recognition Implementation

Your Intent AI platform now supports **universal voice input** across all browsers, including Brave, using a hybrid approach.

## 🚀 How It Works

### Automatic Service Selection
- **Chrome/Safari/Edge**: Uses Web Speech API (Google services)
- **Brave/Firefox**: Uses Deepgram SDK (bypasses browser restrictions)
- **Fallback**: Graceful degradation to text input

### Browser Compatibility
| Browser | Service Used | Status |
|---------|-------------|--------|
| Chrome | Web Speech API | ✅ Works perfectly |
| Safari | Web Speech API | ✅ Works perfectly |
| Edge | Web Speech API | ✅ Works perfectly |
| **Brave** | **Deepgram SDK** | ✅ **Now supported!** |
| Firefox | Deepgram SDK | ✅ Works perfectly |

## 🔧 Setup Instructions

### 1. Get Deepgram API Key (Required for Brave support)
```bash
# Visit: https://console.deepgram.com/
# Create account → Get API key
```

### 2. Add Environment Variable
```bash
# Add to your .env.local file:
NEXT_PUBLIC_DEEPGRAM_API_KEY=your-deepgram-api-key-here
```

### 3. That's It!
The system automatically detects browsers and chooses the best service.

## 🎯 User Experience

### For Chrome/Safari/Edge Users:
- Click microphone → Instant recognition
- Uses built-in browser speech services
- No additional setup required

### For Brave Users:
- System automatically uses Deepgram
- Shows helpful info: "Enhanced Voice Support: Using Deepgram"
- Same seamless experience, better privacy compliance

### For All Users:
- Real-time transcription as you speak
- Confirmation dialog to review transcribed text
- Automatic fallback to text input if voice fails
- Clear error messages with helpful guidance

## 🔒 Privacy & Security

### Web Speech API (Chrome/Safari/Edge):
- Uses Google's speech recognition services
- Audio processed on Google servers
- Standard privacy policies apply

### Deepgram (Brave/Firefox):
- Uses Deepgram's speech recognition API
- Audio processed on Deepgram servers
- Enterprise-grade privacy and security
- GDPR compliant

### Local Processing:
- Both services process audio remotely for accuracy
- No audio data stored permanently
- Transcriptions used only for intent parsing

## 🛠 Technical Implementation

### Voice Service Factory
```typescript
// Automatic service selection
const voiceService = createVoiceService({
  onTranscript: handleTranscript,
  onError: handleError,
  onStart: handleStart,
  onEnd: handleEnd
});
```

### Browser Detection
```typescript
// Intelligent browser detection
if (shouldUseDeepgram()) {
  // Use Deepgram for Brave, Firefox, or when Web Speech API unavailable
  return new DeepgramService(config);
} else {
  // Use Web Speech API for Chrome, Safari, Edge
  return new WebSpeechService(config);
}
```

## 🎤 Voice Examples That Work

### Natural Language Examples:
- "I want to save 200 dollars safely"
- "Invest 500 bucks with balanced risk"
- "Deploy 1000 dollars for maximum growth"
- "Put my money in stable coins and liquid tokens"

### The AI Parser Understands:
- **Amounts**: "200 dollars", "500 bucks", "$1000"
- **Risk Levels**: "safely", "balanced risk", "aggressive"
- **Strategies**: "save", "invest", "deploy", "allocate"
- **Asset Types**: "stable coins", "liquid tokens", "growth assets"

## 🚫 Troubleshooting

### If Voice Doesn't Work:
1. **Check microphone permissions** in browser settings
2. **Ensure internet connection** (required for speech processing)
3. **For Brave users**: Deepgram automatically handles restrictions
4. **Fallback**: Text input always works as complete alternative

### Common Issues:
- **"Microphone access denied"**: Grant permissions in browser
- **"Network error"**: Check internet connection
- **"Service unavailable"**: Try text input alternative

## 💡 Benefits of Hybrid Approach

### Universal Compatibility:
- ✅ Works in **all modern browsers**
- ✅ **Brave browser fully supported**
- ✅ **Privacy-conscious users** get better service
- ✅ **Seamless user experience** regardless of browser

### Intelligent Fallbacks:
- ✅ **Auto-detection** of best service
- ✅ **Graceful degradation** when voice unavailable
- ✅ **Clear user guidance** for any issues
- ✅ **Text input always works** as backup

### Professional Quality:
- ✅ **Enterprise-grade accuracy** with Deepgram
- ✅ **Real-time transcription** in all browsers
- ✅ **Consistent UI/UX** across platforms
- ✅ **Error handling** with helpful messages

## 🎯 Result

**Your Intent AI platform now has the most comprehensive voice support possible:**
- ✅ **Universal browser compatibility**
- ✅ **Brave browser works perfectly**
- ✅ **Professional-grade accuracy**
- ✅ **Privacy-conscious implementation**
- ✅ **Seamless user experience**

Users can speak their financial goals naturally in any browser and get the same excellent AI-powered intent parsing! 🎤✨