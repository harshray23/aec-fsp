// This file is deprecated. Login logic has been moved to the client-side
// in src/components/auth/LoginForm.tsx to use the Firebase Client SDK.
// This file can be safely deleted.
export default function handler(req, res) {
  res.status(404).json({ message: "This API endpoint is deprecated." });
}
