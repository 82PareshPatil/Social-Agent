import type { Metadata } from 'next';
import { AuthPage } from '@/components/auth-page';

export const metadata: Metadata = { title: 'Create an account · Social Agent' };

export default function SignUp() { return <AuthPage mode="sign-up" />; }
