export function isAdmin(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS ?? ''
  return adminEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .includes(email.toLowerCase())
}
