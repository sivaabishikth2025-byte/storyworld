import {
  BedrockRuntimeClient,
  GetAsyncInvokeCommand,
  StartAsyncInvokeCommand,
} from "@aws-sdk/client-bedrock-runtime"
import { GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export const AWS_REGION = "us-east-1"
export const VIDEO_BUCKET = "storyworld-cinematics-120569623789"
export const REEL_MODEL = "amazon.nova-reel-v1:1"
export const OPENING_SECONDS = 48
export const EVENT_SECONDS = 12

const bedrock = new BedrockRuntimeClient({ region: AWS_REGION })
const s3 = new S3Client({ region: AWS_REGION })

export function clampDurationSeconds(seconds: number) {
  const n = Math.round(seconds / 6) * 6
  return Math.min(120, Math.max(12, n))
}

function clampDuration(seconds: number) {
  return clampDurationSeconds(seconds)
}

export async function startTextVideo(prompt: string, durationSeconds = OPENING_SECONDS) {
  const duration = clampDuration(durationSeconds)
  const text = prompt.slice(0, 3900)
  const invocation = await bedrock.send(
    new StartAsyncInvokeCommand({
      modelId: REEL_MODEL,
      modelInput: {
        taskType: "MULTI_SHOT_AUTOMATED",
        multiShotAutomatedParams: { text },
        videoGenerationConfig: {
          durationSeconds: duration,
          fps: 24,
          dimension: "1280x720",
          seed: Math.floor(Math.random() * 1_000_000),
        },
      },
      outputDataConfig: {
        s3OutputDataConfig: {
          s3Uri: `s3://${VIDEO_BUCKET}/jobs/`,
        },
      },
    }),
  )
  return {
    invocationArn: invocation.invocationArn as string,
    duration,
  }
}

export async function startImageVideo(prompt: string, imagePngBase64: string, durationSeconds = EVENT_SECONDS) {
  const duration = durationSeconds <= 6 ? 6 : clampDuration(durationSeconds)
  const invocation = await bedrock.send(
    new StartAsyncInvokeCommand({
      modelId: REEL_MODEL,
      modelInput:
        duration <= 6
          ? {
              taskType: "TEXT_VIDEO",
              textToVideoParams: {
                text: prompt.slice(0, 512),
                images: [{ format: "png", source: { bytes: imagePngBase64 } }],
              },
              videoGenerationConfig: {
                durationSeconds: 6,
                fps: 24,
                dimension: "1280x720",
                seed: Math.floor(Math.random() * 1_000_000),
              },
            }
          : {
              taskType: "MULTI_SHOT_AUTOMATED",
              multiShotAutomatedParams: { text: prompt.slice(0, 3900) },
              videoGenerationConfig: {
                durationSeconds: duration,
                fps: 24,
                dimension: "1280x720",
                seed: Math.floor(Math.random() * 1_000_000),
              },
            },
      outputDataConfig: {
        s3OutputDataConfig: {
          s3Uri: `s3://${VIDEO_BUCKET}/jobs/`,
        },
      },
    }),
  )
  return { invocationArn: invocation.invocationArn as string, duration }
}

export async function getVideoJob(invocationArn: string) {
  const job = await bedrock.send(new GetAsyncInvokeCommand({ invocationArn }))
  const status = job.status as "InProgress" | "Completed" | "Failed"
  let videoUrl: string | null = null
  let videoKey: string | null = null
  if (status === "Completed") {
    const s3Uri = job.outputDataConfig?.s3OutputDataConfig?.s3Uri
    videoKey = await findMp4Key(invocationArn, s3Uri)
    if (videoKey) {
      videoUrl = `/api/video/stream?key=${encodeURIComponent(videoKey)}`
    }
  }
  return {
    status,
    failureMessage: job.failureMessage ?? null,
    videoUrl,
    videoKey,
    submitTime: job.submitTime?.toISOString() ?? null,
  }
}

export async function streamVideo(key: string) {
  const object = await s3.send(new GetObjectCommand({ Bucket: VIDEO_BUCKET, Key: key }))
  return object
}

export async function downloadVideoBytes(key: string) {
  const object = await s3.send(new GetObjectCommand({ Bucket: VIDEO_BUCKET, Key: key }))
  const bytes = await object.Body?.transformToByteArray()
  if (!bytes?.byteLength) throw new Error("empty video object")
  return bytes
}

export async function presignVideo(key: string) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: VIDEO_BUCKET, Key: key }), { expiresIn: 60 * 60 })
}

async function findMp4Key(invocationArn: string, s3Uri?: string) {
  const id = invocationArn.split("/").pop() || ""
  const keys: string[] = [`jobs/${id}/output.mp4`]
  if (s3Uri) {
    const parsed = parseS3Uri(s3Uri.replace(/\/$/, ""))
    if (parsed.key.endsWith(".mp4")) keys.push(parsed.key)
    else keys.push(joinKey(parsed.key, "output.mp4"))
  }

  for (const key of [...new Set(keys)]) {
    if (!key.endsWith(".mp4")) continue
    try {
      await s3.send(new HeadObjectCommand({ Bucket: VIDEO_BUCKET, Key: key }))
      return key
    } catch {
      /* try next */
    }
  }

  const prefixes = [`jobs/${id}/`, s3Uri ? `${parseS3Uri(s3Uri.replace(/\/$/, "")).key}/` : ""]
  for (const prefix of prefixes) {
    if (!prefix) continue
    try {
      const listed = await s3.send(
        new ListObjectsV2Command({ Bucket: VIDEO_BUCKET, Prefix: prefix.replace(/^\/+/, ""), MaxKeys: 40 }),
      )
      const mp4 = listed.Contents?.find((item) => item.Key?.endsWith(".mp4"))
      if (mp4?.Key) return mp4.Key
    } catch {
      /* try next */
    }
  }
  return null
}

function joinKey(...parts: string[]) {
  return parts.filter(Boolean).join("/").replace(/\/+/g, "/")
}

function parseS3Uri(uri: string) {
  const raw = uri.replace("s3://", "")
  const slash = raw.indexOf("/")
  if (slash < 0) return { bucket: raw, key: "" }
  return { bucket: raw.slice(0, slash), key: raw.slice(slash + 1) }
}

export async function writeCinematicPrompt(storyPrompt: string, title: string, logline: string) {
  return [
    `Photoreal cinematic film, 24fps, anamorphic 2.39, no captions, no titles, no UI.`,
    `Story: ${storyPrompt}`,
    `World: ${title}. ${logline}`,
    `Sequence of connected shots: establishing wide of the place, interior close-up of the protagonist waking or arriving, a corridor or hall with something moving at the far end, a window or threshold, then a first-person step into the space.`,
    `Camera: slow dollies, motivated practical lights, shallow depth of field, film grain.`,
    `Do not show logos or readable text.`,
  ].join("\n")
}

export function writeEventPrompt(title: string, captions: string[]) {
  return [
    `Photoreal cinematic film, 24fps, anamorphic 2.39, no captions, no titles, no UI.`,
    `Scene: ${title}.`,
    ...captions.filter(Boolean),
    `Slow motivated camera, practical lights, film grain, connected shots of this moment.`,
    `Do not show logos or readable text.`,
  ].join(" ")
}
