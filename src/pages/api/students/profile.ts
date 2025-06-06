
import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/mysql'; // Import the new MySQL connection pool
import type { Student } from '@/lib/types'; // Assuming Student type matches your table structure
import type { RowDataPacket } from 'mysql2';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { studentId: studentIdentifier } = req.query;

  if (!studentIdentifier || typeof studentIdentifier !== 'string') {
    return res.status(400).json({ message: 'Student ID or unique identifier is required as a query parameter.' });
  }

  try {
    const connection = await pool.getConnection();
    // Adjust the query based on your actual 'students' table structure and primary key or unique identifier.
    // This example assumes you might search by 'id' (primary key) or 'studentId' (a business key).
    const query = 'SELECT * FROM students WHERE id = ? OR studentId = ? LIMIT 1';
    const [rows] = await connection.execute<RowDataPacket[]>(query, [studentIdentifier, studentIdentifier]);
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ message: `Student with identifier '${studentIdentifier}' not found.` });
    }

    // Directly cast the first row to Student. Ensure your DB columns align with the Student type.
    // You might need to map column names if they differ (e.g., student_id to studentId).
    const student = rows[0] as Student; 

    // Convert boolean fields if they are stored as 0/1 in MySQL
    if (typeof student.isEmailVerified === 'number') {
        student.isEmailVerified = Boolean(student.isEmailVerified);
    }
    if (typeof student.isPhoneVerified === 'number') {
        student.isPhoneVerified = Boolean(student.isPhoneVerified);
    }


    return res.status(200).json(student);

  } catch (error: any) {
    console.error('Database error fetching student profile:', error);
    // Provide a more generic error message to the client
    return res.status(500).json({ message: 'Internal server error while fetching student profile. Please check server logs for details.' });
  }
}
