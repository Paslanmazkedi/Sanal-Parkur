import https from 'node:https';
import { URL } from 'node:url';

let insecureAgent;

function isTlsInsecureEnabled() {
  return process.env.WEX_TLS_INSECURE === 'true';
}

function getHttpsAgent() {
  if (!isTlsInsecureEnabled()) return undefined;

  if (!insecureAgent) {
    insecureAgent = new https.Agent({ rejectUnauthorized: false });
  }

  return insecureAgent;
}

export function formatWexFetchError(error) {
  const causeCode = error?.cause?.code || error?.code;

  if (causeCode === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || causeCode === 'CERT_HAS_EXPIRED') {
    return [
      'Workcube SSL sertifikasi dogrulanamadi.',
      'Gelistirme icin .env.local dosyasina WEX_TLS_INSECURE=true ekleyin ve dev sunucusunu yeniden baslatin.',
    ].join(' ');
  }

  if (error?.message) {
    return error.message;
  }

  return 'Workcube WEX istegi basarisiz.';
}

export function wexFetch(urlString) {
  const url = new URL(urlString);
  const agent = getHttpsAgent();

  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        agent,
        headers: { Accept: 'application/json' },
      },
      (response) => {
        let rawText = '';

        response.on('data', (chunk) => {
          rawText += chunk;
        });

        response.on('end', () => {
          resolve({
            ok: response.statusCode >= 200 && response.statusCode < 300,
            status: response.statusCode,
            text: async () => rawText,
          });
        });
      },
    );

    request.on('error', (error) => {
      reject(new Error(formatWexFetchError(error)));
    });

    request.setTimeout(20000, () => {
      request.destroy(new Error('Workcube WEX istegi zaman asimina ugradi (20sn).'));
    });
  });
}
