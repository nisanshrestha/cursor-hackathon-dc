import * as https from 'https';
import * as http from 'http';
import * as url from 'url';

export interface PostResult {
    statusCode: number;
    body: string;
}

export async function postJson(
    apiUrl: string,
    body: unknown,
    headers: Record<string, string>
): Promise<PostResult> {
    return new Promise((resolve, reject) => {
        const isHttps = url.parse(apiUrl).protocol === 'https:';
        const lib = isHttps ? https : http;
        const bodyStr = JSON.stringify(body);
        const reqHeaders = {
            ...headers,
            'Content-Length': Buffer.byteLength(bodyStr, 'utf8'),
        };
        const req = lib.request(
            apiUrl,
            { method: 'POST', headers: reqHeaders },
            (res) => {
                const chunks: Buffer[] = [];
                res.on('data', (chunk: Buffer) => chunks.push(chunk));
                res.on('end', () =>
                    resolve({
                        statusCode: res.statusCode ?? 0,
                        body: Buffer.concat(chunks).toString('utf8'),
                    })
                );
                res.on('error', reject);
            }
        );
        req.on('error', reject);
        req.write(bodyStr);
        req.end();
    });
}
