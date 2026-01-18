---
description: Deploy frontend to Cloudflare Pages
---

Deploy the YouAndINotAI dating frontend to Cloudflare Pages:

1. Build the frontend: `cd C:\Users\t55o\GOSPEL-V1.4.1-WORKSPACE\frontend && npm run build`
2. Deploy to Cloudflare: `npx wrangler pages deploy dist --project-name=youandinotai`
3. Verify deployment at https://youandinotai.com

Report the deployment URL and any errors.
