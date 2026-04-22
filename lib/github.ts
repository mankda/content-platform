import { Octokit } from '@octokit/rest'

const ORG = process.env.GITHUB_ORG!
const REPO = process.env.GITHUB_REPO!

export type Role = 'reviewer' | 'writer' | 'viewer' | 'none'

export async function getUserRole(octokit: Octokit, username: string): Promise<Role> {
  try {
    const { data } = await octokit.repos.getCollaboratorPermissionLevel({
      owner: ORG,
      repo: REPO,
      username,
    })
    const level = data.permission
    if (level === 'admin' || level === 'maintain') return 'reviewer'
    if (level === 'write') return 'writer'
    if (level === 'read') return 'viewer'
    return 'none'
  } catch {
    return 'none'
  }
}

export async function listProjects(octokit: Octokit): Promise<string[]> {
  try {
    const { data } = await octokit.repos.getContent({
      owner: ORG,
      repo: REPO,
      path: 'projects',
    })
    if (!Array.isArray(data)) return []
    return data
      .filter(item => item.type === 'dir')
      .map(item => item.name)
  } catch {
    return []
  }
}

export async function getFileTree(octokit: Octokit, slug: string): Promise<{ path: string; name: string }[]> {
  try {
    const { data } = await octokit.git.getTree({
      owner: ORG,
      repo: REPO,
      tree_sha: `HEAD:projects/${slug}/docs`,
      recursive: '1',
    })
    return data.tree
      .filter(item => item.type === 'blob' && item.path?.endsWith('.mdx'))
      .map(item => ({ path: item.path!, name: item.path!.split('/').pop()! }))
  } catch {
    return []
  }
}

export async function getFileContent(
  octokit: Octokit,
  filePath: string,
  branch = 'main'
): Promise<{ content: string; sha: string } | null> {
  try {
    const { data } = await octokit.repos.getContent({
      owner: ORG,
      repo: REPO,
      path: filePath,
      ref: branch,
    })
    if (Array.isArray(data) || data.type !== 'file') return null
    return {
      content: Buffer.from(data.content, 'base64').toString('utf-8'),
      sha: data.sha,
    }
  } catch {
    return null
  }
}

export async function commitFile(
  octokit: Octokit,
  filePath: string,
  content: string,
  message: string,
  branch: string,
  existingSha?: string
): Promise<void> {
  await octokit.repos.createOrUpdateFileContents({
    owner: ORG,
    repo: REPO,
    path: filePath,
    message,
    content: Buffer.from(content).toString('base64'),
    branch,
    ...(existingSha ? { sha: existingSha } : {}),
  })
}

export async function createBranch(octokit: Octokit, branchName: string): Promise<void> {
  const { data: ref } = await octokit.git.getRef({
    owner: ORG,
    repo: REPO,
    ref: 'heads/main',
  })
  await octokit.git.createRef({
    owner: ORG,
    repo: REPO,
    ref: `refs/heads/${branchName}`,
    sha: ref.object.sha,
  })
}

export async function branchExists(octokit: Octokit, branchName: string): Promise<boolean> {
  try {
    await octokit.git.getRef({
      owner: ORG,
      repo: REPO,
      ref: `heads/${branchName}`,
    })
    return true
  } catch {
    return false
  }
}

export async function createPR(
  octokit: Octokit,
  branch: string,
  title: string,
  body = ''
): Promise<number> {
  const { data } = await octokit.pulls.create({
    owner: ORG,
    repo: REPO,
    title,
    body,
    head: branch,
    base: 'main',
  })
  return data.number
}

export async function listPRs(octokit: Octokit, branch?: string) {
  const params: Parameters<typeof octokit.pulls.list>[0] = {
    owner: ORG,
    repo: REPO,
    state: 'open',
  }
  if (branch) params.head = `${ORG}:${branch}`
  const { data } = await octokit.pulls.list(params)
  return data
}

export async function listPRComments(octokit: Octokit, prNumber: number) {
  const { data } = await octokit.issues.listComments({
    owner: ORG,
    repo: REPO,
    issue_number: prNumber,
  })
  return data
}

export async function addPRComment(
  octokit: Octokit,
  prNumber: number,
  body: string
): Promise<number> {
  const { data } = await octokit.issues.createComment({
    owner: ORG,
    repo: REPO,
    issue_number: prNumber,
    body,
  })
  return data.id
}

export async function replyToComment(
  octokit: Octokit,
  prNumber: number,
  body: string
): Promise<void> {
  await octokit.issues.createComment({
    owner: ORG,
    repo: REPO,
    issue_number: prNumber,
    body,
  })
}

export async function mergePR(octokit: Octokit, prNumber: number): Promise<void> {
  await octokit.pulls.merge({
    owner: ORG,
    repo: REPO,
    pull_number: prNumber,
    merge_method: 'squash',
  })
}

export async function closePR(octokit: Octokit, prNumber: number): Promise<void> {
  await octokit.pulls.update({
    owner: ORG,
    repo: REPO,
    pull_number: prNumber,
    state: 'closed',
  })
}

export async function deleteBranch(octokit: Octokit, branchName: string): Promise<void> {
  try {
    await octokit.git.deleteRef({
      owner: ORG,
      repo: REPO,
      ref: `heads/${branchName}`,
    })
  } catch {
    // branch may already be deleted after merge
  }
}

export async function mergeMainIntoDraft(
  octokit: Octokit,
  draftBranch: string
): Promise<'success' | 'conflict_resolved'> {
  try {
    await octokit.repos.merge({
      owner: ORG,
      repo: REPO,
      base: draftBranch,
      head: 'main',
      commit_message: 'chore: rebase to latest main',
    })
    return 'success'
  } catch (err: unknown) {
    const status = (err as { status?: number }).status
    if (status !== 409) throw err

    // Conflict — draft wins. Get draft's full tree and re-commit on top of latest main.
    const [{ data: mainRef }, { data: draftRef }] = await Promise.all([
      octokit.git.getRef({ owner: ORG, repo: REPO, ref: 'heads/main' }),
      octokit.git.getRef({ owner: ORG, repo: REPO, ref: `heads/${draftBranch}` }),
    ])

    const [{ data: mainCommit }, { data: draftCommit }] = await Promise.all([
      octokit.git.getCommit({ owner: ORG, repo: REPO, commit_sha: mainRef.object.sha }),
      octokit.git.getCommit({ owner: ORG, repo: REPO, commit_sha: draftRef.object.sha }),
    ])

    // Get all blobs from the draft tree to apply on top of main
    const { data: draftTree } = await octokit.git.getTree({
      owner: ORG,
      repo: REPO,
      tree_sha: draftCommit.tree.sha,
      recursive: '1',
    })

    // New tree: start from main's tree, override with every file from draft
    // This means: draft wins on conflicts, main wins for untouched files
    const { data: newTree } = await octokit.git.createTree({
      owner: ORG,
      repo: REPO,
      base_tree: mainCommit.tree.sha,
      tree: draftTree.tree
        .filter(item => item.type === 'blob' && item.sha && item.path)
        .map(item => ({
          path: item.path!,
          mode: (item.mode ?? '100644') as '100644' | '100755' | '120000',
          type: 'blob' as const,
          sha: item.sha!,
        })),
    })

    const { data: newCommit } = await octokit.git.createCommit({
      owner: ORG,
      repo: REPO,
      message: 'chore: rebase to latest main (draft wins conflicts)',
      tree: newTree.sha,
      parents: [mainRef.object.sha, draftRef.object.sha],
    })

    await octokit.git.updateRef({
      owner: ORG,
      repo: REPO,
      ref: `heads/${draftBranch}`,
      sha: newCommit.sha,
      force: true,
    })

    return 'conflict_resolved'
  }
}
