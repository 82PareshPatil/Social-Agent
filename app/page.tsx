import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: '4rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Social Agent</h1>
      <p><Link href="/sign-in">Sign in</Link> · <Link href="/sign-up">Create an account</Link></p>
    </main>
  );
}
