'use client'

import { useState } from 'react'

interface AIGeneratorButtonProps {
  readonly type: 'course_outline' | 'landing_copy' | 'email_sequence';
  readonly context?: any;
  readonly onGenerate: (content: string) => void;
  readonly buttonText?: string;
}

export default function AIGeneratorButton({ type, context, onGenerate, buttonText }: AIGeneratorButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    const prompt = promptUser(type) // You might want to get a prompt from the user

    if (!prompt) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, type, context }),
      })

      if (!response.ok) {
        throw new Error('Generation failed')
      }

      const { content } = await response.json()
      onGenerate(content)
    } catch (error) {
      console.error('Error generating content:', error)
      alert('Failed to generate content. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getPlaceholderText = (type: string): string => {
    switch (type) {
      case 'course_outline':
        return 'Enter a brief description of the course you want to create';
      case 'landing_copy':
        return 'Describe the product or course you want to create a landing page for';
      case 'email_sequence':
        return 'Describe the email sequence you want to generate';
      default:
        return 'Enter your prompt';
    }
  }

  const promptUser = (type: string): string | null => {
    // For simplicity, we use a window prompt. You might want to use a modal in a real app.
    const placeholder = getPlaceholderText(type);
    return prompt(placeholder);
  }

  const getButtonText = (): string => {
    if (loading) {
      return 'Generating...';
    }
    return buttonText || 'Generate with AI';
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
    >
      <span>{getButtonText()}</span>
    </button>
  )
}