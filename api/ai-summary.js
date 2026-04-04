// api/ai-summary.js — Server-side AI proxy (avoids CORS)
// Env vars: ANTHROPIC_API_KEY for Claude

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { provider, prompt, maxTokens, geminiKey } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });

  try {
    if (provider === 'gemini') {
      if (!geminiKey) return res.status(400).json({ error: 'No Gemini API key. Configure in Admin settings.' });

      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: maxTokens || 400 },
          }),
        }
      );
      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return res.status(200).json({ text: text || 'Gemini returned no content.' });

    } else {
      // Claude
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set in Vercel environment variables.' });
      }

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: maxTokens || 400,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        return res.status(resp.status).json({
          error: errData?.error?.message || `Anthropic API returned ${resp.status}`,
        });
      }

      const data = await resp.json();
      const text = data?.content?.[0]?.text;
      return res.status(200).json({ text: text || 'Claude returned no content.' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'AI proxy error: ' + (err.message || String(err)) });
  }
}
