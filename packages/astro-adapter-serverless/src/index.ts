import type { SSRManifest } from "astro";
import type {
    APIGatewayProxyEventV2,
    APIGatewayProxyResultV2,
    APIGatewayProxyHandlerV2,
} from "aws-lambda";
import { NodeApp } from "astro/app/node";

import { Buffer } from "node:buffer";
import { Readable } from "node:stream";

import { type APIGatewayProxyStructuredResultV2 } from "aws-lambda";

export type CloudfrontResult = Omit<APIGatewayProxyStructuredResultV2, "body"> & {
    body: Readable | string;
};

const createReadableStream = (val: ArrayBuffer | string): Readable =>
    new Readable({
        // eslint-disable-next-line get-off-my-lawn/prefer-arrow-functions
        read() {
            // @ts-expect-error - TS doesn't like this but it is valid
            this.push(Buffer.from(val));
            // eslint-disable-next-line unicorn/no-null
            this.push(null);
        },
    });

const parseContentType = (header?: string | null) => header?.split(";")[0] ?? "";

const createRequestBody = (
    method: string,
    body: string | undefined,
    isBase64Encoded: boolean | string,
) => {
    if (method !== "GET" && method !== "HEAD" && body) {
        return body && isBase64Encoded ? Buffer.from(body, "base64") : body;
    }

    return undefined;
};

const createLambdaFunctionHeaders = (
    app: NodeApp,
    response: Response,
    knownBinaryMediaTypes: Set<string>,
) => {
    const cookies = [...app.setCookieHeaders(response)];
    const intermediateHeaders = new Headers(response.headers);

    intermediateHeaders.delete("set-cookie");

    const headers = Object.fromEntries(intermediateHeaders.entries());
    const responseContentType = parseContentType(headers["content-type"]);
    const isBase64Encoded = knownBinaryMediaTypes.has(responseContentType);

    return {
        cookies,
        headers,
        isBase64Encoded,
        responseContentType,
    };
};

const createAPIGatewayProxyEventV2ResponseBody = async (
    response: Response,
    isBase64Encoded: boolean,
) => {
    return isBase64Encoded
        ? Buffer.from(await response.arrayBuffer()).toString("base64")
        : ((await response.text()) as string);
};

const createLambdaFunctionResponse = async (
    app: NodeApp,
    response: Response,
    knownBinaryMediaTypes: Set<string>,
): Promise<CloudfrontResult> => {
    const { cookies, headers, isBase64Encoded } = createLambdaFunctionHeaders(
        app,
        response,
        knownBinaryMediaTypes,
    );

    const body = await createAPIGatewayProxyEventV2ResponseBody(response, isBase64Encoded);

    return {
        body,
        cookies,
        headers,
        isBase64Encoded,
        statusCode: response.status,
    };
};

const KNOWN_BINARY_MEDIA_TYPES = [
    "application/epub+zip",
    "application/java-archive",
    "application/msword",
    "application/octet-stream",
    "application/pdf",
    "application/rtf",
    "application/vnd.amazon.ebook",
    "application/vnd.apple.installer+xml",
    "application/vnd.ms-excel",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/x-7z-compressed",
    "application/x-apple-diskimage",
    "application/x-bzip",
    "application/x-bzip2",
    "application/x-gzip",
    "application/x-java-archive",
    "application/x-rar-compressed",
    "application/x-tar",
    "application/x-zip",
    "application/zip",
    "audio/3gpp",
    "audio/aac",
    "audio/basic",
    "audio/mpeg",
    "audio/ogg",
    "audio/wavaudio/webm",
    "audio/x-aiff",
    "audio/x-midi",
    "audio/x-wav",
    "font/otf",
    "font/woff",
    "font/woff2",
    "image/bmp",
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/tiff",
    "image/vnd.microsoft.icon",
    "image/webp",
    "video/3gpp",
    "video/mp2t",
    "video/mpeg",
    "video/ogg",
    "video/quicktime",
    "video/webm",
    "video/x-msvideo",
];

const createExports = (
    manifest: SSRManifest,
): { handler: APIGatewayProxyHandlerV2<CloudfrontResult> } => {
    const app = new NodeApp(manifest);

    const knownBinaryMediaTypes = new Set([...KNOWN_BINARY_MEDIA_TYPES]);

    const handler: APIGatewayProxyHandlerV2<CloudfrontResult> = async (
        event: APIGatewayProxyEventV2,
    ) => {
        const headers = new Headers();

        for (const [k, v] of Object.entries(event.headers)) {
            if (v) headers.set(k, v);
        }

        if (event.cookies) {
            headers.set("cookie", event.cookies.join("; "));
        }

        const domainName = headers.get("x-forwarded-host") ?? event.requestContext.domainName;
        const qs = event.rawQueryString.length ? `?${event.rawQueryString}` : "";
        const url = new URL(
            `${event.rawPath.replace(/\/?index\.html$/u, "")}${qs}`,
            `https://${domainName}`,
        );

        console.log(event.requestContext);

        const request = new Request(url, {
            body: createRequestBody(
                event.requestContext.http.method,
                event.body,
                event.isBase64Encoded,
            ),
            headers,
            method: event.requestContext.http.method,
        });

        console.log({ request });

        let routeData = app.match(request);

        console.log({ routeData });

        if (!routeData) {
            const request404 = new Request(new URL(`404${qs}`, `https://${domainName}`), {
                body: createRequestBody(
                    event.requestContext.http.method,
                    event.body,
                    event.isBase64Encoded,
                ),
                headers,
                method: event.requestContext.http.method,
            });

            routeData = app.match(request404);

            if (!routeData) {
                return {
                    body: "Not found",
                    headers: {
                        "content-type": "text/plain",
                    },
                    statusCode: 404,
                };
            }
        }

        const response = await app.render(request, {
            routeData,
        });

        return createLambdaFunctionResponse(app, response, knownBinaryMediaTypes);
    };

    return {
        handler,
    };
};

export { createExports };
