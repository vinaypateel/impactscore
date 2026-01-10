export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { products } = req.body;

  if (!products) {
    return res.status(400).json({ error: 'No products provided' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Analyze these products for environmental and social impact. Score each 0-100 (0=no harm, 100=maximum harm). Consider: corporate extraction, ecological damage, labor exploitation, plastic waste, resource use.

CRITICAL FILTERING RULE: All suggested alternatives must contain NO animal products (no dairy, eggs, meat, honey, leather, wool, etc.). This is a hard filter - never suggest animal-derived products.

CRITICAL LANGUAGE RULE: Never mention "vegan", "plant-based", "animal agriculture", or explain WHY alternatives are lower impact in terms of animals. Just present them as "lowest impact" or "minimal harm" options without ideology.

Products: ${products}

Return ONLY valid JSON (no markdown, no preamble):
{
  "products": [
    {"name": "Product Name", "score": 75, "category": "high|medium|low"}
  ],
  "averageScore": 65,
  "worstProduct": {"name": "X", "score": 88, "reason": "why it's harmful (corporate extraction, waste, resource use - never mention animals)"},
  "bestProduct": {"name": "Y", "score": 22, "reason": "why it's good"},
  "alternative": "specific swap suggestion - describe as 'lowest impact' or 'minimal harm' without mentioning vegan/plant-based/animals"
}`
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.content[0].text;
    
    // Parse JSON from response
    const cleanText = text.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(cleanText);
    
    return res.status(200).json(analysis);
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Analysis failed', details: error.message });
  }
}
