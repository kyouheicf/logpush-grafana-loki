export default {
	async fetch(request, env, ctx) {
		// Check pre-shared key header
		const PRESHARED_AUTH_HEADER_KEY = 'X-Logpush-Auth';
		const PRESHARED_AUTH_HEADER_VALUE = 'mypresharedkey';
		const psk = request.headers.get(PRESHARED_AUTH_HEADER_KEY);
		if (psk !== PRESHARED_AUTH_HEADER_VALUE) {
			return new Response('Sorry, you have submitted an invalid key.', {
				status: 403,
			});
		}

		const contentEncoding = request.headers.get('content-encoding')
		const buf = await request.arrayBuffer();
		const enc = new TextDecoder("utf-8");

		if (contentEncoding === 'gzip') {
			// Decompress gzipped logpush body to json
			const blob = new Blob([buf])
			const ds = new DecompressionStream('gzip');
			const decompressedStream = blob.stream().pipeThrough(ds);
			const buffer = await new Response(decompressedStream).arrayBuffer();
			const decompressed = new Uint8Array(buffer)
			const ndjson = enc.decode(decompressed)
			const json = ndjson.split('\n')
			const lokiFormat = { "streams": [{ "stream": { "job": "cloudflare-logpush-http-requests" }, "values": [] }] }
			json.forEach(element => {
				const date = element.EdgeStartTimestamp || new Date().getTime() * 1000000
				lokiFormat.streams[0].values.push([date.toString(), element])
			})

			// Post data to Grafana Loki
			return await fetch(`https://${env.LOKI_HOST}/loki/api/v1/push`, {
				method: "POST",
				body: JSON.stringify(lokiFormat),
				headers: {
					"Content-Type": "application/json",
					Authorization: 'Basic ' + btoa(`${env.LOKI_USER}:${env.LOKI_API_KEY}`)
				}
			});
		} else {
			// Initial pre-flight Logpush Request to confirm the integration check
			const compressed = new Uint8Array(buf);
			console.log(enc.decode(compressed).trim()) //{"content":"test","filename":"test.txt"}')
			const lokiFormat = { "streams": [{ "stream": { "job": "cloudflare-logpush-http-requests" }, "values": [] }] }
			const unixnano = new Date().getTime() * 1000000
			const json = '{"content":"test","filename":"test.txt"}';
			lokiFormat.streams[0].values.push([unixnano.toString(), json])
			return await fetch(`https://${env.LOKI_HOST}/loki/api/v1/push`, {
				method: "POST",
				body: JSON.stringify(lokiFormat),
				headers: {
					"Content-Type": "application/json",
					Authorization: 'Basic ' + btoa(`${env.LOKI_USER}:${env.LOKI_API_KEY}`)
				}
			});
		}
	},
};
