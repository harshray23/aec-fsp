// src/pages/api/auth/session.ts
import { verifySession } from '@/lib/auth';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const user = await verifySession(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    return res.status(200).json({ user });
  } catch (error) {
    console.error('Session verification error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
