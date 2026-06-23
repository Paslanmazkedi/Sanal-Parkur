import https from 'node:https';
import { URL } from 'node:url';

let relaxedTlsAgent;

/**
 * Workcube WEX cagrilari icin TLS dogrulama varsayilan kapali.
 * Workcube sertifika zinciri duzeldiginde WEX_TLS_STRICT=true yapin.
 */
function shouldVerifyWorkcubeTls() {
  if (process.env.WEX_TLS_STRICT === 'true') return true;
  if (process.env.WEX_TLS_INSECURE === 'false') return true;
  return false;
}

function getHttpsAgent() {
  if (shouldVerifyWorkcubeTls()) return undefined;

  if (!relaxedTlsAgent) {
    relaxedTlsAgent = new https.Agent({ rejectUnauthorized: false });
  }

  return relaxedTlsAgent;
}

export function formatWexFetchError(error) {
  const causeCode = error?.cause?.code || error?.code;

  if (causeCode === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || causeCode === 'CERT_HAS_EXPIRED') {
    return [
      'Workcube SSL sertifikasi dogrulanamadi.',
      'Varsayilan olarak TLS kontrolu kapali olmali; hata devam ederse ag/IP erisimini kontrol edin.',
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
