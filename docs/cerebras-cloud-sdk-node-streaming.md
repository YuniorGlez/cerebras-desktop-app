# Cerebras Cloud SDK Node.js – Uso y Streaming de Chat Completions (2024)

## Instalación

```sh
npm install @cerebras/cerebras_cloud_sdk
# o desde GitHub:
npm install git+ssh://git@github.com/Cerebras/cerebras-cloud-sdk-node.git
```

## Inicialización y API Key

```js
import Cerebras from '@cerebras/cerebras_cloud_sdk';

// La API key puede omitirse si está en el entorno como CEREBRAS_API_KEY
const client = new Cerebras({
  apiKey: process.env['CEREBRAS_API_KEY'],
});
```

## Crear un Chat Completion (no streaming)

```js
const chatCompletion = await client.chat.completions.create({
  messages: [{ role: 'user', content: 'Why is fast inference important?' }],
  model: 'llama3.1-8b',
});
console.log(chatCompletion?.choices[0]?.message);
```

## Streaming de Chat Completions

```js
const stream = await client.chat.completions.create({
  messages: [{ role: 'user', content: 'Why is fast inference important?' }],
  model: 'llama3.1-8b',
  stream: true,
});
for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```
- El contenido incremental está en `chunk.choices[0].delta.content`.
- Para cancelar un stream, usa `break` en el bucle o `stream.controller.abort()`.

## Manejo de errores

```js
try {
  await client.chat.completions.create({
    messages: [{ role: 'user', content: 'This should cause an error!' }],
    model: 'some-model-that-doesnt-exist',
  });
} catch (err) {
  if (err instanceof Cerebras.APIError) {
    console.log(err.status); // Código HTTP
    console.log(err.name);   // Tipo de error
    console.log(err.headers);
    console.log(err);        // Excepción completa
  } else {
    throw err;
  }
}
```

## Listar modelos disponibles

```js
const models = await client.models.list();
console.log(models);
```

## Buenas prácticas y opciones avanzadas
- Puedes personalizar el agente HTTP (`httpAgent`) para proxies.
- Puedes usar un `fetch` personalizado para logging o middleware.
- El SDK soporta retries automáticos y timeouts configurables.
- Para usar el fetch global (por ejemplo, en NextJS):
  ```js
  import '@cerebras/cerebras_cloud_sdk/shims/web';
  import Cerebras from '@cerebras/cerebras_cloud_sdk';
  ```

## Referencias
- [Repositorio oficial](https://github.com/Cerebras/cerebras-cloud-sdk-node)
- [API Reference](https://github.com/Cerebras/cerebras-cloud-sdk-node/blob/main/api.md)
- [Ejemplo de configuración avanzada](https://github.com/Cerebras/cerebras-cloud-sdk-node/blob/main/README.md)

---

_Este archivo se genera automáticamente usando context7 para mantener la documentación local siempre actualizada y relevante._ 

TITLE: Creating Chat Completions - Cerebras Cloud SDK - Node.js
DESCRIPTION: Initiates a chat completion request using the SDK client. This method sends a POST request to the `/v1/chat/completions` endpoint with parameters provided in the object. It returns a promise that resolves to a `ChatCompletion` object upon successful completion.
SOURCE: https://github.com/cerebras/cerebras-cloud-sdk-node/blob/main/api.md#_snippet_0

LANGUAGE: TypeScript
CODE:
```
client.chat.completions.create({ ...params })
```

----------------------------------------

TITLE: Creating Completions - Cerebras Cloud SDK - Node.js
DESCRIPTION: Initiates a text completion request using the SDK client. This method sends a POST request to the `/v1/completions` endpoint with parameters provided in the object. It returns a promise that resolves to a `Completion` object upon successful completion.
SOURCE: https://github.com/cerebras/cerebras-cloud-sdk-node/blob/main/api.md#_snippet_1

LANGUAGE: TypeScript
CODE:
```
client.completions.create({ ...params })
```

----------------------------------------

TITLE: Providing Custom Fetch Function for Middleware (TypeScript)
DESCRIPTION: Shows how to instantiate the Cerebras client with a custom `fetch` function. This function wraps the actual fetch call (here using `undici`) and allows performing actions like logging before and after the request. This pattern enables implementing custom middleware logic.
SOURCE: https://github.com/cerebras/cerebras-cloud-sdk-node/blob/main/README.md#_snippet_3

LANGUAGE: ts
CODE:
```
import { fetch } from 'undici'; // as one example
import Cerebras from '@cerebras/cerebras_cloud_sdk';

const client = new Cerebras({
  fetch: async (url: RequestInfo, init?: RequestInit): Promise<Response> => {
    console.log('About to make a request', url, init);
    const response = await fetch(url, init);
    console.log('Got response', response);
    return response;
  },
});
```

----------------------------------------

TITLE: Listing Available Models - Cerebras Cloud SDK - Node.js
DESCRIPTION: Retrieves a list of available models using the SDK client. This method sends a GET request to the `/v1/models` endpoint. Optional parameters can be provided in the object for filtering or pagination. It returns a promise that resolves to a `ModelListResponse` object containing the list of models.
SOURCE: https://github.com/cerebras/cerebras-cloud-sdk-node/blob/main/api.md#_snippet_3

LANGUAGE: TypeScript
CODE:
```
client.models.list({ ...params })
```

----------------------------------------

TITLE: Retrieving Model Details - Cerebras Cloud SDK - Node.js
DESCRIPTION: Fetches details for a specific model using the SDK client. This method sends a GET request to the `/v1/models/{model_id}` endpoint, requiring the `modelId` as a path parameter. Additional parameters can be provided in the options object. It returns a promise that resolves to a `ModelRetrieveResponse` object.
SOURCE: https://github.com/cerebras/cerebras-cloud-sdk-node/blob/main/api.md#_snippet_2

LANGUAGE: TypeScript
CODE:
```
client.models.retrieve(modelId, { ...params })
```

----------------------------------------

TITLE: Configuring HTTP Agent for Proxies or Custom Behavior (TypeScript)
DESCRIPTION: Demonstrates how to configure an `httpAgent` for the Cerebras client. It shows setting a default agent (using `https-proxy-agent` for a proxy) when creating the client, and also how to override the agent for a specific request using the request options. This controls connection management and routing.
SOURCE: https://github.com/cerebras/cerebras-cloud-sdk-node/blob/main/README.md#_snippet_4

LANGUAGE: ts
CODE:
```
import http from 'http';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Configure the default for all requests:
const client = new Cerebras({
  httpAgent: new HttpsProxyAgent(process.env.PROXY_URL),
});

// Override per-request:
await client.chat.completions.create(
  { messages: [{ role: 'user', content: 'Why is fast inference important?' }], model: 'llama3.1-8b' },
  {
    httpAgent: new http.Agent({ keepAlive: false }),
  },
);
```

----------------------------------------

TITLE: Including Undocumented Request Param (TypeScript)
DESCRIPTION: Shows how to provide an undocumented parameter (`baz`) when calling an SDK method (`client.foo.create`). The `@ts-expect-error` comment is used to suppress TypeScript type errors for the extra parameter. The SDK sends these extra values as-is, either in the query (for GET) or body (for others).
SOURCE: https://github.com/cerebras/cerebras-cloud-sdk-node/blob/main/README.md#_snippet_1

LANGUAGE: ts
CODE:
```
client.foo.create({
  foo: 'my_param',
  bar: 12,
  // @ts-expect-error baz is not yet public
  baz: 'undocumented option',
});
```

----------------------------------------

TITLE: Posting to Undocumented Endpoint (TypeScript)
DESCRIPTION: Demonstrates how to make a POST request to an endpoint not explicitly defined in the SDK's types. It shows how to pass body and query parameters directly. This approach leverages the client's built-in HTTP methods and respects client options like retries.
SOURCE: https://github.com/cerebras/cerebras-cloud-sdk-node/blob/main/README.md#_snippet_0

LANGUAGE: ts
CODE:
```
await client.post('/some/path', {
  body: { some_prop: 'foo' },
  query: { some_query_arg: 'bar' },
});
```

----------------------------------------

TITLE: Configuring SDK to Use Global Fetch (TypeScript)
DESCRIPTION: Illustrates the necessary import statement (`@cerebras/cerebras_cloud_sdk/shims/web`) to switch the SDK's fetch implementation from `node-fetch` (default in Node) to the global web-standards `fetch`. This is useful when running Node with `--experimental-fetch` or in environments like NextJS. The shim itself doesn't polyfill fetch.
SOURCE: https://github.com/cerebras/cerebras-cloud-sdk-node/blob/main/README.md#_snippet_2

LANGUAGE: ts
CODE:
```
// Tell TypeScript and the package to use the global web fetch instead of node-fetch.
// Note, despite the name, this does not add any polyfills, but expects them to be provided if needed.
import '@cerebras/cerebras_cloud_sdk/shims/web';
import Cerebras from '@cerebras/cerebras_cloud_sdk';
```

----------------------------------------

TITLE: Linking Local Node.js SDK Repository
DESCRIPTION: Provides instructions to clone the repository and then use package manager linking (yarn or pnpm) to create a symbolic link, allowing another project to use the local source code instead of installing from a registry. This is useful for local development and testing.
SOURCE: https://github.com/cerebras/cerebras-cloud-sdk-node/blob/main/CONTRIBUTING.md#_snippet_4

LANGUAGE: sh
CODE:
```
# Clone
$ git clone https://www.github.com/Cerebras/cerebras-cloud-sdk-node
$ cd cerebras-cloud-sdk-node-private

# With yarn
$ yarn link
$ cd ../my-package
$ yarn link @cerebras/cerebras_cloud_sdk

# With pnpm
$ pnpm link --global
$ cd ../my-package
$ pnpm link -—global @cerebras/cerebras_cloud_sdk
```

----------------------------------------

TITLE: Setting up Node.js SDK Environment (yarn)
DESCRIPTION: Installs the project dependencies using yarn and builds the SDK output files to the 'dist/' directory. This assumes yarn v1 is installed and available.
SOURCE: https://github.com/cerebras/cerebras-cloud-sdk-node/blob/main/CONTRIBUTING.md#_snippet_0

LANGUAGE: sh
CODE:
```
$ yarn
$ yarn build
```

----------------------------------------

TITLE: Running Node.js SDK Formatter/Fixer (yarn)
DESCRIPTION: Runs the code formatter (prettier) and linter (eslint) with auto-fixing enabled using the 'yarn fix' command. This automatically corrects many code style and lint issues.
SOURCE: https://github.com/cerebras/cerebras-cloud-sdk-node/blob/main/CONTRIBUTING.md#_snippet_8

LANGUAGE: sh
CODE:
```
$ yarn fix
```

----------------------------------------

TITLE: Running Node.js SDK Linter (yarn)
DESCRIPTION: Runs the configured linter (eslint) on the SDK source files using the 'yarn lint' command to check for code style and quality issues.
SOURCE: https://github.com/cerebras/cerebras-cloud-sdk-node/blob/main/CONTRIBUTING.md#_snippet_7

LANGUAGE: sh
CODE:
```
$ yarn lint
```

----------------------------------------

TITLE: Running Node.js SDK Tests (yarn)
DESCRIPTION: Executes the test suite for the SDK using the 'yarn run test' command. This often depends on a mock server running beforehand.
SOURCE: https://github.com/cerebras/cerebras-cloud-sdk-node/blob/main/CONTRIBUTING.md#_snippet_6

LANGUAGE: sh
CODE:
```
$ yarn run test
```

----------------------------------------

TITLE: Running Node.js SDK Example Script
DESCRIPTION: Makes an example TypeScript file executable using chmod and then runs it using the 'yarn tsn' command, which is configured to compile and execute the script. Replace '<your-example>.ts' with the actual file name.
SOURCE: https://github.com/cerebras/cerebras-cloud-sdk-node/blob/main/CONTRIBUTING.md#_snippet_2

LANGUAGE: sh
CODE:
```
$ chmod +x examples/<your-example>.ts
# run the example against your api
$ yarn tsn -T examples/<your-example>.ts
```

----------------------------------------

TITLE: Setting up Mock Server for Testing
DESCRIPTION: Starts a mock server using the `npx prism` command, configured according to the provided OpenAPI specification file. This mock server is often required as a prerequisite for running the SDK's test suite.
SOURCE: https://github.com/cerebras/cerebras-cloud-sdk-node/blob/main/CONTRIBUTING.md#_snippet_5

LANGUAGE: sh
CODE:
```
$ npx prism mock path/to/your/openapi.yml
```

----------------------------------------

TITLE: Installing Node.js SDK from Git (npm)
DESCRIPTION: Installs the SDK package directly from the specified GitHub repository using npm. This method uses the SSH protocol for cloning.
SOURCE: https://github.com/cerebras/cerebras-cloud-sdk-node/blob/main/CONTRIBUTING.md#_snippet_3

LANGUAGE: sh
CODE:
```
$ npm install git+ssh://git@github.com:Cerebras/cerebras-cloud-sdk-node.git
```

----------------------------------------

TITLE: Adding Node.js SDK Example File Structure
DESCRIPTION: Illustrates the initial structure and shebang line typical for executable TypeScript example files placed within the 'examples/' directory. Files in this directory are not affected by the code generator.
SOURCE: https://github.com/cerebras/cerebras-cloud-sdk-node/blob/main/CONTRIBUTING.md#_snippet_1

LANGUAGE: ts
CODE:
```
// add an example to examples/<your-example>.ts

#!/usr/bin/env -S npm run tsn -T
…
```