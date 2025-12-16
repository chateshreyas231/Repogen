import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create organization
  const organization = await prisma.organization.upsert({
    where: { id: 'default-org' },
    update: {},
    create: {
      id: 'default-org',
      name: 'Default Organization',
      styleRules: JSON.stringify({
        tone: 'professional',
        format: 'formal',
        includeCodes: true,
      }),
    },
  })

  // Create built-in template
  const templateSections = [
    { title: 'Executive Summary', order: 1 },
    { title: 'Background', order: 2 },
    { title: 'Key Findings', order: 3 },
    { title: 'Proposed Solutions', order: 4 },
    { title: 'Conclusion', order: 5 },
    { title: 'Appendix', order: 6 },
  ]

  const template = await prisma.template.upsert({
    where: { id: 'accessibility-assessment-template' },
    update: {},
    create: {
      id: 'accessibility-assessment-template',
      organizationId: organization.id,
      name: 'Accessibility Assessment Report',
      description: 'Standard accessibility assessment report template',
      sections: JSON.stringify(templateSections),
      isBuiltIn: true,
    },
  })

  console.log('Seeded organization and template:', { organization, template })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

