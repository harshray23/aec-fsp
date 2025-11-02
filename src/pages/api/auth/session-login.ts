// src/pages/api/auth/session-login.ts
import { createSession } from '@/lib/auth';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: 'ID token is required.' });
  }

  try {
    await createSession(idToken, res);
    return res.status(200).json({ message: 'Session created successfully.' });
  } catch (error) {
    console.error('Session login error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
