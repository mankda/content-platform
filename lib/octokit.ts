import { auth, clerkClient } from '@clerk/nextjs/server'
import { Octokit } from '@octokit/rest'

export async function getOctokit(): Promise<Octokit> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthenticated')

  const client = await clerkClient()
  const tokens = await client.users.getUserOauthAccessToken(userId, 'github')
  const token = tokens.data[0]?.token
  if (!token) throw new Error('No GitHub token found — ensure repo scope is granted')

  return new Octokit({ auth: token })
}

export function getServerOctokit(): Octokit {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN env var is not set')
  return new Octokit({ auth: token })
}
