export async function authFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if ([403, 500].includes(res.status)) {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    window.location.href = '/login';
    return Promise.reject(new Error('Unauthorized or server error'));
  }
  return res;
}
