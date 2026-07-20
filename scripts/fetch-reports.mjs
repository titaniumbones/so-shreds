#!/usr/bin/env node
/*
 * Snapshot the per-river GitHub Discussions into dist/reports.json.
 * Runs in CI (GITHUB_TOKEN provided); the workflow re-runs on every
 * discussion_comment event, so posted reports reach the site in minutes.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const token = process.env.GITHUB_TOKEN
if (!token) {
  console.error('GITHUB_TOKEN not set; writing empty reports.json')
  mkdirSync('dist', { recursive: true })
  writeFileSync('dist/reports.json', JSON.stringify({ generated: null, rivers: {} }))
  process.exit(0)
}

const discussions = JSON.parse(
  readFileSync(new URL('../src/data/discussions.json', import.meta.url), 'utf8'),
)

const QUERY = `
query($owner:String!, $repo:String!, $number:Int!) {
  repository(owner:$owner, name:$repo) {
    discussion(number:$number) {
      url
      comments(first:100) {
        nodes {
          author { login avatarUrl }
          createdAt
          url
          body
          reactions(content: THUMBS_UP) { totalCount }
        }
      }
    }
  }
}`

async function gql(variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: QUERY, variables }),
  })
  if (!res.ok) throw new Error(`GraphQL ${res.status}`)
  const json = await res.json()
  if (json.errors) throw new Error(JSON.stringify(json.errors))
  return json.data
}

const rivers = {}
for (const [slug, number] of Object.entries(discussions)) {
  const data = await gql({ owner: 'titaniumbones', repo: 'so-shreds', number })
  const d = data.repository.discussion
  if (!d) continue
  rivers[slug] = {
    url: d.url,
    reports: d.comments.nodes.map((c) => ({
      author: c.author?.login ?? 'ghost',
      avatar: c.author?.avatarUrl ?? '',
      createdAt: c.createdAt,
      url: c.url,
      body: c.body,
      upvotes: c.reactions.totalCount,
    })),
  }
  console.log(`${slug}: ${rivers[slug].reports.length} reports`)
}

mkdirSync('dist', { recursive: true })
writeFileSync(
  'dist/reports.json',
  JSON.stringify({ generated: new Date().toISOString(), rivers }),
)
console.log('wrote dist/reports.json')
