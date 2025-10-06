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

const VALIDATION_RULES = {
  USERNAME_MIN_LENGTH: 3,
  PASSWORD_MIN_LENGTH: 6,
};

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

  const validateForm = (): string | null => {
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    if (formData.password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
      return `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long`;
    }
    if (formData.username.length < VALIDATION_RULES.USERNAME_MIN_LENGTH) {
      return `Username must be at least ${VALIDATION_RULES.USERNAME_MIN_LENGTH} characters long`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Sign up failed');
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

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header chips={0} />
      <div className="flex items-center justify-center p-3 xs:p-4 sm:p-6 md:p-8" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <Card className="w-full max-w-sm xs:max-w-md bg-card border-border">
          <CardHeader className="text-center px-4 xs:px-6 pt-4 xs:pt-6 pb-3 xs:pb-4">
            <CardTitle className="text-lg xs:text-xl sm:text-2xl text-card-foreground">Create an account</CardTitle>
            <CardDescription className="text-xs xs:text-sm text-muted-foreground mt-1 xs:mt-2">
              Sign up to start playing Blackjack
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
                  placeholder="Choose a username"
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
                  placeholder={`Create a password (min ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters)`}
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  disabled={loading}
                  required
                  className="bg-background border-input text-foreground text-xs xs:text-sm h-9 xs:h-10"
                />
              </div>

              <div className="space-y-2 xs:space-y-3">
                <Label htmlFor="confirmPassword" className="text-card-foreground text-xs xs:text-sm">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  disabled={loading}
                  required
                  className="bg-background border-input text-foreground text-xs xs:text-sm h-9 xs:h-10"
                />
              </div>

              <Button type="submit" className="w-full text-xs xs:text-sm h-9 xs:h-10" disabled={loading}>
                {loading ? 'Creating account...' : 'Sign Up'}
              </Button>

              <div className="text-center text-xs xs:text-sm text-muted-foreground">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="underline underline-offset-4 hover:text-primary text-card-foreground"
                >
                  Login
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}