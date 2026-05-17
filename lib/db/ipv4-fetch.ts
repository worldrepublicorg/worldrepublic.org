import https from "node:https";
import { neonConfig } from "@neondatabase/serverless";

const ipv4Agent = new https.Agent({ family: 4, keepAlive: true });

/**
 * WSL2 workaround: Node.js fetch fails due to broken IPv6 happy eyeballs.
 * Forces IPv4 via https.request so Neon HTTP calls don't time out.
 */
export function applyIpv4Fetch() {
	neonConfig.fetchFunction = (
		url: string | URL,
		init?: RequestInit,
	): Promise<Response> =>
		new Promise((resolve, reject) => {
			const parsed = new URL(String(url));
			const body =
				init?.body != null
					? typeof init.body === "string"
						? init.body
						: JSON.stringify(init.body)
					: undefined;
			const headers: Record<string, string> = {};
			if (init?.headers) {
				const h = init.headers;
				if (h instanceof Headers) {
					h.forEach((v, k) => {
						headers[k] = v;
					});
				} else if (Array.isArray(h)) {
					for (const [k, v] of h) headers[k] = v;
				} else {
					Object.assign(headers, h);
				}
			}

			const req = https.request(
				{
					hostname: parsed.hostname,
					port: 443,
					path: parsed.pathname + parsed.search,
					method: init?.method ?? (body ? "POST" : "GET"),
					headers,
					agent: ipv4Agent,
				},
				(res) => {
					const chunks: Buffer[] = [];
					res.on("data", (c) => chunks.push(c));
					res.on("end", () => {
						const buf = Buffer.concat(chunks);
						resolve(
							new Response(buf, {
								status: res.statusCode ?? 200,
								statusText: res.statusMessage ?? "",
								headers: res.headers as Record<string, string>,
							}),
						);
					});
				},
			);
			req.on("error", reject);
			if (body) req.write(body);
			req.end();
		});
}
