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
    modelKey: "gpt-image-2.5",
    title: "GPT Image 2.5",
    tag: "Image generation",
    schema: "GPTImage25SubmitRequest",
    example: {
      prompt: "An orange mechanical keyboard on a dark desk",
      version: "flare",
      resolution: "2K",
    },
  },
  {
    modelKey: "qwen-image-2.0",
    title: "Qwen Image 2.0",
    tag: "Image generation",
    schema: "QwenImage2SubmitRequest",
    example: {
      prompt: "A minimalist poster with the headline SUMMER SALE",
      aspect_ratio: "3:4",
      resolution: "2K",
    },
  },
  {
    modelKey: "qwen-image-2.0-pro",
    title: "Qwen Image 2.0 Pro",
    tag: "Image generation",
    schema: "QwenImage2SubmitRequest",
    example: {
      prompt: "A bilingual tea shop menu board with clean serif lettering",
      aspect_ratio: "4:3",
      resolution: "2K",
    },
  },
  {
    modelKey: "seedream-5-pro",
    title: "Seedream 5.0 Pro",
    tag: "Image generation",
    schema: "Seedream5ProSubmitRequest",
    example: {
      prompt: "A bilingual coffee shop menu board with clean typography",
      aspect_ratio: "3:4",
      resolution: "1.5K",
      output_format: "png",
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
  {
    modelKey: "kling-v3",
    title: "Kling v3",
    tag: "Video generation",
    schema: "KlingV3SubmitRequest",
    example: {
      prompt: "Neon lights reflected on a wet Tokyo crossing at night",
      type: "text-to-video",
      resolution: "1080p",
      duration: 5,
    },
  },
  {
    modelKey: "kling-v3-omni",
    title: "Kling v3 Omni",
    tag: "Video generation",
    schema: "KlingV3OmniSubmitRequest",
    example: {
      prompt:
        "The character in <<<image_1>>> walks into the scene in <<<image_2>>>",
      type: "reference-to-video",
      image_urls: [
        "https://example.com/character.jpg",
        "https://example.com/scene.jpg",
      ],
      duration: 5,
    },
  },
  {
    modelKey: "seedance-2.0-mini",
    title: "Seedance 2.0 Mini",
    tag: "Video generation",
    schema: "Seedance20MiniSubmitRequest",
    example: {
      prompt: "A kitten yawning at the camera, soft morning light",
      type: "text-to-video",
      resolution: "720p",
      duration: 5,
    },
  },
  {
    modelKey: "pixverse-v6",
    title: "PixVerse V6",
    tag: "Video generation",
    schema: "PixverseV6SubmitRequest",
    example: {
      prompt: "A neon-lit alley at night, light rain, slow dolly forward",
      type: "text-to-video",
      aspect_ratio: "16:9",
      resolution: "720p",
      duration: 5,
    },
  },
  {
    modelKey: "grok-imagine-video-1.5",
    title: "Grok Imagine Video 1.5",
    tag: "Video generation",
    schema: "GrokImagineVideo15SubmitRequest",
    example: {
      prompt: "Waves crash against a lighthouse at golden hour",
      aspect_ratio: "16:9",
      resolution: "720p",
      duration: 6,
    },
  },
  {
    modelKey: "gemini-omni-flash",
    title: "Gemini Omni Flash",
    tag: "Video generation",
    schema: "GeminiOmniFlashSubmitRequest",
    example: {
      prompt: "A paper lantern drifts over a quiet river at dusk",
      aspect_ratio: "16:9",
      resolution: "720p",
      duration: 6,
    },
  },
  {
    modelKey: "wan-2.6-flash",
    title: "Wan 2.6 Flash",
    tag: "Video generation",
    schema: "Wan26FlashSubmitRequest",
    example: {
      prompt: "The person smiles and waves while the camera slowly zooms in",
      image_urls: ["https://example.com/portrait.jpg"],
      resolution: "720p",
      duration: 5,
    },
  },
  {
    modelKey: "suno",
    title: "Suno",
    tag: "Audio generation",
    schema: "SunoSubmitRequest",
    example: {
      prompt: "Late-night city lo-fi piano with the sound of rain",
      instrumental: true,
    },
  },
];

// Explicitly retired public models are removed from an existing generated spec.
// Keep them here until every checked-in OpenAPI source has stopped publishing them.
// runway-gen3 was taken offline on 2026-09-30: submit returns 503 model_unavailable.
export const retiredModelKeys = [
  "eleven-labs-tts-v2",
  "eleven-labs-tts-turbo-25",
  "runway-gen3",
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
