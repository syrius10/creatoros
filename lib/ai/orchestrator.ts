// lib/ai/orchestrator.ts
export interface AIGenerateRequest {
  prompt: string;
  type: 'course_outline' | 'landing_copy' | 'email_sequence';
  context?: any; // additional context for the generation
}

export interface AIGenerateResponse {
  content: string;
  model?: string;
}

export class AIOrchestrator {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.apiUrl = process.env.AI_PROVIDER_API_URL || 'http://localhost:8787/generate';
    this.apiKey = process.env.AI_PROVIDER_API_KEY || 'dev_stub_key';
  }

  async generateContent(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    // If we're using the stub, return deterministic content based on type
    if (this.apiUrl.includes('localhost') || !this.apiKey || this.apiKey === 'dev_stub_key') {
      return this.stubGenerate(request);
    }

    try {
      // Determine if we're using Groq (OpenAI-compatible) or another provider
      const isGroq = this.apiUrl.includes('groq.com');
      
      let requestBody: any;
      
      if (isGroq) {
        // Groq uses OpenAI-compatible API
        requestBody = {
          model: "llama-3.1-8b-instant", // Or other Groq models: mixtral-8x7b-32768, llama3-70b-8192, etc.
          messages: [
            {
              role: "system",
              content: this.getSystemPrompt(request.type)
            },
            {
              role: "user",
              content: request.prompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 4000
        };
      } else {
        // Original format for other providers
        requestBody = {
          prompt: request.prompt,
          type: request.type,
          context: request.context
        };
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI API responded with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (isGroq) {
        // Parse Groq/OpenAI format response
        return {
          content: data.choices[0].message.content,
          model: data.model
        };
      } else {
        // Original format
        return {
          content: data.content,
          model: data.model
        };
      }
    } catch (error) {
      console.error('Error calling AI provider:', error);
      // Fallback to stub if external service fails
      return this.stubGenerate(request);
    }
  }

  private getSystemPrompt(type: string): string {
    switch (type) {
      case 'course_outline':
        return `You are an expert course designer. Create a comprehensive course outline in JSON format with the following structure:
        {
          "title": "Course Title",
          "sections": [
            {
              "title": "Section Title",
              "lessons": [
                {"title": "Lesson Title", "duration": "X minutes"}
              ]
            }
          ]
        }
        Return only valid JSON.`;
      
      case 'landing_copy':
        return `You are a marketing expert. Create compelling landing page copy in JSON format with this structure:
        {
          "headline": "Main Headline",
          "subheadline": "Subheadline",
          "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
          "cta": "Call to Action"
        }
        Return only valid JSON.`;
      
      case 'email_sequence':
        return `You are an email marketing specialist. Create an email sequence in JSON format with this structure:
        [
          {
            "subject": "Email Subject",
            "body": "Email content",
            "delay_days": 0
          }
        ]
        Return only valid JSON.`;
      
      default:
        return 'You are a helpful AI assistant. Return responses in valid JSON format.';
    }
  }

  private stubGenerate(request: AIGenerateRequest): AIGenerateResponse {
    // Deterministic stubs for development and testing
    switch (request.type) {
      case 'course_outline':
        return {
          content: JSON.stringify({
            title: request.prompt || 'Generated Course',
            sections: [
              {
                title: 'Introduction',
                lessons: [
                  { title: 'Welcome to the Course', duration: '5 minutes' },
                  { title: 'What You Will Learn', duration: '10 minutes' }
                ]
              },
              {
                title: 'Main Content',
                lessons: [
                  { title: 'Core Concept 1', duration: '15 minutes' },
                  { title: 'Core Concept 2', duration: '20 minutes' },
                  { title: 'Practical Exercise', duration: '30 minutes' }
                ]
              },
              {
                title: 'Conclusion',
                lessons: [
                  { title: 'Review', duration: '10 minutes' },
                  { title: 'Next Steps', duration: '5 minutes' }
                ]
              }
            ]
          }, null, 2),
          model: 'stub'
        };
      case 'landing_copy':
        return {
          content: JSON.stringify({
            headline: 'Transform Your Skills with Our Course',
            subheadline: 'Join thousands of students who have already taken the next step in their career.',
            benefits: [
              'Learn from industry experts',
              'Hands-on projects and exercises',
              'Lifetime access to course materials'
            ],
            cta: 'Enroll Now'
          }, null, 2),
          model: 'stub'
        };
      case 'email_sequence':
        return {
          content: JSON.stringify([
            {
              subject: 'Welcome to the Course!',
              body: 'We are excited to have you on board. Get started with the first lesson today.',
              delay_days: 0
            },
            {
              subject: 'How are you finding the course?',
              body: 'We hope you are enjoying the course. Remember to complete the exercises for maximum benefit.',
              delay_days: 2
            },
            {
              subject: 'Advanced topics available',
              body: 'Now that you have completed the basics, check out our advanced modules.',
              delay_days: 7
            }
          ], null, 2),
          model: 'stub'
        };
      default:
        return { content: '', model: 'stub' };
    }
  }
}