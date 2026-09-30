import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  legacyModelKeys,
  publicModels,
  retiredModelKeys,
} from "./openapi-model-manifest.mjs";

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
  {
    name: "Audio generation",
    description: "Asynchronous music and audio tasks.",
  },
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
  GPTImage25SubmitRequest: {
    type: "object",
    additionalProperties: false,
    required: ["prompt"],
    description:
      "Omit image_urls for text-to-image; provide 1-16 images for image-to-image editing. One image per request. version, aspect_ratio, and reference images do not change the price.",
    properties: {
      prompt: byteLimitedPrompt(20000),
      version: enumString(["flare", "sunburst"], {
        default: "flare",
        description:
          "flare is faster; sunburst gives finer edits for product, ad, and multi-turn editing. Same price.",
      }),
      image_urls: {
        type: "array",
        maxItems: 16,
        items: {
          type: "string",
          pattern: "^(https?://|data:image/(jpeg|png|webp);base64,)",
          description:
            "HTTP(S) URL or base64 data URI. JPEG, PNG, or WebP only.",
        },
      },
      aspect_ratio: enumString(
        [
          "auto",
          "1:1",
          "16:9",
          "9:16",
          "4:3",
          "3:4",
          "3:2",
          "2:3",
          "5:4",
          "4:5",
          "21:9",
        ],
        { default: "auto" },
      ),
      resolution: enumString(["1K", "2K", "4K"], {
        default: "1K",
        description: "Billed per image: 1K = 13, 2K = 21, 4K = 32 credits.",
      }),
    },
  },
  Veo3SubmitRequest: {
    type: "object",
    additionalProperties: false,
    required: ["prompt", "type"],
    description:
      "text-to-video must omit image_urls; image-to-video requires 1-2 images; reference-to-video requires 1-3 images and duration 8. veo3_quality supports 6 or 8 seconds and does not support reference-to-video. model and resolution select a fixed per-video price; duration does not change it.",
    properties: {
      prompt: { type: "string", minLength: 1 },
      type: enumString([
        "text-to-video",
        "image-to-video",
        "reference-to-video",
      ]),
      image_urls: publicUrls(3),
      duration: { type: "integer", enum: [4, 6, 8], default: 8 },
      resolution: enumString(["720p", "1080p", "4k"], { default: "720p" }),
      aspect_ratio: enumString(["16:9", "9:16", "Auto", "auto"], {
        default: "16:9",
      }),
      model: enumString(["veo3_fast", "veo3_lite", "veo3_quality"], {
        default: "veo3_fast",
        description:
          "veo3_fast (default), veo3_lite (lowest cost), or veo3_quality (highest fidelity; 6 or 8 seconds, no reference-to-video).",
      }),
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
            },
          },
        ],
      },
      {
        oneOf: [
          {
            properties: { model: enumString(["veo3_fast", "veo3_lite"]) },
          },
          {
            required: ["model"],
            properties: {
              model: enumString(["veo3_quality"]),
              type: enumString(["text-to-video", "image-to-video"]),
              duration: { type: "integer", enum: [6, 8] },
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
});

const charLimitedPrompt = (maxLength, description) => ({
  type: "string",
  minLength: 1,
  maxLength,
  description:
    description ?? `Required prompt, at most ${maxLength} Unicode characters.`,
});
const optionalText = (maxLength, description) => ({
  type: "string",
  maxLength,
  ...(description ? { description } : {}),
});
const noImages = {
  not: {
    required: ["image_urls"],
    properties: { image_urls: {} },
  },
};
const klingV3Properties = (maxImages) => ({
  prompt: charLimitedPrompt(2500),
  image_urls: publicUrls(maxImages),
  resolution: enumString(["720p", "1080p"], {
    default: "720p",
    description: "720p (standard) or 1080p (professional). 4K is not offered.",
  }),
  duration: { type: "integer", minimum: 3, maximum: 15, default: 5 },
  aspect_ratio: enumString(["16:9", "9:16", "1:1"], {
    description:
      "Defaults to 16:9. In image-to-video the first frame's ratio may take precedence.",
  }),
  generate_audio: {
    type: "boolean",
    default: false,
    description:
      "Generate native audio. Audio selects a higher per-second rate.",
  },
  negative_prompt: optionalText(2500),
});

Object.assign(api.components.schemas, {
  Seedream5ProSubmitRequest: {
    type: "object",
    additionalProperties: false,
    required: ["prompt"],
    description:
      "Omit image_urls for text-to-image or provide exactly one reference image for editing. One image per request. Billed per image by resolution; 1.5K costs the same as 1K. aspect_ratio, output_format, and the reference image do not change the price.",
    properties: {
      prompt: charLimitedPrompt(4000),
      image_urls: {
        type: "array",
        maxItems: 1,
        items: {
          type: "string",
          pattern: "^(https?://|data:image/(jpeg|png|webp);base64,)",
          description:
            "HTTP(S) URL or base64 data URI. JPEG, PNG, or WebP only.",
        },
      },
      aspect_ratio: enumString(
        [
          "auto",
          "1:1",
          "4:3",
          "3:4",
          "16:9",
          "9:16",
          "3:2",
          "2:3",
          "2:1",
          "1:2",
          "21:9",
        ],
        { default: "auto" },
      ),
      resolution: enumString(["1K", "1.5K", "2K"], {
        default: "1K",
        description:
          "Case-insensitive. Billed per image: 1K = 44, 1.5K = 44, 2K = 89 credits.",
      }),
      output_format: enumString(["jpeg", "png"], { default: "jpeg" }),
    },
  },
  QwenImage2SubmitRequest: {
    type: "object",
    additionalProperties: false,
    required: ["prompt"],
    description:
      "Shared by qwen-image-2.0 and qwen-image-2.0-pro. Omit image_urls for text-to-image or provide 1-3 public URLs for image-to-image. One image per request; 1K and 2K cost the same.",
    properties: {
      prompt: charLimitedPrompt(800),
      negative_prompt: optionalText(500),
      image_urls: publicUrls(3),
      aspect_ratio: enumString(
        ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3"],
        { default: "1:1" },
      ),
      resolution: enumString(["1K", "2K"], {
        default: "1K",
        description: "Case-insensitive. Does not change the price.",
      }),
    },
  },
  KlingV3SubmitRequest: {
    type: "object",
    additionalProperties: false,
    required: ["prompt", "type"],
    description:
      "text-to-video must omit image_urls; image-to-video takes 1 image (first frame) or 2 images (first and last frame). Billed per second by resolution and generate_audio.",
    properties: {
      ...klingV3Properties(2),
      type: enumString(["text-to-video", "image-to-video"]),
    },
    allOf: [
      {
        oneOf: [
          {
            properties: { type: enumString(["text-to-video"]) },
            ...noImages,
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
  KlingV3OmniSubmitRequest: {
    type: "object",
    additionalProperties: false,
    required: ["prompt", "type"],
    description:
      "text-to-video must omit image_urls; image-to-video takes 1-2 frames (first, last); reference-to-video takes 1-7 reference images that the prompt can cite as <<<image_1>>> ... <<<image_N>>>. Reference images are not billed.",
    properties: {
      ...klingV3Properties(7),
      type: enumString([
        "text-to-video",
        "image-to-video",
        "reference-to-video",
      ]),
    },
    allOf: [
      {
        oneOf: [
          {
            properties: { type: enumString(["text-to-video"]) },
            ...noImages,
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
              image_urls: publicUrls(7, 1),
            },
          },
        ],
      },
    ],
  },
  Seedance20MiniSubmitRequest: {
    type: "object",
    additionalProperties: false,
    required: ["prompt", "type"],
    description:
      "text-to-video must omit image_urls; image-to-video takes 1 image (first frame) or 2 images (first and last frame). Billed per second by resolution; audio is included at no extra charge.",
    properties: {
      prompt: charLimitedPrompt(4000),
      type: enumString(["text-to-video", "image-to-video"]),
      image_urls: publicUrls(2),
      aspect_ratio: enumString(
        ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "adaptive", "auto"],
        {
          description:
            "Defaults to 16:9 for text-to-video and adaptive for image-to-video. auto is an alias of adaptive.",
        },
      ),
      resolution: enumString(["480p", "720p"], { default: "720p" }),
      duration: { type: "integer", minimum: 4, maximum: 15, default: 5 },
      generate_audio: { type: "boolean", default: true },
      seed: {
        type: "integer",
        minimum: -1,
        maximum: 4294967295,
        description: "-1 means random.",
      },
    },
    allOf: [
      {
        oneOf: [
          {
            properties: { type: enumString(["text-to-video"]) },
            ...noImages,
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
  PixverseV6SubmitRequest: {
    type: "object",
    additionalProperties: false,
    required: ["prompt", "type"],
    description:
      "text-to-video must omit image_urls. image-to-video takes 1 image, or 2 images for a first/last-frame transition (duration 5 or 8 only), and must omit aspect_ratio because the output follows the input image. reference-to-video fuses 1-7 reference images. Billed per second by resolution and generate_audio.",
    properties: {
      prompt: charLimitedPrompt(5000),
      type: enumString([
        "text-to-video",
        "image-to-video",
        "reference-to-video",
      ]),
      image_urls: publicUrls(7),
      aspect_ratio: enumString(
        ["16:9", "4:3", "1:1", "3:4", "9:16", "2:3", "3:2", "21:9"],
        {
          description:
            "Text-to-video and reference-to-video only; defaults to 16:9. Rejected for image-to-video.",
        },
      ),
      resolution: enumString(["360p", "540p", "720p", "1080p"], {
        default: "540p",
      }),
      duration: { type: "integer", minimum: 1, maximum: 15, default: 5 },
      generate_audio: {
        type: "boolean",
        default: false,
        description:
          "Add an audio track. Audio selects a higher per-second rate.",
      },
      negative_prompt: optionalText(2048),
      seed: { type: "integer", minimum: 0, maximum: 2147483647 },
    },
    allOf: [
      {
        oneOf: [
          {
            properties: { type: enumString(["text-to-video"]) },
            ...noImages,
          },
          {
            required: ["image_urls"],
            properties: {
              type: enumString(["image-to-video"]),
              image_urls: publicUrls(2, 1),
            },
            not: {
              required: ["aspect_ratio"],
              properties: { aspect_ratio: {} },
            },
          },
          {
            required: ["image_urls"],
            properties: {
              type: enumString(["reference-to-video"]),
              image_urls: publicUrls(7, 1),
            },
          },
        ],
      },
    ],
  },
  GrokImagineVideo15SubmitRequest: {
    type: "object",
    additionalProperties: false,
    required: ["prompt"],
    description:
      "type is optional and inferred from image_urls: none means text-to-video, 1-7 images means image-to-video. With reference images the output follows the reference image's aspect ratio. Billed per second by resolution; reference images are not billed.",
    properties: {
      prompt: { type: "string", minLength: 1 },
      type: enumString(["text-to-video", "image-to-video"]),
      image_urls: publicUrls(7),
      aspect_ratio: enumString(["16:9", "9:16", "1:1", "3:2", "2:3"], {
        default: "16:9",
      }),
      resolution: enumString(["480p", "720p"], { default: "720p" }),
      duration: { type: "integer", minimum: 6, maximum: 15, default: 6 },
    },
    allOf: [
      {
        not: {
          required: ["type", "image_urls"],
          properties: { type: enumString(["text-to-video"]) },
        },
      },
      {
        not: {
          required: ["type"],
          properties: { type: enumString(["image-to-video"]) },
          not: { required: ["image_urls"] },
        },
      },
    ],
  },
  GeminiOmniFlashSubmitRequest: {
    type: "object",
    additionalProperties: false,
    required: ["prompt"],
    description:
      "type is optional and inferred from image_urls: none means text-to-video, 1 image means image-to-video (first frame), 3 images means reference-to-video. reference-to-video accepts 1 or 3 images (2 is rejected). Billed per request by resolution and duration; reference images are not billed.",
    properties: {
      prompt: { type: "string", minLength: 1 },
      type: enumString([
        "text-to-video",
        "image-to-video",
        "reference-to-video",
      ]),
      image_urls: publicUrls(3),
      aspect_ratio: enumString(["16:9", "9:16"], { default: "16:9" }),
      resolution: enumString(["720p", "1080p", "4k"], { default: "720p" }),
      duration: { type: "integer", enum: [4, 6, 8, 10], default: 6 },
    },
    allOf: [
      {
        not: {
          required: ["image_urls"],
          properties: { image_urls: { minItems: 2, maxItems: 2 } },
        },
      },
      {
        not: {
          required: ["type", "image_urls"],
          properties: { type: enumString(["text-to-video"]) },
        },
      },
      {
        not: {
          required: ["type", "image_urls"],
          properties: {
            type: enumString(["image-to-video"]),
            image_urls: { minItems: 2 },
          },
        },
      },
    ],
  },
  Wan26FlashSubmitRequest: {
    type: "object",
    additionalProperties: false,
    required: ["image_urls"],
    description:
      "Image-to-video only, silent output. Provide exactly one first-frame image; the output aspect ratio follows the image. Billed per second by resolution.",
    properties: {
      image_urls: publicUrls(1, 1),
      prompt: optionalText(1500, "Optional prompt, at most 1500 characters."),
      type: enumString(["image-to-video"], { default: "image-to-video" }),
      resolution: enumString(["720p", "1080p"], { default: "720p" }),
      duration: { type: "integer", minimum: 2, maximum: 15, default: 5 },
      negative_prompt: optionalText(500),
      prompt_extend: {
        type: "boolean",
        description: "Smart prompt rewriting. Enabled unless set to false.",
      },
      shot_type: enumString(["single", "multi"], {
        description:
          "Single-shot or multi-shot narrative. Requires prompt_extend not to be false.",
      }),
      seed: { type: "integer", minimum: 0 },
    },
    not: {
      required: ["shot_type", "prompt_extend"],
      properties: { prompt_extend: { enum: [false] } },
    },
  },
  SunoSubmitRequest: {
    type: "object",
    additionalProperties: false,
    description:
      "Music generation. Inspiration mode (custom=false) takes a song description in prompt. Custom mode (custom=true) takes lyrics in prompt plus optional title, style, negative_tags, max_mode, and duration. One request usually returns 2 tracks in result_urls. Billed per request; max_mode doubles the price.",
    properties: {
      prompt: {
        type: "string",
        description:
          "Inspiration mode: required song description, at most 3000 characters. Custom mode: lyrics, at most 5000 characters; required unless instrumental is true.",
        maxLength: 5000,
      },
      custom: { type: "boolean", default: false },
      instrumental: { type: "boolean", default: false },
      version: enumString(["v6", "v6-wild", "v6-mini"], {
        default: "v6",
        description: "Case-insensitive. All versions cost the same.",
      }),
      title: optionalText(80, "Custom mode only."),
      style: optionalText(1000, "Custom mode only. Style tags."),
      negative_tags: optionalText(1000, "Custom mode only. Styles to avoid."),
      vocal_gender: enumString(["Male", "Female"], {
        description:
          "Case-insensitive; m and f are accepted. Cannot be combined with instrumental=true.",
      }),
      max_mode: {
        type: "boolean",
        default: false,
        description: "Custom mode only. Higher quality at double the price.",
      },
      duration: {
        type: "integer",
        minimum: 10,
        maximum: 360,
        description:
          "Custom mode only. Target length in seconds; actual length may differ. Does not change the price.",
      },
    },
    allOf: [
      {
        oneOf: [
          {
            required: ["prompt"],
            properties: {
              custom: { type: "boolean", enum: [false] },
              prompt: { type: "string", minLength: 1, maxLength: 3000 },
              max_mode: { type: "boolean", enum: [false] },
            },
            ...forbidProperties([
              "title",
              "style",
              "negative_tags",
              "duration",
            ]),
          },
          {
            required: ["custom"],
            properties: { custom: { type: "boolean", enum: [true] } },
          },
        ],
      },
      {
        not: {
          required: ["instrumental", "vocal_gender"],
          properties: { instrumental: { enum: [true] } },
        },
      },
    ],
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
for (const modelKey of retiredModelKeys) {
  delete api.paths[`/api/v1/task/submit/${modelKey}`];
}
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

// wan-2-6 stays a hidden legacy model; since 2026-09-30 it only offers 720p.
const wan26Schema = api.components.schemas.Wan26SubmitRequest;
if (wan26Schema?.properties?.resolution) {
  wan26Schema.properties.resolution = enumString(["720p"], {
    default: "720p",
    description:
      "Only 720p is offered (97 credits/s). 1080p is no longer available.",
  });
}
const wan26Examples =
  api.paths["/api/v1/task/submit/wan-2-6"]?.post?.requestBody?.content?.[
    "application/json"
  ]?.examples ?? {};
for (const example of Object.values(wan26Examples)) {
  if (example?.value?.resolution) example.value.resolution = "720p";
}

const obsoleteSchemas = [
  "ElevenLabsTTSRequest",
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
  "RunwayGen3SubmitRequest",
];
for (const schemaName of obsoleteSchemas) {
  delete api.components.schemas[schemaName];
}

await writeFile(openapiPath, `${JSON.stringify(api, null, 2)}\n`);
