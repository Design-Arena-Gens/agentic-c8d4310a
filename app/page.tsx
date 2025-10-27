'use client'

import { useState } from 'react'
import {
  Sparkles,
  FileText,
  Settings,
  Copy,
  Download,
  RefreshCw,
  Wand2,
  BookOpen,
  Mail,
  MessageSquare,
  FileCode,
  PenTool,
  Lightbulb
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Template = {
  id: string
  name: string
  icon: any
  prompt: string
  placeholder: string
}

const templates: Template[] = [
  {
    id: 'blog',
    name: 'Blog Post',
    icon: FileText,
    prompt: 'Write a comprehensive blog post about',
    placeholder: 'e.g., benefits of meditation for mental health'
  },
  {
    id: 'article',
    name: 'Article',
    icon: BookOpen,
    prompt: 'Write a detailed article about',
    placeholder: 'e.g., future of renewable energy'
  },
  {
    id: 'email',
    name: 'Email',
    icon: Mail,
    prompt: 'Write a professional email about',
    placeholder: 'e.g., requesting a meeting with a client'
  },
  {
    id: 'social',
    name: 'Social Media',
    icon: MessageSquare,
    prompt: 'Create engaging social media content about',
    placeholder: 'e.g., launching a new product'
  },
  {
    id: 'product',
    name: 'Product Description',
    icon: FileCode,
    prompt: 'Write a compelling product description for',
    placeholder: 'e.g., ergonomic office chair'
  },
  {
    id: 'creative',
    name: 'Creative Writing',
    icon: PenTool,
    prompt: 'Write a creative piece about',
    placeholder: 'e.g., a journey through space'
  },
  {
    id: 'ideas',
    name: 'Ideas & Brainstorm',
    icon: Lightbulb,
    prompt: 'Generate creative ideas for',
    placeholder: 'e.g., marketing campaign for eco-friendly products'
  }
]

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(templates[0])
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('professional')
  const [length, setLength] = useState('medium')
  const [generatedContent, setGeneratedContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const generateContent = async () => {
    if (!topic.trim()) {
      alert('Please enter a topic')
      return
    }

    setIsGenerating(true)
    setGeneratedContent('')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: selectedTemplate.id,
          topic: topic.trim(),
          tone,
          length,
          basePrompt: selectedTemplate.prompt
        }),
      })

      if (!response.ok) {
        throw new Error('Generation failed')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No reader available')
      }

      let content = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                content += parsed.content
                setGeneratedContent(content)
              }
            } catch (e) {
              console.error('Parse error:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent)
    alert('Copied to clipboard!')
  }

  const downloadContent = () => {
    const blob = new Blob([generatedContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedTemplate.id}-${Date.now()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-white" />
            <h1 className="text-4xl md:text-5xl font-bold text-white font-display">
              AutoDraft AI
            </h1>
          </div>
          <p className="text-white/90 text-lg">
            Generate high-quality content with AI - All features unlocked
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Templates & Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Templates */}
            <div className="glass-effect rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 font-display">
                <FileText className="w-5 h-5" />
                Templates
              </h2>
              <div className="space-y-2">
                {templates.map((template) => {
                  const Icon = template.icon
                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedTemplate.id === template.id
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{template.name}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Settings */}
            <div className="glass-effect rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 font-display">
                <Settings className="w-5 h-5" />
                Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="friendly">Friendly</option>
                    <option value="formal">Formal</option>
                    <option value="creative">Creative</option>
                    <option value="persuasive">Persuasive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Length</label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="short">Short (200-300 words)</option>
                    <option value="medium">Medium (400-600 words)</option>
                    <option value="long">Long (800-1000 words)</option>
                    <option value="very-long">Very Long (1200+ words)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Input & Output */}
          <div className="lg:col-span-2 space-y-6">
            {/* Input */}
            <div className="glass-effect rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 font-display">
                <Wand2 className="w-5 h-5" />
                Generate Content
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    What do you want to write about?
                  </label>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={selectedTemplate.placeholder}
                    className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[120px] resize-none"
                  />
                </div>

                <button
                  onClick={generateContent}
                  disabled={isGenerating || !topic.trim()}
                  className="w-full button-gradient text-white font-semibold py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Content
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Output */}
            {(generatedContent || isGenerating) && (
              <div className="glass-effect rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2 font-display">
                    <FileText className="w-5 h-5" />
                    Generated Content
                  </h2>

                  {generatedContent && !isGenerating && (
                    <div className="flex gap-2">
                      <button
                        onClick={copyToClipboard}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                      <button
                        onClick={downloadContent}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="prose max-w-none">
                  {isGenerating && !generatedContent ? (
                    <div className="space-y-3">
                      <div className="h-4 loading-shimmer rounded w-full"></div>
                      <div className="h-4 loading-shimmer rounded w-5/6"></div>
                      <div className="h-4 loading-shimmer rounded w-4/6"></div>
                    </div>
                  ) : (
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {generatedContent}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/80 text-sm">
          <p>Powered by AI • All features unlocked • No limits</p>
        </div>
      </div>
    </div>
  )
}
