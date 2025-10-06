'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import Header from '../../../components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      login(data.token, data.user);
      router.push('/');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: 'username' | 'password', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header chips={0} />
      <div className="flex items-center justify-center p-3 xs:p-4 sm:p-6 md:p-8" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <Card className="w-full max-w-sm xs:max-w-md bg-card border-border">
          <CardHeader className="text-center px-4 xs:px-6 pt-4 xs:pt-6 pb-3 xs:pb-4">
            <CardTitle className="text-lg xs:text-xl sm:text-2xl text-card-foreground">Welcome back</CardTitle>
            <CardDescription className="text-xs xs:text-sm text-muted-foreground mt-1 xs:mt-2">
              Login to continue playing Blackjack
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 xs:px-6 pb-4 xs:pb-6">
            <form onSubmit={handleSubmit} className="space-y-4 xs:space-y-5 sm:space-y-6">
              {error && (
                <Alert variant="destructive" className="py-2 xs:py-3">
                  <AlertDescription className="text-xs xs:text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2 xs:space-y-3">
                <Label htmlFor="username" className="text-card-foreground text-xs xs:text-sm">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={(e) => updateField('username', e.target.value)}
                  disabled={loading}
                  required
                  className="bg-background border-input text-foreground text-xs xs:text-sm h-9 xs:h-10"
                />
              </div>

              <div className="space-y-2 xs:space-y-3">
                <Label htmlFor="password" className="text-card-foreground text-xs xs:text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  disabled={loading}
                  required
                  className="bg-background border-input text-foreground text-xs xs:text-sm h-9 xs:h-10"
                />
              </div>

              <Button type="submit" className="w-full text-xs xs:text-sm h-9 xs:h-10" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>

              <div className="text-center text-xs xs:text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <a
                  href="/signup"
                  className="underline underline-offset-4 hover:text-primary text-card-foreground"
                >
                  Sign up
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}