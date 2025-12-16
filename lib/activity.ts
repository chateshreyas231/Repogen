import { prisma } from './prisma'

export async function logActivity(
  reportId: string,
  userId: string | undefined,
  type: 'created' | 'status_change' | 'ai_generation' | 'section_edited' | 'comment' | 'exported',
  details?: Record<string, any>
) {
  try {
    await prisma.reportActivity.create({
      data: {
        reportId,
        userId: userId || null,
        type,
        details: details ? JSON.stringify(details) : null,
      },
    })
  } catch (error) {
    console.error('Error logging activity:', error)
    // Don't throw - activity logging shouldn't break the main flow
  }
}

export async function updateLastEdited(
  reportId: string,
  userId: string | undefined
) {
  try {
    await prisma.report.update({
      where: { id: reportId },
      data: {
        lastEditedByUserId: userId || null,
        lastEditedAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Error updating last edited:', error)
  }
}

export async function updateUserActivity(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastActiveAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Error updating user activity:', error)
  }
}

