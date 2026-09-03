export const publicModels = [
  {
    modelKey: "seedream-4",
    title: "Seedream 4.0",
    tag: "Image generation",
    schema: "SeedreamSubmitRequest",
    example: {
      prompt: "A neon city at night",
      resolution: "2K",
      batch_size: 1,
    },
  },
  {
    modelKey: "seedream-4.5",
    title: "Seedream 4.5",
    tag: "Image generation",
    schema: "SeedreamSubmitRequest",
    example: { prompt: "A cinematic mountain landscape", resolution: "2K" },
  },
  {
    modelKey: "nano-banana-pro",
    title: "Nano Banana Pro",
    tag: "Image generation",
    schema: "NanoBananaProSubmitRequest",
    example: {
      prompt: "A studio product photo",
      resolution: "2K",
      output_format: "png",
    },
  },
  {
    modelKey: "nano-banana",
    title: "Nano Banana",
    tag: "Image generation",
    schema: "NanoBananaSubmitRequest",
    example: { prompt: "A warm editorial portrait", output_format: "png" },
  },
  {
    modelKey: "nano-banana-2",
    title: "Nano Banana 2",
    tag: "Image generation",
    schema: "NanoBanana2SubmitRequest",
    example: { prompt: "A clean isometric city", resolution: "1K" },
  },
  {
    modelKey: "nano-banana-2-lite",
    title: "Nano Banana 2 Lite",
    tag: "Image generation",
    schema: "NanoBanana2LiteSubmitRequest",
    example: { prompt: "A playful sticker illustration", aspect_ratio: "1:1" },
  },
  {
    modelKey: "gpt-image-2",
    title: "GPT Image 2",
    tag: "Image generation",
    schema: "GPTImage2SubmitRequest",
    example: {
      prompt: "An orange mechanical keyboard on a dark desk",
      quality: "high",
    },
  },
  {
    modelKey: "runway-gen3",
    title: "Runway Gen-3",
    tag: "Video generation",
    schema: "RunwayGen3SubmitRequest",
    example: {
      prompt: "A paper boat crosses a moonlit lake",
      type: "text-to-video",
      duration: 5,
    },
  },
  {
    modelKey: "veo3",
    title: "Veo 3.1",
    tag: "Video generation",
    schema: "Veo3SubmitRequest",
    example: {
      prompt: "A paper boat in a neon canal",
      type: "text-to-video",
      duration: 8,
      model: "veo3_lite",
      resolution: "720p",
    },
  },
  {
    modelKey: "seedance-pro-fast",
    title: "Seedance Pro Fast",
    tag: "Video generation",
    schema: "SeedanceSubmitRequest",
    example: {
      prompt: "A cat plays piano",
      type: "text-to-video",
      duration: 5,
    },
  },
  {
    modelKey: "seedance-1.5-pro",
    title: "Seedance 1.5 Pro",
    tag: "Video generation",
    schema: "Seedance15ProSubmitRequest",
    example: {
      prompt: "Ocean waves at sunrise",
      type: "text-to-video",
      duration: 5,
      resolution: "720p",
    },
  },
  {
    modelKey: "kling-ai",
    title: "Kling AI",
    tag: "Video generation",
    schema: "KlingSubmitRequest",
    example: {
      prompt: "A character walks through a forest",
      type: "text-to-video",
      quality_mode: "pro",
      duration: 5,
      model_name: "kling-v2-1-master",
    },
  },
];

// Explicitly retired public models are removed from an existing generated spec.
// Keep them here until every checked-in OpenAPI source has stopped publishing them.
export const retiredModelKeys = [
  "eleven-labs-tts-v2",
  "eleven-labs-tts-turbo-25",
];

// Compatibility-only paths that are intentionally retained in the public spec.
// Adding a hidden backend model here requires an explicit documentation decision.
export const legacyModelKeys = [
  "flux-kontext-pro",
  "flux-kontext-max",
  "flux-2-pro",
  "flux-2-flex",
  "virtual-try-on",
  "wan-2-5",
  "wan-2-6",
  "wan22-animate-move",
];
