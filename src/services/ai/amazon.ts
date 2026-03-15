import { AIService, Character, ChatService, ChatCallbacks } from "./types";

export class AmazonAIService implements AIService {
  async segmentDrawing(base64Image: string): Promise<Character[]> {
    try {
      const response = await fetch("/api/ai/amazon/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: "amazon.nova-2-pro-v1:0",
          body: {
            messages: [
              {
                role: "user",
                content: [
                  {
                    image: {
                      format: "png",
                      source: { bytes: base64Image.split(",")[1] || base64Image }
                    }
                  },
                  {
                    text: "Identify all characters in this drawing. Return a JSON array of objects with 'id', 'description', and 'box_2d' [ymin, xmin, ymax, xmax] where coordinates are 0-1000. Only return the JSON."
                  }
                ]
              }
            ],
            inferenceConfig: { max_new_tokens: 1000 }
          }
        })
      });

      const data = await response.json();
      const text = data.output.message.content[0].text;
      const jsonMatch = text.match(/\[.*\]/s);
      return JSON.parse(jsonMatch ? jsonMatch[0] : "[]");
    } catch (e) {
      console.error("Amazon Vision analysis failed", e);
      return [];
    }
  }

  async generateStoryImage(prompt: string, referenceImage?: string): Promise<string | null> {
    try {
      const body: any = {
        taskType: "TEXT_IMAGE_TO_IMAGE",
        textToImageParams: {
          text: `A child's drawing of: ${prompt}. Keep the exact same hand-drawn style, crayon texture, and character designs as the reference image.`,
          negativeText: "photorealistic, 3d render, professional, clean lines"
        },
        imageGenerationConfig: {
          numberOfImages: 1,
          height: 512,
          width: 512,
          cfgScale: 8.0
        }
      };

      if (referenceImage) {
        body.conditionImageParams = {
          conditionImage: referenceImage.split(",")[1] || referenceImage,
          controlMode: "CANNY_EDGE" // Or another mode suitable for style transfer
        };
      }

      const response = await fetch("/api/ai/amazon/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: "amazon.nova-canvas-v1:0",
          body
        })
      });

      const data = await response.json();
      return data.images ? `data:image/png;base64,${data.images[0]}` : null;
    } catch (e) {
      console.error("Amazon Image generation failed", e);
      return null;
    }
  }
}

export class AmazonChatService implements ChatService {
  private callbacks: ChatCallbacks;
  private history: any[] = [];
  private isConnected: boolean = false;

  constructor(callbacks: ChatCallbacks) {
    this.callbacks = callbacks;
  }

  async connect(systemInstruction: string) {
    this.history = [{ role: "assistant", content: [{ text: systemInstruction }] }];
    this.isConnected = true;
    this.callbacks.onOpen?.();
  }

  async sendMessage(text: string, image?: string) {
    if (!this.isConnected) return;

    const userContent: any[] = [{ text }];
    if (image) {
      userContent.push({
        image: {
          format: "png",
          source: { bytes: image.split(",")[1] || image }
        }
      });
    }

    this.history.push({ role: "user", content: userContent });

    try {
      const response = await fetch("/api/ai/amazon/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: "amazon.nova-2-pro-v1:0",
          body: {
            messages: this.history,
            inferenceConfig: { max_new_tokens: 1000 },
            toolConfig: {
              tools: [
                {
                  toolSpec: {
                    name: "highlight_character",
                    description: "Highlights a character in the drawing.",
                    inputSchema: {
                      json: {
                        type: "object",
                        properties: { id: { type: "string" } },
                        required: ["id"]
                      }
                    }
                  }
                },
                {
                  toolSpec: {
                    name: "generate_story_image",
                    description: "Generates a new scene for the story.",
                    inputSchema: {
                      json: {
                        type: "object",
                        properties: { prompt: { type: "string" } },
                        required: ["prompt"]
                      }
                    }
                  }
                }
              ]
            }
          }
        })
      });

      const data = await response.json();
      const message = data.output.message;
      this.history.push(message);

      for (const part of message.content) {
        if (part.text) {
          this.callbacks.onTranscription?.(part.text, false);
          // For TTS, we'd use Polly here, but for now we'll use browser TTS
          const utterance = new SpeechSynthesisUtterance(part.text);
          window.speechSynthesis.speak(utterance);
        }
        if (part.toolUse) {
          const { name, input, toolUseId } = part.toolUse;
          if (name === "highlight_character") {
            this.callbacks.onHighlightCharacter?.(input.id);
          } else if (name === "generate_story_image") {
            this.callbacks.onGenerateImage?.(input.prompt);
          }
          // Send tool response back to keep history consistent
          this.history.push({
            role: "user",
            content: [{
              toolResult: {
                toolUseId,
                content: [{ json: { success: true } }]
              }
            }]
          });
        }
      }
    } catch (e) {
      console.error("Amazon Chat failed", e);
      this.callbacks.onError?.(e);
    }
  }

  sendAudio(base64Audio: string) {
    // In a real app, we'd use Amazon Transcribe here.
    // For this demo, we'll assume the frontend handles STT and calls sendMessage.
    console.log("Audio input received (simulated)");
  }

  sendImage(base64Image: string) {
    this.sendMessage("Look at this part of my drawing!", base64Image);
  }

  close() {
    this.isConnected = false;
    this.callbacks.onClose?.();
  }
}
