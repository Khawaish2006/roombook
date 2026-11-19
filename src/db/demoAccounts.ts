// The team accounts seeded on first launch. Kept in one place so the
// seed file and the README stay in sync. Not shown anywhere in the app.
import { Role } from '../models';

/** Starting password for every seeded account. Each person can sign up separately with their own. */
export const DEMO_PASSWORD = 'roombook123';

export const USERS: { id: string; name: string; email: string; role: Role }[] = [
  { id: 'u1', name: 'Khushi', email: 'khushi@college.edu', role: 'student' },
  { id: 'u2', name: 'Kanika Debnath', email: 'kanika.debnath@college.edu', role: 'student' },
  { id: 'u3', name: 'Kanika Chouhan', email: 'kanika.chouhan@college.edu', role: 'student' },
  { id: 'admin', name: 'Khawaish Jindal', email: 'khawaish@admin.ac', role: 'admin' },
];

