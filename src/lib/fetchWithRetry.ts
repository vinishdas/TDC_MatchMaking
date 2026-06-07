/**
 * Wrapper around fetch to handle network infrastructure failures with automatic
 * retries and exponential backoff.
 */
export async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3, baseDelayMs = 500): Promise<Response> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // Add a timeout abort controller to handle hanging requests
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);

      // If response is not ok and it's a server error (5xx), we might want to retry
      if (!response.ok && response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Return successful or 4xx responses immediately
      return response;
    } catch (error: any) {
      // Don't retry if it's an abort error unless we caused it by timeout
      if (error.name === 'AbortError' && !options.signal?.aborted) {
        // This was our internal timeout
        console.warn(`Request to ${url} timed out. Retrying...`);
      } else if (error.name === 'AbortError') {
        throw error;
      }
      
      retries++;
      if (retries >= maxRetries) {
        throw new Error(`Network request failed after ${maxRetries} retries: ${error.message}`);
      }
      
      // Exponential backoff
      const delay = baseDelayMs * Math.pow(2, retries - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Unreachable');
}
