# EU AI Act Art. 50 — AI Disclosure Requirements

## Legal Basis

EU AI Act Article 50 (Transparency obligations for providers and deployers of certain AI systems):

> "Providers shall ensure that AI systems intended to interact with natural persons are designed and developed in such a way that natural persons are informed that they are interacting with an AI system, unless this is obvious from the circumstances."

For voice agents, this means **the agent must identify itself as AI at the start of every call**, before any functional interaction.

## Recommended Wording

### German (Primary)
> „Hallo, hier ist der AI Support Agent von [Name]. Ich bin ein KI-Assistent und dieses Gespräch kann aufgezeichnet werden. Wie kann ich Ihnen helfen?"

### English
> "Hello, this is the AI support agent from [Name]. This is an AI assistant and this call may be recorded. How can I help you?"

### French
> "Bonjour, je suis l'assistant AI de [Name]. Je suis un assistant d'intelligence artificielle et cet appel peut être enregistré. Comment puis-je vous aider?"

### Spanish
> "Hola, soy el asistente de IA de [Name]. Soy un asistente de inteligencia artificial y esta llamada puede ser grabada. ¿Cómo puedo ayudarle?"

## Key Requirements

1. **Timing:** Disclosure must be the FIRST thing the caller hears — before asking for name, reason, or any other information
2. **Recordings:** If the call may be recorded (quality, training, compliance), this must be stated
3. **Language:** Match the caller's language (detect via called number or caller ID)
4. **Consent for transcripts:** Explicit spoken consent is required before storing call transcripts (GDPR Art. 7 + AI Act Art. 50)
5. **No deception:** The agent must never pretend to be human

## Implementation

The opening line is configured in the ElevenLabs Agent dashboard under "Agent Settings" → "Opening Line". Set it per agent/language combination.

For multi-language support, use ElevenLabs' language detection or configure separate agents per language.