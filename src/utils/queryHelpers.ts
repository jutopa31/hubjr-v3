export interface QueryError {
  message: string;
  code?: string;
  isTimeout?: boolean;
  retryAttempt?: number;
}

export async function withQueryTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 8000,
  operationName = 'Query'
): Promise<T> {
  const startTime = Date.now();
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const elapsed = Date.now() - startTime;
      console.error(`[QueryTimeout] ${operationName} timed out after ${elapsed}ms (limit: ${timeoutMs}ms)`);
      const error: QueryError = { message: `${operationName} timeout after ${timeoutMs}ms`, isTimeout: true };
      reject(error);
    }, timeoutMs);
    Promise.resolve(promise)
      .then((result) => { clearTimeout(timer); resolve(result); })
      .catch((error) => { clearTimeout(timer); reject(error); });
  });
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  operationName = 'Operation'
): Promise<T> {
  let lastError: any = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        await new Promise(r => setTimeout(r, delayMs));
      }
      const result = await fn();
      return result;
    } catch (error: any) {
      lastError = error;
      const isLastAttempt = attempt === maxRetries;
      if (isLastAttempt) {
        const enrichedError: QueryError = { message: error?.message || 'Query failed after retries', code: error?.code, isTimeout: error?.isTimeout, retryAttempt: attempt + 1 };
        throw enrichedError;
      }
    }
  }
  throw lastError;
}

export async function robustQuery<T>(
  queryFn: () => Promise<T> | PromiseLike<T>,
  options: { timeout?: number; retries?: number; operationName?: string } = {}
): Promise<T> {
  const { timeout = 8000, retries = 2, operationName = 'Query' } = options;
  return withRetry(() => withQueryTimeout(Promise.resolve(queryFn()), timeout, operationName), retries, operationName);
}

export function formatQueryError(error: any): string {
  if (error?.isTimeout) return 'La operación tardó demasiado tiempo. Por favor, intenta nuevamente.';
  if (error?.message?.includes('network') || error?.message?.includes('fetch')) return 'Error de conexión. Verifica tu internet e intenta nuevamente.';
  if (error?.code === 'PGRST116') return 'No se encontraron datos.';
  return 'Ocurrió un error inesperado';
}

