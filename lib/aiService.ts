import OpenAI from 'openai';
import { createClient } from '@/lib/client';

export class AIService {
  private readonly openai: OpenAI;
  private readonly supabase;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
    this.supabase = createClient();
  }

  // Content Summarization
  async summarizeContent(content: string, maxLength: number = 500): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert at summarizing educational content. Create concise, informative summaries that capture the key points."
          },
          {
            role: "user",
            content: `Please summarize the following content in under ${maxLength} characters:\n\n${content}`
          }
        ],
        max_tokens: Math.floor(maxLength * 1.2),
        temperature: 0.3,
      });

      await this.recordAIAnalytics('summarization', 'openai', completion.usage?.total_tokens || 0);
      
      return completion.choices[0]?.message?.content || 'Summary unavailable';
    } catch (error: any) {
      console.error('Content summarization failed:', error);
      await this.recordAIAnalytics('summarization', 'openai', 0, false, error.message);
      throw error;
    }
  }

  // Smart Course Outline Generation
  async generateCourseOutline(topic: string, level: string, durationHours: number): Promise<any> {
    const prompt = `
      Generate a comprehensive course outline for topic: "${topic}"
      Difficulty level: ${level}
      Total duration: ${durationHours} hours
      
      Please provide a structured outline with:
      1. Course objectives
      2. Module breakdown with estimated time per module
      3. Key learning points for each module
      4. Recommended resources
      5. Assessment ideas
      
      Format as JSON with this structure:
      {
        "title": "Course Title",
        "description": "Course description",
        "objectives": ["obj1", "obj2"],
        "modules": [
          {
            "title": "Module title",
            "duration_hours": 2,
            "topics": ["topic1", "topic2"],
            "learningObjectives": ["obj1", "obj2"],
            "resources": ["resource1", "resource2"]
          }
        ]
      }
    `;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert course designer. Create practical, well-structured course outlines for online learning."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    await this.recordAIAnalytics('outline_generation', 'openai', completion.usage?.total_tokens || 0);

    try {
      return JSON.parse(completion.choices[0]?.message?.content || '{}');
    } catch {
      // Fallback if JSON parsing fails
      return { error: "Failed to generate structured outline" };
    }
  }

  // AI-Powered Grading
  async gradeSubmission(question: string, submission: string, rubric: any): Promise<any> {
    const prompt = `
      Grade the following submission based on the provided rubric.
      
      QUESTION: ${question}
      
      SUBMISSION: ${submission}
      
      RUBRIC: ${JSON.stringify(rubric)}
      
      Provide feedback in this JSON format:
      {
        "score": 85,
        "feedback": "Constructive feedback here",
        "strengths": ["strength1", "strength2"],
        "improvements": ["area1", "area2"],
        "rubricBreakdown": {
          "criteria1": { "score": 4, "maxScore": 5, "feedback": "..." }
        }
      }
    `;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an educational assessment expert. Provide fair, constructive grading and feedback."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    await this.recordAIAnalytics('grading', 'openai', completion.usage?.total_tokens || 0);

    try {
      return JSON.parse(completion.choices[0]?.message?.content || '{}');
    } catch {
      return {
        score: 0,
        feedback: "Unable to grade this submission automatically",
        strengths: [],
        improvements: ["Please review manually"]
      };
    }
  }

  // Generate Personalized Learning Path
  async generateLearningPath(userId: string, goals: string[], currentSkills: string[]): Promise<any> {
    const userPreferences = await this.getUserLearningPreferences(userId);
    
    const prompt = `
      Create a personalized learning path for a user with these characteristics:
      
      GOALS: ${goals.join(', ')}
      CURRENT SKILLS: ${currentSkills.join(', ')}
      PREFERENCES: ${JSON.stringify(userPreferences)}
      
      Generate a 4-week learning plan with:
      1. Weekly learning objectives
      2. Recommended resources and activities
      3. Milestones and checkpoints
      4. Estimated time commitment
      
      Format as JSON.
    `;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert learning experience designer. Create personalized, achievable learning paths."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 1500,
    });

    await this.recordAIAnalytics('learning_path_generation', 'openai', completion.usage?.total_tokens || 0);

    return JSON.parse(completion.choices[0]?.message?.content || '{}');
  }

  // Content Recommendations Engine
  async generateContentRecommendations(userId: string, limit: number = 10): Promise<any[]> {
    // Get user's learning history and preferences
    const { data: userHistory } = await this.supabase
      .from('user_progress')
      .select('content_id, content_type, completed_at')
      .eq('user_id', userId);

    const { data: preferences } = await this.supabase
      .from('user_learning_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Simple collaborative filtering (in production, use proper ML)
    const prompt = `
      Based on the user's learning history and preferences, recommend educational content.
      
      USER HISTORY: ${JSON.stringify(userHistory)}
      PREFERENCES: ${JSON.stringify(preferences)}
      
      Recommend ${limit} items with:
      - Content title and description
      - Why it's relevant to the user
      - Estimated difficulty match
      - Confidence score (0-1)
      
      Format as JSON array.
    `;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an educational content recommender. Suggest relevant, engaging learning materials."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 2000,
    });

    await this.recordAIAnalytics('recommendation', 'openai', completion.usage?.total_tokens || 0);

    const recommendations = JSON.parse(completion.choices[0]?.message?.content || '[]');
    
    // Store recommendations in database
    for (const rec of recommendations) {
      await this.supabase
        .from('content_recommendations')
        .upsert([{
          user_id: userId,
          content_id: rec.id, // You'd map this to actual content IDs
          content_type: rec.type,
          recommendation_type: 'completion_based',
          score: rec.confidence,
          algorithm_version: 'ai-v1'
        }]);
    }

    return recommendations;
  }

  // Audio/Video Transcription - Fixed version
  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    try {
      // Convert Buffer to Uint8Array first, then to Blob
      const uint8Array = new Uint8Array(audioBuffer);
      const blob = new Blob([uint8Array], { type: 'audio/wav' });
      
      // Create FormData for the file upload
      const formData = new FormData();
      formData.append('file', blob, 'audio.wav');
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'text');

      // Use fetch API directly since OpenAI SDK has issues with Buffer in some environments
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const transcription = await response.text();
      
      await this.recordAIAnalytics('transcription', 'openai', 0);
      return transcription;
    } catch (error: any) {
      console.error('Transcription failed:', error);
      await this.recordAIAnalytics('transcription', 'openai', 0, false, error.message);
      throw error;
    }
  }

  // Alternative: Use OpenAI SDK with proper file handling
  async transcribeAudioFile(file: File): Promise<string> {
    try {
      const transcription = await this.openai.audio.transcriptions.create({
        file: file,
        model: "whisper-1",
        response_format: "text",
      });

      await this.recordAIAnalytics('transcription', 'openai', 0);
      return transcription;
    } catch (error: any) {
      console.error('Transcription failed:', error);
      await this.recordAIAnalytics('transcription', 'openai', 0, false, error.message);
      throw error;
    }
  }

  // Convert Buffer to File for browser environments
  bufferToFile(buffer: Buffer, filename: string, mimeType: string): File {
    const uint8Array = new Uint8Array(buffer);
    const blob = new Blob([uint8Array], { type: mimeType });
    return new File([blob], filename, { type: mimeType });
  }

  private async getUserLearningPreferences(userId: string): Promise<any> {
    const { data } = await this.supabase
      .from('user_learning_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    return data || {};
  }

  private async recordAIAnalytics(
    operation: string, 
    modelType: string, 
    tokensUsed: number, 
    success: boolean = true, 
    errorMessage?: string
  ): Promise<void> {
    // Calculate cost (approximate)
    const costPerToken = 0.00002; // Adjust based on actual model costs
    const cost = tokensUsed * costPerToken;

    await this.supabase
      .from('ai_usage_analytics')
      .insert([{
        operation,
        model_type: modelType,
        tokens_used: tokensUsed,
        cost,
        success,
        error_message: errorMessage
      }]);
  }
}

export const aiService = new AIService();