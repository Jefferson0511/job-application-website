'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  Modal,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { authApi, errorMessage } from '../src/lib/api';
import { setToken } from '../src/lib/auth-token';

interface AuthModalProps {
  opened: boolean;
  onClose: () => void;
}

export default function AuthModal({ opened, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setEmail('');
    setPassword('');
    setError(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const request = mode === 'login' ? authApi.login : authApi.register;
      const { data } = await request({ email, password });
      setToken(data.accessToken);
      reset();
      onClose();
    } catch (err) {
      setError(
        errorMessage(
          err,
          mode === 'login'
            ? 'Could not sign in. Check your email and password.'
            : 'Could not create the account.',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="sm"
      radius="md"
      centered
      title={mode === 'login' ? 'Sign in' : 'Create an account'}
    >
      <Stack>
        {error && (
          <Alert color="red" radius="md">
            {error}
          </Alert>
        )}

        <TextInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
          radius="md"
          withAsterisk
        />

        <PasswordInput
          label="Password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
          // Enter should submit; a form this small does not need a <form>.
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !submitting) {
              void handleSubmit();
            }
          }}
          radius="md"
          withAsterisk
        />

        <Button
          onClick={() => void handleSubmit()}
          loading={submitting}
          disabled={!email || password.length < 8}
          radius="md"
          fullWidth
        >
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </Button>

        <Text size="sm" c="dimmed" ta="center">
          {mode === 'login' ? 'No account yet? ' : 'Already registered? '}
          <Text
            component="span"
            c="blue"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
            }}
          >
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </Text>
        </Text>
      </Stack>
    </Modal>
  );
}
