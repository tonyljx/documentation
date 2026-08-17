import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { legacyModelKeys, publicModels } from "./openapi-model-manifest.mjs";

const openapiPath = fileURLToPath(
  new URL("../api-reference/openapi.json", import.meta.url),
);

const api = JSON.parse(await readFile(openapiPath, "utf8"));

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const jsonContent = (schema) => ({
  "application/json": { schema },
});
const publicUrl = {
  type: "string",
  format: "uri",
  pattern: "^https?://",
  description: "Publicly reachable HTTP(S) URL.",
};
const publicUrls = (maxItems, minItems) => ({
  type: "array",
  ...(minItems ? { minItems } : {}),
  maxItems,
  items: publicUrl,
});
const byteLimitedPrompt = (maxBytes) => ({
  type: "string",
  minLength: 1,
  description: `Required prompt. The gateway enforces a ${maxBytes}-byte UTF-8 limit.`,
  "x-wizzx-maxBytes": maxBytes,
});
const enumString = (values, extra = {}) => ({
  type: "string",
  enum: values,
  ...extra,
});
const hasProperty = (name) => ({
  required: [name],
  properties: { [name]: {} },
});
const hasAnyProperty = (names) => ({
  anyOf: names.map((name) => hasProperty(name)),
});
const forbidProperties = (names) => ({
  not: hasAnyProperty(names),
});
const disallowPropertyGroupsTogether = (left, right) => ({
  not: {
    allOf: [hasAnyProperty(left), hasAnyProperty(right)],
  },
});

const imageRatios = [
  "1:1",
  "9:16",
  "16:9",
  "3:4",
  "4:3",
  "3:2",
  "2:3",
  "5:4",
  "4:5",
  "21:9",
  "auto",
];
const nanoBanana2Ratios = [
  "1:1",
  "1:4",
  "1:8",
  "2:3",
  "3:2",
  "3:4",
  "4:1",
  "4:3",
  "4:5",
  "5:4",
  "8:1",
  "9:16",
  "16:9",
  "21:9",
  "auto",
];
const seedanceRatios = [
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
  "21:9",
  "adaptive",
];
const elevenLabsVoices = [
  "Rachel",
  "Aria",
  "Roger",
  "Sarah",
  "Laura",
  "Charlie",
  "George",
  "Callum",
  "River",
  "Liam",
  "Charlotte",
  "Alice",
  "Matilda",
  "Will",
  "Jessica",
  "Eric",
  "Chris",
  "Brian",
  "Daniel",
  "Lily",
  "Bill",
];

api.info = {
  ...api.info,
  version: "1.2.0",
  license: {
    name: "MIT",
    url: "https://github.com/tonyljx/documentation/blob/main/LICENSE",
  },
  description:
    "Wizzx asynchronous image, video, and audio generation API. " +
    "Model keys are placed in the submit URL. Submit returns a Wizzx task_id; " +
    "poll that ID through /api/v1/task/status. Authentication uses a Wizzx " +
    "API key in the Authorization: Bearer <key> header.",
};
api.servers = [
  {
    url: "https://api.wizzx.ai",
    description: "Production API",
  },
];

api.tags = [
  { name: "Discovery", description: "Public model and pricing discovery." },
  { name: "Credits", description: "Authenticated credit balance." },
  { name: "Image generation", description: "Asynchronous image tasks." },
  { name: "Video generation", description: "Asynchronous video tasks." },
  { name: "Audio generation", description: "Asynchronous speech tasks." },
  { name: "Tasks", description: "Asynchronous task status." },
  {
    name: "Legacy models",
    description:
      "Compatibility-only models hidden from /pricing. Do not select these automatically.",
  },
];

api.components ??= {};
api.components.securitySchemes = {
  bearerAuth: {
    type: "http",
    scheme: "bearer",
    description: "Wizzx API key. This is not a JWT.",
  },
};
api.components.schemas ??= {};

Object.assign(api.components.schemas, {
  ErrorDetail: {
    type: "object",
    required: ["message", "type", "param", "code"],
    properties: {
      message: { type: "string" },
      type: {
        type: "string",
        enum: [
          "invalid_request_error",
          "authentication_error",
          "insufficient_quota",
          "permission_denied",
          "not_found_error",
          "conflict_error",
          "unprocessable_entity_error",
          "rate_limit_error",
          "server_error",
          "service_unavailable",
        ],
      },
      param: { type: "string", nullable: true },
      code: { type: "string" },
    },
  },
  ErrorResponse: {
    type: "object",
    required: ["error"],
    properties: {
      error: ref("ErrorDetail"),
      request_id: { type: "string", format: "uuid" },
      retry_after: {
        type: "integer",
        format: "int64",
        minimum: 0,
        description: "Retry delay in seconds. Present for rate-limit errors.",
      },
    },
  },
  TaskSubmitData: {
    type: "object",
    required: ["task_id", "model_key", "credits_deducted"],
    properties: {
      task_id: {
        type: "string",
        format: "uuid",
        description: "Wizzx task ID used for status polling.",
      },
      model_key: { type: "string" },
      credits_deducted: {
        type: "integer",
        minimum: 0,
        description: "Credits reserved when the task is accepted.",
      },
      provider_task_id: {
        type: "string",
        description: "Diagnostic field returned only when debug=1.",
      },
      provider_key: {
        type: "string",
        description: "Diagnostic field returned only when debug=1.",
      },
    },
  },
  TaskSubmitResponse: {
    type: "object",
    required: ["code", "message", "data", "request_id"],
    properties: {
      code: { type: "integer", enum: [0] },
      message: { type: "string", example: "success" },
      data: ref("TaskSubmitData"),
      request_id: { type: "string", format: "uuid" },
    },
  },
  TaskStatusRequest: {
    type: "object",
    additionalProperties: false,
    required: ["task_id"],
    properties: {
      task_id: {
        type: "string",
        format: "uuid",
        description: "Wizzx task ID returned by submit.",
      },
    },
  },
  TaskStatusData: {
    type: "object",
    required: ["task_id", "status", "result_urls", "error", "credits_deducted"],
    properties: {
      task_id: { type: "string", format: "uuid" },
      status: {
        type: "string",
        enum: [
          "PENDING",
          "QUEUED",
          "PROCESSING",
          "REVIEW_REQUIRED",
          "SUCCEEDED",
          "FAILED",
        ],
        description:
          "DISPATCHING is internal and is returned to clients as PROCESSING.",
      },
      result_urls: {
        type: "array",
        nullable: true,
        items: { type: "string", format: "uri" },
      },
      error: { type: "string" },
      credits_deducted: {
        type: "integer",
        minimum: 0,
        description: "Reserved or finally settled credits for this task.",
      },
    },
  },
  TaskStatusResponse: {
    type: "object",
    required: ["code", "message", "data", "request_id"],
    properties: {
      code: { type: "integer", enum: [0] },
      message: { type: "string", example: "success" },
      data: ref("TaskStatusData"),
      request_id: { type: "string", format: "uuid" },
    },
  },
  PricingTier: {
    type: "object",
    required: ["label", "credits"],
    properties: {
      label: { type: "string" },
      credits: { type: "integer", minimum: 0 },
      params: {
        type: "object",
        additionalProperties: true,
        description: "Request parameters that select this pricing tier.",
      },
    },
  },
  ModelPricing: {
    type: "object",
    required: ["model_key", "name", "provider", "category", "unit", "tiers"],
    properties: {
      model_key: { type: "string" },
      name: { type: "string" },
      provider: { type: "string" },
      category: enumString(["image", "video", "sound"]),
      unit: enumString([
        "per-image",
        "per-second",
        "per-request",
        "per-megapixel",
        "per-1000-chars",
      ]),
      tiers: { type: "array", items: ref("PricingTier") },
      note: { type: "string" },
    },
  },
  PricingData: {
    type: "object",
    required: ["credit_to_usd", "count", "models"],
    properties: {
      credit_to_usd: { type: "number", format: "double", example: 0.001 },
      count: { type: "integer", minimum: 0 },
      models: { type: "array", items: ref("ModelPricing") },
    },
  },
  PricingResponse: {
    type: "object",
    required: ["code", "message", "data", "request_id"],
    properties: {
      code: { type: "integer", enum: [0] },
      message: { type: "string", example: "success" },
      data: ref("PricingData"),
      request_id: { type: "string", format: "uuid" },
    },
  },
  CreditBalanceData: {
    type: "object",
    required: ["balance"],
    properties: {
      balance: { type: "integer", minimum: 0 },
    },
  },
  CreditBalanceResponse: {
    type: "object",
    required: ["code", "message", "data", "request_id"],
    properties: {
      code: { type: "integer", enum: [0] },
      message: { type: "string", example: "success" },
      data: ref("CreditBalanceData"),
      request_id: { type: "string", format: "uuid" },
    },
  },
  SeedreamSubmitRequest: {
    type: "object",
    additionalProperties: false,
    required: ["prompt"],
    description:
      "Seedream 4.0 and 4.5 share this request schema. input image count + effective batch_size must be at most 15.",
    properties: {
      prompt: { type: "string", minLength: 1 },
      image_urls: publicUrls(14),
      aspect_ratio: enumString([
        "1:1",
        "4:3",
        "3:4",
        "16:9",
        "9:16",
        "3:2",
        "2:3",
        "21:9",
      ]),
      resolution: enumString(["1K", "2K", "4K"], { default: "2K" }),
      batch_size: { type: "integer", minimum: 1, maximum: 15, default: 1 },
      seed: { type: "integer" },
      watermark: { type: "boolean", default: false },
    },
  },
  NanoBananaProSubmitRequest: {
    type: "object",
    additionalProperties: false,
    required: ["prompt"],
    properties: {
      prompt: byteLimitedPrompt(10000),
      image_urls: publicUrls(8),
      aspect_ratio: enumString(imageRatios, { default: "1:1" }),
      resolution: enumString(["1K", "2K", "4K"], { default: "1K" }),
      output_format: enumString(["png", "jpg", "jpeg"], { default: "png" }),
    },
  },
  NanoBananaSubmitRequest: {
    type: "object",
    additionalProperties: false,
    required: ["prompt"],
    properties: {
      prompt: byteLimitedPrompt(5000),
      image_urls: publicUrls(10),
      aspect_ratio: enumString(imageRatios, { default: "1:1" }),
      output_format: enumString(["png", "jpeg"], { default: "png" }),
    },
  },
  NanoBanana2SubmitRequest: {
    type: "object",
    additionalProperties: false,
    required: ["prompt"],
    properties: {
      prompt: byteLimitedPrompt(20000),
      image_urls: publicUrls(14),
      aspect_ratio: enumString(nanoBanana2Ratios, { default: "auto" }),
      resolution: enumString(["1K", "2K", "4K"], { default: "1K" }),
      output_format: enumString(["png", "jpg", "jpeg"], { default: "jpg" }),
    },
  },
  NanoBanana2LiteSubmitRequest: {
    type: "object",
    additionalProperties: false,
    required: ["prompt"],
    properties: {
      prompt: byteLimitedPrompt(20000),
      image_urls: publicUrls(10),
      aspect_ratio: enumString(nanoBanana2Ratios, { default: "auto" }),
    },
  },
  GPTImage2SubmitRequest: {
    type: "object",
    additionalProperties: false,
    required: ["prompt"],
    properties: {
      prompt: byteLimitedPrompt(32000),
      image_urls: publicUrls(10),
      size: enumString(["auto", "1024x1024", "1536x1024", "1024x1536"]),
      quality: enumString(["auto", "low", "medium", "high"]),
      output_format: enumString(["png", "jpeg", "webp"]),
    },
  },
  RunwayGen3SubmitRequest: {
    type: "object",
    additionalProperties: false,
    required: ["prompt", "type"],
    description:
      "image-to-video requires exactly one image_urls item; text-to-video must omit image_urls. 10 seconds cannot be combined with 1080p.",
    properties: {
      prompt: { type: "string", minLength: 1 },
      type: enumString(["text-to-video", "image-to-video"]),
      image_urls: publicUrls(1),
      duration: { type: "integer", enum: [5, 10], default: 5 },
      resolution: enumString(["720p", "1080p"], { default: "720p" }),
      fps: { type: "integer", enum: [24, 30, 60], default: 24 },
      aspect_ratio: enumString(["16:9", "9:16", "1:1"]),
    },
    allOf: [
      {
        oneOf: [
          {
            properties: { type: enumString(["text-to-video"]) },
            not: {
              required: ["image_urls"],
              properties: { image_urls: {} },
            },
          },
          {
            required: ["image_urls"],
            properties: {
              type: enumString(["image-to-video"]),
              image_urls: publicUrls(1, 1),
            },
          },
        ],
      },
      {
        not: {
          required: ["duration", "resolution"],
          properties: {
            duration: { enum: [10] },
            resolution: { enum: ["1080p"] },
          },
        },
      },
    ],
  },
  Veo3SubmitRequest: {
    type: "object",
    additionalProperties: false,
    required: ["prompt", "type"],
    description:
      "text-to-video must omit image_urls; image-to-video requires 1-2 images; reference-to-video requires 1-3 images, duration 8, and aspect_ratio 16:9.",
    properties: {
      prompt: { type: "string", minLength: 1 },
      type: enumString([
        "text-to-video",
        "image-to-video",
        "reference-to-video",
      ]),
      image_urls: publicUrls(3),
      duration: { type: "integer", enum: [4, 6, 8], default: 8 },
      resolution: enumString(["720p"], { default: "720p" }),
      aspect_ratio: enumString(["16:9", "9:16", "Auto", "auto"], {
        default: "16:9",
      }),
      model: enumString(["veo3_fast"], { default: "veo3_fast" }),
      seeds: { type: "integer", minimum: 10000, maximum: 99999 },
      enable_translation: { type: "boolean" },
      watermark: { type: "string", maxLength: 128 },
    },
    allOf: [
      {
        oneOf: [
          {
            properties: { type: enumString(["text-to-video"]) },
            not: {
              required: ["image_urls"],
              properties: { image_urls: {} },
            },
          },
          {
            required: ["image_urls"],
            properties: {
              type: enumString(["image-to-video"]),
              image_urls: publicUrls(2, 1),
            },
          },
          {
            required: ["image_urls"],
            properties: {
              type: enumString(["reference-to-video"]),
              image_urls: publicUrls(3, 1),
              duration: { type: "integer", enum: [8], default: 8 },
              aspect_ratio: enumString(["16:9"], { default: "16:9" }),
            },
          },
        ],
      },
    ],
  },
  SeedanceSubmitRequest: {
    type: "object",
    additionalProperties: false,
    required: ["prompt", "type"],
    description:
      "Current HTTP contract: omit resolution for the 480p default. Explicit 480p is temporarily rejected by the shared gateway binding; explicit values may be 720p or 1080p. image-to-video requires exactly one image.",
    properties: {
      prompt: { type: "string", minLength: 1 },
      type: enumString(["text-to-video", "image-to-video"]),
      image_urls: publicUrls(1),
      duration: { type: "integer", enum: [5, 10], default: 5 },
      resolution: enumString(["720p", "1080p"], {
        description:
          "Omit this field to use the current 480p default. Explicit 480p is not accepted until the gateway binding is fixed.",
      }),
      aspect_ratio: enumString(seedanceRatios),
      seed: {
        type: "integer",
        minimum: -1,
        maximum: 4294967295,
      },
      watermark: { type: "boolean" },
      camera_fixed: { type: "boolean" },
    },
    allOf: [
      {
        oneOf: [
          {
            properties: { type: enumString(["text-to-video"]) },
            not: {
              required: ["image_urls"],
              properties: { image_urls: {} },
            },
          },
          {
            required: ["image_urls"],
            properties: {
              type: enumString(["image-to-video"]),
              image_urls: publicUrls(1, 1),
            },
          },
        ],
      },
    ],
  },
  Seedance15ProSubmitRequest: {
    type: "object",
    additionalProperties: false,
    required: ["prompt", "type"],
    description:
      "Current HTTP contract: duration is 4-12 seconds and explicit resolution is 720p. The model intends to support duration=-1 and 480p, but shared gateway binding currently rejects both. image-to-video requires 1-2 images.",
    properties: {
      prompt: { type: "string", minLength: 1 },
      type: enumString(["text-to-video", "image-to-video"]),
      image_urls: publicUrls(2),
      duration: { type: "integer", minimum: 4, maximum: 12, default: 5 },
      resolution: enumString(["720p"], { default: "720p" }),
      aspect_ratio: enumString(seedanceRatios, { default: "adaptive" }),
      seed: {
        type: "integer",
        minimum: -1,
        maximum: 4294967295,
      },
      watermark: { type: "boolean" },
      camera_fixed: { type: "boolean" },
      generate_audio: { type: "boolean", default: true },
      return_last_frame: { type: "boolean", default: false },
    },
    allOf: [
      {
        oneOf: [
          {
            properties: { type: enumString(["text-to-video"]) },
            not: {
              required: ["image_urls"],
              properties: { image_urls: {} },
            },
          },
          {
            required: ["image_urls"],
            properties: {
              type: enumString(["image-to-video"]),
              image_urls: publicUrls(2, 1),
            },
          },
        ],
      },
    ],
  },
  TrajectoryPoint: {
    type: "object",
    required: ["x", "y"],
    properties: {
      x: {
        type: "integer",
        minimum: 1,
        description:
          "The backend currently rejects zero because of binding semantics, despite the intended non-negative range.",
      },
      y: {
        type: "integer",
        minimum: 1,
        description:
          "The backend currently rejects zero because of binding semantics, despite the intended non-negative range.",
      },
    },
  },
  DynamicMask: {
    type: "object",
    required: ["mask", "trajectories"],
    properties: {
      mask: { type: "string", format: "uri" },
      trajectories: {
        type: "array",
        minItems: 2,
        maxItems: 77,
        items: ref("TrajectoryPoint"),
      },
    },
  },
  CameraControlConfig: {
    type: "object",
    additionalProperties: false,
    description: "Exactly one property must be non-zero.",
    properties: Object.fromEntries(
      ["horizontal", "vertical", "pan", "tilt", "roll", "zoom"].map((key) => [
        key,
        { type: "number", minimum: -10, maximum: 10 },
      ]),
    ),
    allOf: [
      {
        oneOf: ["horizontal", "vertical", "pan", "tilt", "roll", "zoom"].map(
          (key) => ({
            required: [key],
            properties: { [key]: { not: { enum: [0] } } },
          }),
        ),
      },
    ],
  },
  CameraControl: {
    type: "object",
    additionalProperties: false,
    required: ["type"],
    properties: {
      type: enumString([
        "simple",
        "down_back",
        "forward_up",
        "right_turn_forward",
        "left_turn_forward",
      ]),
      config: ref("CameraControlConfig"),
    },
    allOf: [
      {
        oneOf: [
          {
            required: ["config"],
            properties: { type: enumString(["simple"]) },
          },
          {
            properties: {
              type: enumString([
                "down_back",
                "forward_up",
                "right_turn_forward",
                "left_turn_forward",
              ]),
            },
          },
        ],
      },
    ],
  },
  KlingSubmitRequest: {
    type: "object",
    additionalProperties: false,
    required: ["prompt", "type", "quality_mode", "duration"],
    description:
      "image-to-video requires exactly one image_urls item; text-to-video must omit image_urls. image_tail, masks, and camera_control are mutually exclusive for image-to-video. aspect_ratio and sound are only valid for kling-v2-6.",
    properties: {
      prompt: byteLimitedPrompt(2500),
      type: enumString(["text-to-video", "image-to-video"]),
      image_urls: publicUrls(1),
      quality_mode: enumString(["std", "pro"]),
      model_name: enumString(
        [
          "kling-v1",
          "kling-v1-5",
          "kling-v1-6",
          "kling-v2-1",
          "kling-v2-1-master",
          "kling-v2-5-turbo",
          "kling-v2-6",
        ],
        { default: "kling-v1" },
      ),
      duration: { type: "integer", enum: [5, 10] },
      image_tail: { type: "string" },
      negative_prompt: {
        type: "string",
        description:
          "Optional negative prompt. The gateway enforces a 2500-byte UTF-8 limit.",
        "x-wizzx-maxBytes": 2500,
      },
      cfg_scale: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description:
          "V1.x only. Explicit 0 is currently normalized to 0.5; omit for V2.x.",
      },
      aspect_ratio: enumString(["16:9", "9:16", "1:1"], {
        description: "kling-v2-6 only; defaults to 16:9 for that model.",
      }),
      sound: enumString(["on", "off"], {
        description: "kling-v2-6 only; defaults to off.",
      }),
      static_mask: { type: "string" },
      dynamic_masks: {
        type: "array",
        maxItems: 6,
        items: ref("DynamicMask"),
      },
      camera_control: ref("CameraControl"),
      callback_url: { type: "string", format: "uri" },
      external_task_id: { type: "string" },
    },
    allOf: [
      {
        oneOf: [
          {
            properties: {
              type: enumString(["text-to-video"]),
              model_name: enumString([
                "kling-v1",
                "kling-v1-6",
                "kling-v2-1-master",
                "kling-v2-5-turbo",
                "kling-v2-6",
              ]),
            },
            ...forbidProperties([
              "image_urls",
              "image_tail",
              "dynamic_masks",
              "static_mask",
            ]),
          },
          {
            required: ["image_urls"],
            properties: {
              type: enumString(["image-to-video"]),
              image_urls: publicUrls(1, 1),
            },
            allOf: [
              disallowPropertyGroupsTogether(
                ["image_tail"],
                ["dynamic_masks", "static_mask"],
              ),
              disallowPropertyGroupsTogether(
                ["image_tail"],
                ["camera_control"],
              ),
              disallowPropertyGroupsTogether(
                ["dynamic_masks", "static_mask"],
                ["camera_control"],
              ),
            ],
          },
        ],
      },
      {
        oneOf: [
          {
            required: ["model_name"],
            properties: { model_name: enumString(["kling-v2-6"]) },
          },
          {
            properties: {
              model_name: enumString([
                "kling-v1",
                "kling-v1-5",
                "kling-v1-6",
                "kling-v2-1",
                "kling-v2-1-master",
                "kling-v2-5-turbo",
              ]),
            },
            ...forbidProperties(["sound", "aspect_ratio"]),
          },
        ],
      },
      {
        oneOf: [
          {
            properties: {
              model_name: enumString(["kling-v1", "kling-v1-5", "kling-v1-6"]),
            },
          },
          {
            required: ["model_name"],
            properties: {
              model_name: enumString([
                "kling-v2-1",
                "kling-v2-1-master",
                "kling-v2-5-turbo",
                "kling-v2-6",
              ]),
            },
            ...forbidProperties(["cfg_scale"]),
          },
        ],
      },
    ],
  },
  ElevenLabsTTSRequest: {
    type: "object",
    additionalProperties: false,
    required: ["text"],
    properties: {
      text: {
        type: "string",
        minLength: 1,
        maxLength: 5000,
        description: "Billed by Unicode code point, rounded up per 1000.",
      },
      voice: enumString(elevenLabsVoices, { default: "Rachel" }),
      stability: { type: "number", minimum: 0, maximum: 1 },
      similarity_boost: { type: "number", minimum: 0, maximum: 1 },
      style: { type: "number", minimum: 0, maximum: 1 },
      speed: { type: "number", minimum: 0.7, maximum: 1.2 },
      timestamps: { type: "boolean" },
      previous_text: { type: "string", maxLength: 5000 },
      next_text: { type: "string", maxLength: 5000 },
      language_code: {
        type: "string",
        maxLength: 500,
        description:
          "Provider language hint. The gateway does not currently validate ISO 639-1 membership.",
      },
    },
  },
});

const errorResponse = (description) => ({
  description,
  content: jsonContent(ref("ErrorResponse")),
});
const rateLimitResponse = {
  ...errorResponse("Rate limited"),
  headers: {
    "X-Retry-After": {
      description: "Retry delay in seconds.",
      schema: { type: "integer", minimum: 0 },
    },
  },
};
const submitResponses = {
  200: {
    description: "Task accepted",
    content: jsonContent(ref("TaskSubmitResponse")),
  },
  400: errorResponse("Malformed JSON or binding validation error"),
  401: errorResponse("Missing, invalid, or revoked API key"),
  402: errorResponse("Insufficient credits"),
  413: errorResponse("Request body exceeds the configured limit"),
  422: errorResponse("Model-specific validation error"),
  429: rateLimitResponse,
  500: errorResponse("Internal or upstream submission error"),
  503: errorResponse("Service or model temporarily unavailable"),
};

const operationIdForModel = (modelKey) =>
  `submit${modelKey
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("")}Task`;

const submitOperation = ({ modelKey, title, tag, schema, example }) => ({
  post: {
    operationId: operationIdForModel(modelKey),
    summary: `Submit ${title} task`,
    description:
      "Creates one asynchronous paid task. Save data.task_id and poll the status endpoint. Do not automatically retry an ambiguous submit.",
    tags: [tag],
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: ref(schema),
          ...(example ? { example } : {}),
        },
      },
    },
    responses: submitResponses,
  },
});

api.paths ??= {};
for (const model of publicModels) {
  api.paths[`/api/v1/task/submit/${model.modelKey}`] = submitOperation(model);
}

api.paths["/pricing"] = {
  get: {
    operationId: "getPublicPricing",
    summary: "List public models and current pricing",
    tags: ["Discovery"],
    security: [],
    responses: {
      200: {
        description: "Current public pricing catalog",
        content: jsonContent(ref("PricingResponse")),
      },
      500: errorResponse("Internal server error"),
    },
  },
};

api.paths["/api/v1/credits/balance"] = {
  get: {
    operationId: "getCreditBalance",
    summary: "Get current credit balance",
    tags: ["Credits"],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Current balance",
        content: jsonContent(ref("CreditBalanceResponse")),
      },
      401: errorResponse("Missing, invalid, or revoked API key"),
      429: rateLimitResponse,
      500: errorResponse("Internal server error"),
    },
  },
};

api.paths["/api/v1/task/status"] = {
  post: {
    operationId: "getTaskStatus",
    summary: "Query task status",
    description:
      "Pure database read for the authenticated task owner. Poll the same task_id; never create a replacement task automatically.",
    tags: ["Tasks"],
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: jsonContent(ref("TaskStatusRequest")),
    },
    responses: {
      200: {
        description: "Current task state",
        content: jsonContent(ref("TaskStatusResponse")),
      },
      400: errorResponse("Malformed JSON or missing task_id"),
      401: errorResponse("Missing, invalid, or revoked API key"),
      404: errorResponse("Task not found for the authenticated owner"),
      413: errorResponse("Request body exceeds the configured limit"),
      429: rateLimitResponse,
      500: errorResponse("Internal server error"),
      503: errorResponse("Service temporarily unavailable"),
    },
  },
};

const publicSubmitPaths = new Set(
  publicModels.map((model) => `/api/v1/task/submit/${model.modelKey}`),
);
const legacySubmitPaths = new Set(
  legacyModelKeys.map((modelKey) => `/api/v1/task/submit/${modelKey}`),
);
const knownSubmitPaths = new Set([...publicSubmitPaths, ...legacySubmitPaths]);
for (const path of Object.keys(api.paths)) {
  if (path.startsWith("/api/v1/task/submit/") && !knownSubmitPaths.has(path)) {
    throw new Error(`Unexpected submit path in OpenAPI: ${path}`);
  }
}
for (const path of legacySubmitPaths) {
  const pathItem = api.paths[path];
  if (!pathItem) {
    throw new Error(`Missing explicitly retained legacy submit path: ${path}`);
  }
  const operation = pathItem.post;
  if (!operation) {
    throw new Error(`Missing POST operation for legacy submit path: ${path}`);
  }
  const modelKey = path.split("/").at(-1);
  operation.operationId ??= operationIdForModel(modelKey);
  operation.deprecated = true;
  operation.tags = ["Legacy models"];
  operation.description =
    "Compatibility-only endpoint hidden from /pricing. Do not select it automatically for new integrations.";
  operation.responses = submitResponses;
}

const obsoleteResponseSchemas = [
  "ElevenLabsTTSResponse",
  "ElevenLabsTTSTurboResponse",
  "Flux2SubmitResponse",
  "FluxKontextSubmitResponse",
  "KlingSubmitResponse",
  "NanoBananaProSubmitResponse",
  "NanoBananaSubmitResponse",
  "Seedance15ProSubmitResponse",
  "SeedanceSubmitResponse",
  "SeedreamSubmitResponse",
  "Veo3SubmitResponse",
  "VirtualTryOnSubmitResponse",
  "Wan22AnimateMoveResponse",
  "Wan25SubmitResponse",
  "Wan26SubmitResponse",
  "CreditPricing",
];
for (const schemaName of obsoleteResponseSchemas) {
  delete api.components.schemas[schemaName];
}

await writeFile(openapiPath, `${JSON.stringify(api, null, 2)}\n`);
