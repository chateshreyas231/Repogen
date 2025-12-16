import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateSectionContent(
  promptOrTitle: string,
  projectResources: Array<{ type: string; title: string | null; content: string }>,
  parentSectionTitle?: string,
  previousReportContext?: string
): Promise<string> {
  // Build context from project resources
  const resourcesText = projectResources
    .map((resource) => {
      const typeLabel = resource.type.replace('_', ' ').toUpperCase()
      return `[${typeLabel}${resource.title ? `: ${resource.title}` : ''}]\n${resource.content}\n`
    })
    .join('\n---\n\n')

  const sectionContext = parentSectionTitle
    ? `\nPARENT SECTION: ${parentSectionTitle}`
    : ''

  const previousReportsContext = previousReportContext
    ? `\n\nREFERENCE: PREVIOUS REPORTS FROM THIS PROJECT (for style and structure guidance):\n${previousReportContext}`
    : ''

  const prompt = `You are a professional accessibility consultant writing a structured compliance report section.

${sectionContext}

USER PROMPT/INSTRUCTION: ${promptOrTitle}

AVAILABLE PROJECT INFORMATION:
${resourcesText}
${previousReportsContext}

INSTRUCTIONS:
- Follow the user's prompt/instruction above
- Use ONLY information provided in the project resources above
- Reference previous reports for style and structure guidance, but generate NEW content based on current project resources
- Do NOT invent or hallucinate specific code references, dates, or details not present in the resources
- Use a professional, firm-neutral tone
- Be specific and actionable where possible
- If insufficient information is available, note that in a professional manner
- Format the output as clean HTML paragraphs (use <p> tags, no headers)

Generate the content now:`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional accessibility consultant. Generate structured, accurate report sections based only on provided project information. Never invent codes, dates, or details.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    })

    return completion.choices[0]?.message?.content || 'Unable to generate content.'
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new Error('Failed to generate section content')
  }
}

