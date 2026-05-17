const KEYWORD_PATTERNS = [
  { pattern: /律师/g, class: 'kw-person' },
  { pattern: /护士/g, class: 'kw-person' },
  { pattern: /记者/g, class: 'kw-person' },
  { pattern: /手环/g, class: 'kw-item' },
  { pattern: /档案袋/g, class: 'kw-item' },
  { pattern: /钥匙/g, class: 'kw-item' },
  { pattern: /救生衣/g, class: 'kw-item' },
  { pattern: /医药箱/g, class: 'kw-item' },
  { pattern: /旧电台/g, class: 'kw-item' },
  { pattern: /沉船案/g, class: 'kw-event' },
  { pattern: /海鸥号/g, class: 'kw-place' },
  { pattern: /零点协议/g, class: 'kw-secret' },
  { pattern: /广播/g, class: 'kw-item' },
  { pattern: /铁门/g, class: 'kw-place' },
  { pattern: /投票/g, class: 'kw-event' },
  { pattern: /昏迷/g, class: 'kw-event' },
  { pattern: /幸存者/g, class: 'kw-person' },
  { pattern: /家属/g, class: 'kw-person' },
  { pattern: /真相/g, class: 'kw-secret' },
  { pattern: /逃生/g, class: 'kw-secret' },
  { pattern: /反噬/g, class: 'kw-event' }
]

export function highlightKeywords(text) {
  if (!text) return ''

  const matches = []

  KEYWORD_PATTERNS.forEach(({ pattern, class: cls }) => {
    let match
    const regex = new RegExp(pattern.source, pattern.flags)

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        replacement: `<span class="${cls}">${match[0]}</span>`
      })
    }
  })

  if (matches.length === 0) return text

  matches.sort((a, b) => b.start - a.start)

  let result = text
  const used = new Set()

  for (const m of matches) {
    const key = `${m.start}-${m.end}`
    if (used.has(key)) continue

    let overlaps = false
    for (const other of used) {
      const [s, e] = other.split('-').map(Number)
      if (!(m.end <= s || m.start >= e)) {
        overlaps = true
        break
      }
    }

    if (!overlaps) {
      used.add(key)
      result = result.slice(0, m.start) + m.replacement + result.slice(m.end)
    }
  }

  return result
}
