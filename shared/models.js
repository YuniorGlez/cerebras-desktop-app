const MODEL_CONTEXT_SIZES = {
  default: {
    context: 8192,
    vision_supported: false,
  },
  "llama-4-scout-17b-16e-instruct": {
    context: 131072,
    vision_supported: true,
  },
  "llama-3.3-70b": {
    context: 128000,
    vision_supported: false,
  },
  "deepseek-r1-distill-llama-70b": {
    context: 128000,
    vision_supported: false,
  },
  "llama3.1-8b": {
    context: 8192,
    vision_supported: false,
  },
};

module.exports = { MODEL_CONTEXT_SIZES };
