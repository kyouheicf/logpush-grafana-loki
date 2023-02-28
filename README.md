# logpush-grafana-loki

```
wrangler secret put LOKI_USER # XXXXXX
wrangler secret put LOKI_API_KEY # eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx==
wrangler secret put LOKI_HOST # logs-prod-xxxxxx.grafana.net
wrangler publish src/index.js
```
