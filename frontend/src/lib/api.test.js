import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../firebase', () => ({
  auth: { currentUser: { getIdToken: async () => 'test-token' } },
}));

import { auth } from '../firebase';
import { apiRequest } from './api';

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

beforeEach(() => {
  vi.restoreAllMocks();
  auth.currentUser = { getIdToken: async () => 'test-token' };
});

describe('apiRequest', () => {
  it('sends the Firebase token and JSON body, and returns data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, { success: true, data: { lectureId: 'L1' } }));
    vi.stubGlobal('fetch', fetchMock);

    const data = await apiRequest('/api/lectures', { method: 'POST', body: { subject: 'Maths' } });

    expect(data).toEqual({ lectureId: 'L1' });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/lectures$/);
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer test-token');
    expect(options.body).toBe(JSON.stringify({ subject: 'Maths' }));
  });

  it("throws the server's message on an error response", async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(404, { success: false, message: 'Session code not found.' })));
    await expect(apiRequest('/api/lectures/join', { method: 'POST', body: {} })).rejects.toThrow('Session code not found.');
  });

  it('gives a friendly message when the server is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(apiRequest('/api/health')).rejects.toThrow('Cannot reach the Lectra server');
  });

  it('refuses to call the server when signed out', async () => {
    auth.currentUser = null;
    await expect(apiRequest('/api/health')).rejects.toThrow('signed out');
  });
});
