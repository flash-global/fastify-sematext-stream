# fastify-sematext-stream
Stream to send pino fastify logs to sematext

# Usage
- Can be used with typescript or javascript
- install project
```
npm i --save @redspher2021/fastify-sematext-stream
```

- Used build function
```
import { build } from '@redspher2021/fastify-sematext-stream'

const stream = build({ baseURL: sematextBaseURL, index: sematextIndex });
const instance = fastify({ logger: { stream });
```
