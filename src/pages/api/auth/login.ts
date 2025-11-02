// This file is deprecated. The logic is now client-side in LoginForm.tsx
// which calls /api/auth/session-login.ts
// This file can be deleted.
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(404).json({ message: "This API endpoint is deprecated." });
}
