'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SignUpPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Validate username length
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Sign up failed');
        setLoading(false);
        return;
      }

      // Sign up successful - login and redirect
      login(data.token, data.user);
      router.push('/');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="flex flex-col gap-6 w-full max-w-md">
        <Card className="bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-card-foreground">Create an account</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign up to start playing Blackjack
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="username" className="text-card-foreground">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Choose a username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      disabled={loading}
                      required
                      className="bg-background border-input text-foreground"
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="password" className="text-card-foreground">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password (min 6 characters)"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      disabled={loading}
                      required
                      className="bg-background border-input text-foreground"
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="confirmPassword" className="text-card-foreground">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      disabled={loading}
                      required
                      className="bg-background border-input text-foreground"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating account...' : 'Sign Up'}
                  </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <a
                    href="/login"
                    className="underline underline-offset-4 hover:text-primary text-card-foreground"
                  >
                    Login
                  </a>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}