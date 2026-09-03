const crypto = require('crypto');

// Vercel Node.js function: keep the raw body so the HMAC check is exact.
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function verifySignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) return false;
  const expected =
    'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const sigBuf = Buffer.from(signatureHeader);
  const expBuf = Buffer.from(expected);
  return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
}

// run.completed = all assertions passed; every other terminal event
// (run.failed, run.incomplete, run.credits_exhausted, run.timeout,
// run.auto_fix_declined) is treated as a CI failure so nothing silently
// passes. run.auto_fixed still requires human review before trusting it,
// so it's also treated as a failure.
function statusForEvent(event) {
  return event === 'run.completed' ? 'success' : 'failure';
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const rawBody = await readRawBody(req);
  const signatureHeader = req.headers['x-testlab-signature'];

  if (!verifySignature(rawBody, signatureHeader, process.env.TESTLAB_WEBHOOK_SECRET)) {
    res.status(401).json({ error: 'invalid signature' });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    res.status(400).json({ error: 'invalid json' });
    return;
  }

  const { event, jobId, buildId, status } = payload;

  if (!buildId) {
    // Nothing to attach a commit status to.
    res.status(200).json({ ok: true, skipped: 'no buildId' });
    return;
  }

  const ghRes = await fetch(
    `https://api.github.com/repos/${process.env.GITHUB_REPO}/statuses/${buildId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
      },
      body: JSON.stringify({
        state: statusForEvent(event),
        context: 'test-lab',
        description: `Test-Lab: ${status || event}`.slice(0, 140),
      }),
    }
  );

  if (!ghRes.ok) {
    const text = await ghRes.text();
    console.error('Failed to update GitHub status', ghRes.status, text);
    res.status(502).json({ error: 'failed to update github status' });
    return;
  }

  res.status(200).json({ ok: true, jobId, event });
};
