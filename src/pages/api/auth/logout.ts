// src/pages/api/auth/logout.ts
import { deleteSession } from '@/lib/auth';
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    deleteSession(res);
    return res.status(200).json({ message: 'Successfully logged out' });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
