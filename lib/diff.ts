import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import type { Parent } from 'unist'
import type { RootContent } from 'mdast'

export type BlockStatus = 'unchanged' | 'added' | 'changed' | 'deleted'

export interface DiffBlock {
  id: string
  leftContent: string | null   // null = added (not on main)
  rightContent: string | null  // null = deleted (not on draft)
  status: BlockStatus
}

function parseBlocks(markdown: string): string[] {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .parse(markdown) as Parent

  return tree.children.map(node =>
    String(unified().use(remarkStringify).stringify({ type: 'root', children: [node as RootContent] })).trim()
  )
}

function hashBlock(content: string): string {
  // Simple hash: normalized whitespace
  return content.replace(/\s+/g, ' ').trim()
}

// LCS-based diff
function lcs(left: string[], right: string[]): number[][] {
  const m = left.length
  const n = right.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = hashBlock(left[i - 1]) === hashBlock(right[j - 1])
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])
  return dp
}

export function diffBlocks(leftMd: string, rightMd: string): DiffBlock[] {
  const leftBlocks = leftMd ? parseBlocks(leftMd) : []
  const rightBlocks = rightMd ? parseBlocks(rightMd) : []

  if (leftBlocks.length === 0 && rightBlocks.length === 0) return []

  const dp = lcs(leftBlocks, rightBlocks)
  const result: DiffBlock[] = []

  let i = leftBlocks.length
  let j = rightBlocks.length
  const ops: Array<{ type: 'unchanged' | 'deleted' | 'added'; left?: string; right?: string }> = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && hashBlock(leftBlocks[i - 1]) === hashBlock(rightBlocks[j - 1])) {
      ops.unshift({ type: 'unchanged', left: leftBlocks[i - 1], right: rightBlocks[j - 1] })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift({ type: 'added', right: rightBlocks[j - 1] })
      j--
    } else {
      ops.unshift({ type: 'deleted', left: leftBlocks[i - 1] })
      i--
    }
  }

  // Pair up adjacent deleted+added as 'changed'
  const merged: DiffBlock[] = []
  let k = 0
  while (k < ops.length) {
    const op = ops[k]
    if (op.type === 'deleted' && k + 1 < ops.length && ops[k + 1].type === 'added') {
      merged.push({
        id: `block-${merged.length}`,
        leftContent: op.left!,
        rightContent: ops[k + 1].right!,
        status: 'changed',
      })
      k += 2
    } else if (op.type === 'deleted') {
      merged.push({ id: `block-${merged.length}`, leftContent: op.left!, rightContent: null, status: 'deleted' })
      k++
    } else if (op.type === 'added') {
      merged.push({ id: `block-${merged.length}`, leftContent: null, rightContent: op.right!, status: 'added' })
      k++
    } else {
      merged.push({ id: `block-${merged.length}`, leftContent: op.left!, rightContent: op.right!, status: 'unchanged' })
      k++
    }
  }

  return merged
}
