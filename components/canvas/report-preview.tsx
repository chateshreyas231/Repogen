'use client'

interface CanvasBlock {
  id: string
  type: string
  title: string | null
  content: string
  order: number
  parentBlockId: string | null
  aiGenerated: boolean
  childBlocks?: CanvasBlock[]
}

function buildFlatList(blocks: CanvasBlock[]): CanvasBlock[] {
  const result: CanvasBlock[] = []
  
  const traverse = (block: CanvasBlock) => {
    if (block.type === 'section' || block.type === 'sub_section') {
      result.push(block)
    } else {
      result.push(block)
    }
    
    if (block.childBlocks) {
      block.childBlocks.forEach(traverse)
    }
  }
  
  blocks.forEach(traverse)
  return result
}

export function ReportPreview({ blocks }: { blocks: CanvasBlock[] }) {
  const buildTree = (parentId: string | null): CanvasBlock[] => {
    return blocks
      .filter((block) => block.parentBlockId === parentId)
      .sort((a, b) => a.order - b.order)
      .map((block) => ({
        ...block,
        childBlocks: buildTree(block.id),
      }))
  }

  const tree = buildTree(null)
  const flatList = buildFlatList(tree)

  return (
    <div className="p-6">
      <h2 className="font-semibold mb-4">Report Preview</h2>
      <div className="prose prose-sm max-w-none">
        {flatList.map((block) => {
          if (block.type === 'section') {
            return (
              <div key={block.id} className="mb-6">
                <h1 className="text-2xl font-bold mb-2">{block.title}</h1>
                {block.content && (
                  <div dangerouslySetInnerHTML={{ __html: block.content }} />
                )}
              </div>
            )
          } else if (block.type === 'sub_section') {
            return (
              <div key={block.id} className="mb-4">
                <h2 className="text-xl font-semibold mb-2">{block.title}</h2>
                {block.content && (
                  <div dangerouslySetInnerHTML={{ __html: block.content }} />
                )}
              </div>
            )
          } else if (block.content) {
            return (
              <div
                key={block.id}
                className="mb-3"
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            )
          }
          return null
        })}
      </div>
    </div>
  )
}

