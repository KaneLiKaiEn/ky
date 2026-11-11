import CryptoJS from "crypto-js";

const ENDPOINT = "asr.tencentcloudapi.com";
const SERVICE = "asr";

interface TencentAsrResponse {
  Response?: {
    Result?: string;
    Error?: {
      Code?: string;
      Message?: string;
    };
  };
}

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("读取录音失败"));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.split(",")[1] ?? "");
    };
    reader.readAsDataURL(blob);
  });

const createAuthorization = (
  payload: object,
  secretId: string,
  secretKey: string,
) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().split("T")[0];
  const payloadText = JSON.stringify(payload);
  const canonicalHeaders =
    `content-type:application/json; charset=utf-8\nhost:${ENDPOINT}\n`;
  const signedHeaders = "content-type;host";
  const hashedPayload = CryptoJS.SHA256(payloadText).toString(
    CryptoJS.enc.Hex,
  );
  const canonicalRequest = [
    "POST",
    "/",
    "",
    canonicalHeaders,
    signedHeaders,
    hashedPayload,
  ].join("\n");
  const scope = `${date}/${SERVICE}/tc3_request`;
  const stringToSign = [
    "TC3-HMAC-SHA256",
    timestamp,
    scope,
    CryptoJS.SHA256(canonicalRequest).toString(CryptoJS.enc.Hex),
  ].join("\n");
  const dateKey = CryptoJS.HmacSHA256(date, `TC3${secretKey}`);
  const serviceKey = CryptoJS.HmacSHA256(SERVICE, dateKey);
  const signingKey = CryptoJS.HmacSHA256("tc3_request", serviceKey);
  const signature = CryptoJS.HmacSHA256(stringToSign, signingKey).toString(
    CryptoJS.enc.Hex,
  );

  return {
    authorization:
      `TC3-HMAC-SHA256 Credential=${secretId}/${scope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`,
    timestamp,
  };
};

export const recognizeSpeech = async (audio: Blob): Promise<string> => {
  const secretId = import.meta.env.VITE_TENCENT_ASR_SECRET_ID;
  const secretKey = import.meta.env.VITE_TENCENT_ASR_SECRET_KEY;
  if (!secretId || !secretKey) {
    throw new Error("未配置腾讯云语音识别密钥");
  }

  const payload = {
    ProjectId: 0,
    SubServiceType: 2,
    EngSerViceType: "16k_zh",
    SourceType: 1,
    VoiceFormat: "wav",
    UsrAudioKey: `web2-${Date.now()}`,
    Data: await blobToBase64(audio),
    DataLen: audio.size,
  };
  const { authorization, timestamp } = createAuthorization(
    payload,
    secretId,
    secretKey,
  );

  const response = await fetch("/asr", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: authorization,
      "X-TC-Action": "SentenceRecognition",
      "X-TC-Version": "2019-06-14",
      "X-TC-Timestamp": String(timestamp),
      "X-TC-Region": "ap-shanghai",
    },
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as TencentAsrResponse;

  if (!response.ok) {
    throw new Error(`语音识别请求失败（${response.status}）`);
  }
  if (result.Response?.Error) {
    throw new Error(
      result.Response.Error.Message ||
        result.Response.Error.Code ||
        "语音识别失败",
    );
  }
  return result.Response?.Result ?? "";
};
